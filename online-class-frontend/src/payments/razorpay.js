// Thin wrapper around Razorpay's hosted Checkout.js. We never touch card
// details ourselves — the popup Razorpay injects handles that — we just
// load their script once, open the popup with the order details our
// backend created, and hand the resulting payment id/signature back to
// the backend's /payment/verify endpoint.

const RAZORPAY_SRC = "https://checkout.razorpay.com/v1/checkout.js";

let loadPromise = null;

export function loadRazorpayScript() {
  if (window.Razorpay) return Promise.resolve(true);
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = RAZORPAY_SRC;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

  return loadPromise;
}

/**
 * orderData: { key, order_id, amount, currency, name, description, prefill }
 * as returned by POST /api/payment/create-order.
 * onSuccess(response) receives { razorpay_order_id, razorpay_payment_id, razorpay_signature }.
 * onDismiss() fires if the visitor closes the popup without paying.
 */
export async function openRazorpayCheckout(orderData, { onSuccess, onDismiss, onError }) {
  const loaded = await loadRazorpayScript();
  if (!loaded || !window.Razorpay) {
    onError?.(new Error("Couldn't load the payment window. Check your connection and try again."));
    return;
  }

  const rzp = new window.Razorpay({
    key: orderData.key,
    amount: orderData.amount,
    currency: orderData.currency,
    name: orderData.name || "Online Class",
    description: orderData.description || "Online Class access",
    order_id: orderData.order_id,
    prefill: orderData.prefill || {},
    theme: { color: "#2554e0" },
    handler: (response) => onSuccess?.(response),
    modal: {
      ondismiss: () => onDismiss?.(),
    },
  });

  rzp.on("payment.failed", (response) => {
    onError?.(new Error(response?.error?.description || "Payment failed."));
  });

  rzp.open();
}
