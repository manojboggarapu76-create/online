<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\StudentRegistration;
use Illuminate\Http\Request;

class RegistrationFormController extends Controller
{
    /**
     * POST /api/registrations/submit
     * Public endpoint: Student registers for a course or batch.
     */
    public function submitRegistration(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => 'required|string|max:50',
            'course_track' => 'nullable|string|max:255',
            'background' => 'nullable|string|max:255',
            'preferred_batch' => 'nullable|string|max:100',
            'notes' => 'nullable|string|max:3000',
        ]);

        $validated['status'] = 'pending';

        $entry = StudentRegistration::create($validated);

        return response()->json([
            'message' => 'Your registration form has been submitted successfully! An admissions coordinator will contact you shortly.',
            'data' => $entry,
        ], 201);
    }

    /**
     * GET /api/admin/registrations
     * Admin endpoint: List all student registrations with search and filtering.
     */
    public function adminIndex(Request $request)
    {
        $query = StudentRegistration::query();

        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('course_track', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->filled('course_track') && $request->course_track !== 'all') {
            $query->where('course_track', $request->course_track);
        }

        $items = $query->orderByDesc('created_at')->get();

        return response()->json(['data' => $items]);
    }

    /**
     * PUT /api/admin/registrations/{id}
     * Admin endpoint: Update status or admin notes.
     */
    public function adminUpdate(Request $request, $id)
    {
        $entry = StudentRegistration::findOrFail($id);

        $validated = $request->validate([
            'status' => 'nullable|in:pending,contacted,enrolled,closed',
            'admin_notes' => 'nullable|string',
        ]);

        $entry->update($validated);

        return response()->json(['data' => $entry]);
    }

    /**
     * DELETE /api/admin/registrations/{id}
     * Admin endpoint: Delete a registration entry.
     */
    public function adminDestroy($id)
    {
        $entry = StudentRegistration::findOrFail($id);
        $entry->delete();

        return response()->json(['message' => 'Registration deleted.']);
    }
}
