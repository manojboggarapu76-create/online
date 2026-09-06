<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SecurityLog;
use App\Models\UserSession;
use Illuminate\Http\Request;

class SecurityLogController extends Controller
{
    /**
     * POST /api/security/log
     * Ingests security alerts from the client (copy attempt, blur, print, printscreen, etc.).
     */
    public function log(Request $request)
    {
        $validated = $request->validate([
            'event_type' => 'required|string|max:100',
            'section_key' => 'nullable|string|max:100',
            'document_id' => 'nullable|string|max:100',
            'username' => 'nullable|string|max:255',
            'session_id' => 'nullable|string|max:255',
            'meta' => 'nullable',
        ]);

        $userId = null;
        $username = $validated['username'] ?? null;

        $token = $request->bearerToken();
        if ($token) {
            $session = UserSession::where('token', $token)
                ->where('expires_at', '>', now())
                ->with('user')
                ->first();
            if ($session && $session->user) {
                $userId = $session->user->id;
                $username = $session->user->name;
            }
        }

        $log = SecurityLog::create([
            'user_id' => $userId,
            'username' => $username ?: 'Guest / Anonymous',
            'session_id' => $validated['session_id'] ?? substr(md5($request->ip() . $request->userAgent()), 0, 12),
            'event_type' => $validated['event_type'],
            'section_key' => $validated['section_key'] ?? null,
            'document_id' => $validated['document_id'] ?? null,
            'meta' => is_array($validated['meta'] ?? null) ? $validated['meta'] : ['info' => $validated['meta'] ?? ''],
            'ip_address' => $request->ip(),
            'user_agent' => substr($request->userAgent() ?? '', 0, 500),
        ]);

        return response()->json([
            'success' => true,
            'log_id' => $log->id,
        ]);
    }

    /**
     * GET /api/admin/security-logs
     * Admin view for reviewing captured security events.
     */
    public function adminIndex(Request $request)
    {
        $query = SecurityLog::query()->latest();

        if ($request->filled('event_type') && $request->event_type !== 'all') {
            $query->where('event_type', $request->event_type);
        }

        if ($request->filled('section_key') && $request->section_key !== 'all') {
            $query->where('section_key', $request->section_key);
        }

        if ($request->filled('search')) {
            $search = '%' . trim($request->search) . '%';
            $query->where(function ($q) use ($search) {
                $q->where('username', 'LIKE', $search)
                  ->orWhere('session_id', 'LIKE', $search)
                  ->orWhere('ip_address', 'LIKE', $search)
                  ->orWhere('document_id', 'LIKE', $search);
            });
        }

        $logs = $query->take(200)->get();

        $summary = [
            'total' => SecurityLog::count(),
            'copy_attempts' => SecurityLog::where('event_type', 'copy_attempt')->count(),
            'print_attempts' => SecurityLog::where('event_type', 'print_attempt')->count(),
            'print_screen' => SecurityLog::where('event_type', 'print_screen')->count(),
            'window_blur' => SecurityLog::where('event_type', 'window_blur')->count(),
            'right_clicks' => SecurityLog::where('event_type', 'right_click_attempt')->count(),
        ];

        return response()->json([
            'logs' => $logs,
            'summary' => $summary,
        ]);
    }

    /**
     * DELETE /api/admin/security-logs/{id}
     * Admin: Delete an individual security log entry.
     */
    public function destroy($id)
    {
        $log = SecurityLog::find($id);
        if (! $log) {
            return response()->json(['message' => 'Security log entry not found.'], 404);
        }

        $log->delete();

        return response()->json([
            'success' => true,
            'message' => 'Security log entry deleted successfully.',
        ]);
    }

    /**
     * DELETE /api/admin/security-logs
     * Admin: Clear all security logs.
     */
    public function clearAll(Request $request)
    {
        $query = SecurityLog::query();

        if ($request->filled('event_type') && $request->event_type !== 'all') {
            $query->where('event_type', $request->event_type);
        }

        if ($request->filled('section_key') && $request->section_key !== 'all') {
            $query->where('section_key', $request->section_key);
        }

        $deletedCount = $query->delete();

        return response()->json([
            'success' => true,
            'message' => "Successfully cleared {$deletedCount} security log entries.",
            'deleted_count' => $deletedCount,
        ]);
    }
}
