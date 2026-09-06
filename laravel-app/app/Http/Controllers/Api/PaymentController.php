<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PaymentController extends Controller
{
    /**
     * Price of "online class" access, in the smallest currency unit
     * (paise for INR — so 49900 = INR 499.00). Override with
     * RAZORPAY_COURSE_AMOUNT in .env if the price changes.
     */
    private function amount(): int
    {
        return (int) env('RAZORPAY_COURSE_AMOUNT', 49900);
    }

    private function currency(): string
    {
        return env('RAZORPAY_CURRENCY', 'INR');
    }

    private function keySecret(): string
    {
        return (string) env('RAZORPAY_KEY_SECRET');
    }

    private function webhookSecret(): string
    {
        return (string) env('RAZORPAY_WEBHOOK_SECRET');
    }

    /**
     * POST /api/payment/create-order (auth:user)
     * Asks Razorpay for an order id, records it locally as "created", and
     * hands back what the frontend Checkout widget needs to open the modal.
     * Nothing is marked paid here -- that only happens once a payment is
     * confirmed by /verify (fast path, browser-triggered) or /webhook
     * (authoritative, Razorpay-triggered -- see markPaid() below).
     */
    public function createOrder(Request $request)
    {
        $user = $request->attributes->get('auth_user');
        $keyId = env('RAZORPAY_KEY_ID');
        $keySecret = $this->keySecret();

        if (! $keyId || ! $keySecret) {
            return response()->json([
                'message' => 'Payments are not configured yet. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to the backend .env file.',
            ], 500);
        }

        // Reuse an already-created (unpaid) order for this user instead of
        // opening a new one every time they click "pay", so stale rows don't
        // pile up if someone opens the checkout modal and abandons it.
        $existing = Payment::where('user_id', $user->id)
            ->where('purpose', 'online_class')
            ->where('status', 'created')
            ->latest()
            ->first();

        if ($existing) {
            return response()->json([
                'key' => $keyId,
                'order_id' => $existing->razorpay_order_id,
                'amount' => $existing->amount,
                'currency' => $existing->currency,
                'name' => 'Online Class',
                'description' => 'Full access to Online Classes videos',
                'prefill' => ['name' => $user->name, 'email' => $user->email],
            ]);
        }

        $receipt = 'oc_' . $user->id . '_' . now()->format('YmdHis');

        $response = Http::withBasicAuth($keyId, $keySecret)
            ->acceptJson()
            ->post('https://api.razorpay.com/v1/orders', [
                'amount' => $this->amount(),
                'currency' => $this->currency(),
                'receipt' => $receipt,
                'payment_capture' => 1,
                'notes' => [
                    'user_id' => (string) $user->id,
                    'purpose' => 'online_class',
                ],
            ]);

        if ($response->failed()) {
            Log::error('Razorpay order creation failed', ['body' => $response->body()]);

            return response()->json([
                'message' => 'Could not start the payment. Please try again in a moment.',
            ], 502);
        }

        $order = $response->json();

        $payment = Payment::create([
            'user_id' => $user->id,
            'purpose' => 'online_class',
            'razorpay_order_id' => $order['id'],
            'amount' => $order['amount'],
            'currency' => $order['currency'],
            'status' => 'created',
        ]);

        return response()->json([
            'key' => $keyId,
            'order_id' => $payment->razorpay_order_id,
            'amount' => $payment->amount,
            'currency' => $payment->currency,
            'name' => 'Online Class',
            'description' => 'Full access to Online Classes videos',
            'prefill' => ['name' => $user->name, 'email' => $user->email],
        ], 201);
    }

    /**
     * POST /api/payment/verify (auth:user)
     * Body: razorpay_order_id, razorpay_payment_id, razorpay_signature
     * The FAST PATH: Razorpay's checkout widget calls this (via the
     * frontend) the moment the popup reports success, so the browser gets
     * an instant "unlocked" response without waiting on a webhook round
     * trip. It is not the only path -- see webhook() below, which is what
     * guarantees correctness even if this call never happens (tab closed,
     * network dropped, or our server was briefly down).
     *
     * The signature here is Razorpay Checkout's own scheme:
     * HMAC_SHA256(order_id + "|" + payment_id, key_secret).
     */
    public function verify(Request $request)
    {
        $validated = $request->validate([
            'razorpay_order_id' => 'required|string',
            'razorpay_payment_id' => 'required|string',
            'razorpay_signature' => 'required|string',
        ]);

        $user = $request->attributes->get('auth_user');

        $payment = Payment::where('user_id', $user->id)
            ->where('razorpay_order_id', $validated['razorpay_order_id'])
            ->first();

        if (! $payment) {
            return response()->json(['message' => 'Payment record not found.'], 404);
        }

        if ($payment->status === 'paid') {
            return response()->json(['status' => 'paid', 'message' => 'Payment already verified.']);
        }

        $expected = hash_hmac(
            'sha256',
            $validated['razorpay_order_id'] . '|' . $validated['razorpay_payment_id'],
            $this->keySecret()
        );

        if (! hash_equals($expected, $validated['razorpay_signature'])) {
            $this->markFailed($payment->id, ['source' => 'verify', 'reason' => 'signature_mismatch']);

            return response()->json(['message' => 'Payment verification failed.'], 422);
        }

        $this->markPaid(
            $payment->id,
            $validated['razorpay_payment_id'],
            $validated['razorpay_signature'],
            ['source' => 'verify']
        );

        return response()->json(['status' => 'paid', 'message' => 'Payment verified successfully.']);
    }

    /**
     * POST /api/payment/webhook (public -- authenticated by signature, not by login)
     *
     * THE AUTHORITATIVE PATH. Razorpay calls this directly, server-to-server,
     * completely independent of the visitor's browser. This is what makes
     * payment confirmation reliable even when:
     *   - the visitor closes the tab right after paying, before /verify runs
     *   - their network drops between Razorpay and our frontend
     *   - our server is mid-deploy or briefly down at that exact moment --
     *     Razorpay automatically retries a failed webhook delivery with
     *     backoff, so it simply arrives again once we're back up
     *
     * Configure this in the Razorpay Dashboard under Settings > Webhooks:
     *   URL:    https://yourdomain.com/api/payment/webhook
     *   Secret: same value as RAZORPAY_WEBHOOK_SECRET in .env
     *   Events: payment.captured, payment.failed
     *
     * Security: verified using Razorpay's webhook signature -- an HMAC-SHA256
     * of the *raw, untouched* request body, using the webhook secret (which
     * is different from the API key secret, and never reaches the browser).
     * We check this before touching the database or trusting anything in
     * the payload.
     */
    public function webhook(Request $request)
    {
        $secret = $this->webhookSecret();
        if (! $secret) {
            Log::error('Razorpay webhook received but RAZORPAY_WEBHOOK_SECRET is not configured.');

            return response()->json(['message' => 'Webhook not configured.'], 500);
        }

        $rawBody = $request->getContent();
        $signature = $request->header('X-Razorpay-Signature', '');

        $expected = hash_hmac('sha256', $rawBody, $secret);

        if (! $signature || ! hash_equals($expected, $signature)) {
            Log::warning('Razorpay webhook signature mismatch.', ['ip' => $request->ip()]);

            return response()->json(['message' => 'Invalid signature.'], 400);
        }

        $payload = json_decode($rawBody, true) ?: [];
        $event = $payload['event'] ?? null;
        $entity = $payload['payload']['payment']['entity'] ?? null;

        if (! $entity || ! isset($entity['order_id'], $entity['id'])) {
            // Not a payment event we care about (or a malformed one) -- ack
            // with 200 anyway so Razorpay doesn't keep retrying something
            // we'll never be able to process.
            return response()->json(['status' => 'ignored']);
        }

        $orderId = $entity['order_id'];
        $paymentId = $entity['id'];

        $payment = Payment::where('razorpay_order_id', $orderId)->first();

        // Defensive fallback: if our row is somehow missing (e.g. the DB
        // write in createOrder failed right after Razorpay accepted the
        // order), rebuild it from the order's own notes, which carry the
        // user id we stamped on it at creation time.
        if (! $payment) {
            $payment = $this->recoverPaymentFromOrder($orderId);
        }

        if (! $payment) {
            Log::warning('Razorpay webhook for unknown order.', ['order_id' => $orderId, 'event' => $event]);

            return response()->json(['status' => 'unknown_order']);
        }

        if ($event === 'payment.captured') {
            $this->markPaid($payment->id, $paymentId, $signature, ['source' => 'webhook', 'event' => $event, 'payload' => $entity]);
        } elseif ($event === 'payment.failed') {
            $this->markFailed($payment->id, ['source' => 'webhook', 'event' => $event, 'payload' => $entity]);
        }
        // Other event types are acknowledged but not acted on.

        return response()->json(['status' => 'ok']);
    }

    /**
     * Flips a payment to "paid", idempotently and safely under concurrent
     * calls (the browser's /verify and Razorpay's webhook can both arrive
     * for the same payment within moments of each other). A row lock
     * inside a transaction means whichever call gets there first wins and
     * the second one is a safe no-op, instead of double-processing.
     */
    private function markPaid(int $paymentId, string $razorpayPaymentId, ?string $signature, array $meta = []): void
    {
        DB::transaction(function () use ($paymentId, $razorpayPaymentId, $signature, $meta) {
            $payment = Payment::whereKey($paymentId)->lockForUpdate()->first();
            if (! $payment || $payment->status === 'paid') {
                return; // already handled by the other path -- nothing to do
            }

            $payment->update([
                'razorpay_payment_id' => $razorpayPaymentId,
                'razorpay_signature' => $signature,
                'status' => 'paid',
                'meta' => $meta,
            ]);
        });
    }

    /**
     * Marks a payment failed -- but only if it isn't already paid. A
     * failure signal that arrives late (out of order with a captured
     * event) must never downgrade a genuinely successful payment.
     */
    private function markFailed(int $paymentId, array $meta = []): void
    {
        DB::transaction(function () use ($paymentId, $meta) {
            $payment = Payment::whereKey($paymentId)->lockForUpdate()->first();
            if (! $payment || $payment->status === 'paid') {
                return;
            }

            $payment->update(['status' => 'failed', 'meta' => $meta]);
        });
    }

    private function recoverPaymentFromOrder(string $orderId): ?Payment
    {
        $keyId = env('RAZORPAY_KEY_ID');
        $keySecret = $this->keySecret();
        if (! $keyId || ! $keySecret) {
            return null;
        }

        $response = Http::withBasicAuth($keyId, $keySecret)->get("https://api.razorpay.com/v1/orders/{$orderId}");
        if ($response->failed()) {
            return null;
        }

        $order = $response->json();
        $userId = $order['notes']['user_id'] ?? null;
        if (! $userId) {
            return null;
        }

        return Payment::create([
            'user_id' => $userId,
            'purpose' => $order['notes']['purpose'] ?? 'online_class',
            'razorpay_order_id' => $orderId,
            'amount' => $order['amount'],
            'currency' => $order['currency'],
            'status' => 'created',
        ]);
    }

    /**
     * GET /api/payment/status (auth:user)
     * Cheap check the frontend can call to decide whether to show videos
     * or the paywall -- and to poll briefly after a payment if the
     * synchronous /verify call didn't come back, since the webhook will
     * still flip this to true shortly after, independent of the browser.
     */
    public function status(Request $request)
    {
        $user = $request->attributes->get('auth_user');

        return response()->json(['paid' => $user->hasPaidForOnlineClass()]);
    }

    /**
     * GET /api/admin/payments (admin.auth)
     * Every payment attempt, newest first, with the student's name/email
     * attached -- this is a live query, so it is correct the instant a
     * payment is verified (by either path), with no separate sync step.
     */
    public function adminIndex()
    {
        $payments = Payment::with('user:id,name,email')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (Payment $p) => [
                'id' => $p->id,
                'user' => $p->user ? ['id' => $p->user->id, 'name' => $p->user->name, 'email' => $p->user->email] : null,
                'purpose' => $p->purpose,
                'meta' => $p->meta,
                'amount' => $p->amount,
                'currency' => $p->currency,
                'status' => $p->status,
                'razorpay_order_id' => $p->razorpay_order_id,
                'razorpay_payment_id' => $p->razorpay_payment_id,
                'verified_via' => $p->meta['source'] ?? null,
                'created_at' => $p->created_at?->toIso8601String(),
                'updated_at' => $p->updated_at?->toIso8601String(),
            ]);

        return response()->json([
            'data' => $payments,
            'summary' => [
                'paid_count' => $payments->where('status', 'paid')->count(),
                'paid_total' => $payments->where('status', 'paid')->sum('amount'),
            ],
        ]);
    }

    /**
     * DELETE /api/admin/payments/{id}
     * Admin: Delete an individual payment record.
     */
    public function destroy($id)
    {
        $payment = Payment::find($id);
        if (! $payment) {
            return response()->json(['message' => 'Payment record not found.'], 404);
        }

        $payment->delete();

        return response()->json([
            'success' => true,
            'message' => 'Payment record deleted successfully.',
        ]);
    }

    /**
     * DELETE /api/admin/payments
     * Admin: Clear all payment records.
     */
    public function clearAll()
    {
        $deletedCount = Payment::query()->delete();

        return response()->json([
            'success' => true,
            'message' => "Successfully cleared {$deletedCount} payment records.",
            'deleted_count' => $deletedCount,
        ]);
    }
}
