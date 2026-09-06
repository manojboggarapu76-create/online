<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ProxySupportMessage;
use Illuminate\Http\Request;

class ProxySupportController extends Controller
{
    /**
     * POST /api/proxy-support/messages
     * Public endpoint: Students / users submit a proxy support inquiry or message.
     */
    public function submitMessage(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => 'nullable|string|max:50',
            'subject' => 'nullable|string|max:255',
            'missed_session_date' => 'nullable|string|max:100',
            'message' => 'required|string|max:5000',
            'urgency' => 'nullable|in:normal,urgent',
        ]);

        $validated['urgency'] = $validated['urgency'] ?? 'normal';
        $validated['status'] = 'pending';

        $entry = ProxySupportMessage::create($validated);

        return response()->json([
            'message' => 'Your proxy support request has been submitted successfully. An instructor will review it shortly.',
            'data' => $entry,
        ], 201);
    }

    /**
     * GET /api/admin/proxy-messages
     * Admin endpoint: List all proxy support requests with search and filtering.
     */
    public function adminIndex(Request $request)
    {
        $query = ProxySupportMessage::query();

        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('subject', 'like', "%{$search}%")
                  ->orWhere('message', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->filled('urgency') && $request->urgency !== 'all') {
            $query->where('urgency', $request->urgency);
        }

        $items = $query->orderByDesc('created_at')->get();

        return response()->json(['data' => $items]);
    }

    /**
     * PUT /api/admin/proxy-messages/{id}
     * Admin endpoint: Update status or notes for a proxy request.
     */
    public function adminUpdate(Request $request, $id)
    {
        $entry = ProxySupportMessage::findOrFail($id);

        $validated = $request->validate([
            'status' => 'nullable|in:pending,in_review,resolved',
            'admin_notes' => 'nullable|string',
        ]);

        $entry->update($validated);

        return response()->json(['data' => $entry]);
    }

    /**
     * DELETE /api/admin/proxy-messages/{id}
     * Admin endpoint: Delete a proxy request.
     */
    public function adminDestroy($id)
    {
        $entry = ProxySupportMessage::findOrFail($id);
        $entry->delete();

        return response()->json(['message' => 'Request deleted.']);
    }
}
