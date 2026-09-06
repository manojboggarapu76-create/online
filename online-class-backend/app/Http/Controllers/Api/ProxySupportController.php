<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ProxySupportMessage;
use Illuminate\Http\Request;

class ProxySupportController extends Controller
{
    /**
     * POST /api/proxy-support/messages (public)
     * Students submit a proxy support request.
     */
    public function submitMessage(Request $request)
    {
        $validated = $request->validate([
            'name'                => 'required|string|max:255',
            'email'               => 'required|email|max:255',
            'phone'               => 'nullable|string|max:20',
            'subject'             => 'nullable|string|max:255',
            'missed_session_date' => 'nullable|string|max:100',
            'message'             => 'required|string|max:3000',
            'urgency'             => 'nullable|string|in:low,normal,high,urgent',
        ]);

        $msg = ProxySupportMessage::create([
            'name'                => $validated['name'],
            'email'               => $validated['email'],
            'phone'               => $validated['phone'] ?? null,
            'subject'             => $validated['subject'] ?? null,
            'missed_session_date' => $validated['missed_session_date'] ?? null,
            'message'             => $validated['message'],
            'urgency'             => $validated['urgency'] ?? 'normal',
            'status'              => 'pending',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Your proxy support request has been submitted successfully.',
            'data'    => ['id' => $msg->id],
        ], 201);
    }

    /**
     * GET /api/admin/proxy-messages (admin.auth)
     * Lists all proxy support messages for the admin panel.
     */
    public function adminIndex(Request $request)
    {
        $messages = ProxySupportMessage::orderByDesc('created_at')->get()->map(function ($m) {
            return [
                'id'                  => $m->id,
                'name'                => $m->name,
                'email'               => $m->email,
                'phone'               => $m->phone,
                'subject'             => $m->subject,
                'missed_session_date' => $m->missed_session_date,
                'message'             => $m->message,
                'urgency'             => $m->urgency,
                'status'              => $m->status,
                'admin_notes'         => $m->admin_notes,
                'created_at'          => $m->created_at?->toIso8601String(),
                'updated_at'          => $m->updated_at?->toIso8601String(),
            ];
        });

        return response()->json(['data' => $messages]);
    }

    /**
     * PUT /api/admin/proxy-messages/{id} (admin.auth)
     * Updates status and admin notes for a proxy message.
     */
    public function adminUpdate(Request $request, $id)
    {
        $msg = ProxySupportMessage::find($id);
        if (! $msg) {
            return response()->json(['message' => 'Message not found.'], 404);
        }

        $validated = $request->validate([
            'status'      => 'sometimes|string|in:pending,in_progress,resolved,closed',
            'admin_notes' => 'sometimes|nullable|string|max:2000',
        ]);

        $msg->update($validated);

        return response()->json([
            'message' => 'Message updated.',
            'data'    => $msg->fresh(),
        ]);
    }

    /**
     * DELETE /api/admin/proxy-messages/{id} (admin.auth)
     */
    public function adminDestroy($id)
    {
        $msg = ProxySupportMessage::find($id);
        if (! $msg) {
            return response()->json(['message' => 'Message not found.'], 404);
        }

        $msg->delete();

        return response()->json(['success' => true, 'message' => 'Message deleted.']);
    }
}
