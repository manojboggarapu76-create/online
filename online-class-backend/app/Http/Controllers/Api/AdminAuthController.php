<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AdminSession;
use App\Models\AdminSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AdminAuthController extends Controller
{
    /**
     * POST /api/admin/login
     * Single shared password, default "1", editable from the panel.
     */
    public function login(Request $request)
    {
        $request->validate(['password' => 'required|string']);

        $setting = AdminSetting::where('key', 'admin_password')->first();

        if (! $setting || ! Hash::check($request->password, $setting->value)) {
            throw ValidationException::withMessages([
                'password' => ['Incorrect admin password.'],
            ]);
        }

        $token = Str::random(64);

        AdminSession::create([
            'token' => $token,
            'expires_at' => now()->addHours(4),
        ]);

        return response()->json([
            'token' => $token,
            'expires_at' => now()->addHours(4)->toIso8601String(),
        ]);
    }

    /**
     * POST /api/admin/logout
     */
    public function logout(Request $request)
    {
        AdminSession::where('token', $request->bearerToken())->delete();

        return response()->json(['message' => 'Logged out.']);
    }

    /**
     * GET /api/admin/me
     * Lets the frontend silently verify a stored token on page load.
     */
    public function me(Request $request)
    {
        return response()->json(['authenticated' => true]);
    }

    /**
     * POST /api/admin/change-password
     * Body: current_password, new_password, new_password_confirmation
     */
    public function changePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:1|confirmed',
        ]);

        $setting = AdminSetting::where('key', 'admin_password')->first();

        if (! $setting || ! Hash::check($request->current_password, $setting->value)) {
            throw ValidationException::withMessages([
                'current_password' => ['Current password is incorrect.'],
            ]);
        }

        $setting->update(['value' => Hash::make($request->new_password)]);

        // Invalidate every existing session so old tokens can't linger
        // after a password change, except the one making this request.
        AdminSession::where('token', '!=', $request->bearerToken())->delete();

        return response()->json(['message' => 'Password updated successfully.']);
    }
}
