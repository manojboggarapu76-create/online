<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\StudentRegistration;
use Illuminate\Http\Request;

class RegistrationFormController extends Controller
{
    /**
     * POST /api/registrations/submit (public)
     * Students submit a registration enquiry.
     */
    public function submitRegistration(Request $request)
    {
        $validated = $request->validate([
            'name'             => 'required|string|max:255',
            'email'            => 'required|email|max:255',
            'phone'            => 'required|string|max:20',
            'course_track'     => 'nullable|string|max:255',
            'background'       => 'nullable|string|max:500',
            'preferred_batch'  => 'nullable|string|max:100',
            'notes'            => 'nullable|string|max:2000',
        ]);

        $reg = StudentRegistration::create([
            'name'            => $validated['name'],
            'email'           => $validated['email'],
            'phone'           => $validated['phone'],
            'course_track'    => $validated['course_track'] ?? null,
            'background'      => $validated['background'] ?? null,
            'preferred_batch' => $validated['preferred_batch'] ?? null,
            'notes'           => $validated['notes'] ?? null,
            'status'          => 'pending',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Registration submitted successfully. We will contact you shortly.',
            'data'    => ['id' => $reg->id],
        ], 201);
    }

    /**
     * GET /api/admin/registrations (admin.auth)
     */
    public function adminIndex()
    {
        $registrations = StudentRegistration::orderByDesc('created_at')->get()->map(function ($r) {
            return [
                'id'             => $r->id,
                'name'           => $r->name,
                'email'          => $r->email,
                'phone'          => $r->phone,
                'course_track'   => $r->course_track,
                'background'     => $r->background,
                'preferred_batch'=> $r->preferred_batch,
                'notes'          => $r->notes,
                'status'         => $r->status,
                'admin_notes'    => $r->admin_notes,
                'created_at'     => $r->created_at?->toIso8601String(),
                'updated_at'     => $r->updated_at?->toIso8601String(),
            ];
        });

        return response()->json(['data' => $registrations]);
    }

    /**
     * PUT /api/admin/registrations/{id} (admin.auth)
     */
    public function adminUpdate(Request $request, $id)
    {
        $reg = StudentRegistration::find($id);
        if (! $reg) {
            return response()->json(['message' => 'Registration not found.'], 404);
        }

        $validated = $request->validate([
            'status'      => 'sometimes|string|in:pending,contacted,enrolled,rejected,waitlisted',
            'admin_notes' => 'sometimes|nullable|string|max:2000',
        ]);

        $reg->update($validated);

        return response()->json([
            'message' => 'Registration updated.',
            'data'    => $reg->fresh(),
        ]);
    }

    /**
     * DELETE /api/admin/registrations/{id} (admin.auth)
     */
    public function adminDestroy($id)
    {
        $reg = StudentRegistration::find($id);
        if (! $reg) {
            return response()->json(['message' => 'Registration not found.'], 404);
        }

        $reg->delete();

        return response()->json(['success' => true, 'message' => 'Registration deleted.']);
    }
}
