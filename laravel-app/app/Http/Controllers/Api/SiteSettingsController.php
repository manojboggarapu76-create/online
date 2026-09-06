<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AdminSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;

class SiteSettingsController extends Controller
{
    private array $defaultSettings = [
        'social_youtube' => 'https://youtube.com',
        'social_github' => 'https://github.com',
        'social_twitter' => 'https://x.com',
        'social_linkedin' => 'https://linkedin.com',
        'help_email' => 'support@onlineclass.edu',
        'help_phone' => '+91 98765 43210',
        'help_address' => 'Academic Engineering Labs, Block C',
        'help_description' => 'All educational documents and video lectures are delivered with real-time DRM protection and anti-extraction mechanisms.',
        // Global payment gate toggle: "1" = payment required (ON), "0" = free access (OFF)
        'payment_required' => '1',
        'education_logo_url' => '',
        'education_logo_name' => '',
        'education_logo_path' => '',
        'section_colors' => '',
        'custom_sections' => '[]',
    ];

    /**
     * Get public site settings for footer, contact info & education logo.
     */
    public function getPublicSettings()
    {
        $settings = Cache::remember('public-site-settings', now()->addMinutes(5), fn () => $this->loadMergedSettings());
        return response()->json(['data' => $settings]);
    }

    /**
     * Get admin site settings.
     */
    public function getAdminSettings()
    {
        $settings = $this->loadMergedSettings();
        return response()->json(['data' => $settings]);
    }

    /**
     * Stream the education logo image with proper content-type.
     */
    public function streamLogo()
    {
        $path = AdminSetting::where('key', 'education_logo_path')->value('value');
        if (! $path || ! Storage::disk('public')->exists($path)) {
            // Fallback to dashboard_logo_path if set in welcome screen
            $dashPath = AdminSetting::where('key', 'dashboard_logo_path')->value('value');
            if ($dashPath && Storage::disk('public')->exists($dashPath)) {
                $path = $dashPath;
            } else {
                abort(404, 'No education logo configured');
            }
        }

        $fullPath = Storage::disk('public')->path($path);
        $mimeType = @mime_content_type($fullPath) ?: 'image/png';

        return response()->file($fullPath, [
            'Content-Type' => $mimeType,
            'Access-Control-Allow-Origin' => '*',
            'Cache-Control' => 'no-cache, private',
        ]);
    }

    /**
     * Upload / change the education logo (Admin only).
     */
    public function uploadLogo(Request $request)
    {
        $request->validate([
            'logo' => 'required|file|mimes:jpeg,png,jpg,gif,webp,svg|max:10240', // 10MB
        ]);

        $currentPath = AdminSetting::where('key', 'education_logo_path')->value('value');
        if ($currentPath && Storage::disk('public')->exists($currentPath)) {
            Storage::disk('public')->delete($currentPath);
        }

        $file = $request->file('logo');
        $newPath = $file->store('education-logos', 'public');
        $origName = $file->getClientOriginalName();
        $logoUrl = url('api/site-settings/logo?v=' . time());

        AdminSetting::updateOrCreate(['key' => 'education_logo_path'], ['value' => $newPath]);
        AdminSetting::updateOrCreate(['key' => 'education_logo_name'], ['value' => $origName]);
        AdminSetting::updateOrCreate(['key' => 'education_logo_url'], ['value' => $logoUrl]);

        // Synchronize with dashboard_logo_path for universal compatibility
        AdminSetting::updateOrCreate(['key' => 'dashboard_logo_path'], ['value' => $newPath]);
        AdminSetting::updateOrCreate(['key' => 'dashboard_logo_name'], ['value' => $origName]);
        Cache::forget('public-site-settings');

        return response()->json([
            'success' => true,
            'message' => 'Education logo updated successfully across the entire website.',
            'data' => $this->loadMergedSettings(),
        ]);
    }

    /**
     * Remove the custom education logo (Admin only).
     */
    public function removeLogo()
    {
        $currentPath = AdminSetting::where('key', 'education_logo_path')->value('value');
        if ($currentPath && Storage::disk('public')->exists($currentPath)) {
            Storage::disk('public')->delete($currentPath);
        }

        AdminSetting::updateOrCreate(['key' => 'education_logo_path'], ['value' => '']);
        AdminSetting::updateOrCreate(['key' => 'education_logo_name'], ['value' => '']);
        AdminSetting::updateOrCreate(['key' => 'education_logo_url'], ['value' => '']);
        Cache::forget('public-site-settings');

        return response()->json([
            'success' => true,
            'message' => 'Custom education logo removed. Default education emblem restored.',
            'data' => $this->loadMergedSettings(),
        ]);
    }

    /**
     * Update admin site settings.
     */
    public function updateAdminSettings(Request $request)
    {
        $validated = $request->validate([
            'social_youtube' => 'nullable|string|max:500',
            'social_github' => 'nullable|string|max:500',
            'social_twitter' => 'nullable|string|max:500',
            'social_linkedin' => 'nullable|string|max:500',
            'help_email' => 'nullable|string|max:255',
            'help_phone' => 'nullable|string|max:100',
            'help_address' => 'nullable|string|max:500',
            'help_description' => 'nullable|string',
            'payment_required' => 'nullable|string|in:0,1',
            'education_logo_url' => 'nullable|string|max:1000',
            'section_colors' => 'nullable|string',
        ]);

        // Also check if logo was uploaded directly in this request
        if ($request->hasFile('logo') || $request->hasFile('education_logo')) {
            $file = $request->file('logo') ?: $request->file('education_logo');
            $currentPath = AdminSetting::where('key', 'education_logo_path')->value('value');
            if ($currentPath && Storage::disk('public')->exists($currentPath)) {
                Storage::disk('public')->delete($currentPath);
            }
            $newPath = $file->store('education-logos', 'public');
            $origName = $file->getClientOriginalName();
            $logoUrl = url('api/site-settings/logo?v=' . time());

            AdminSetting::updateOrCreate(['key' => 'education_logo_path'], ['value' => $newPath]);
            AdminSetting::updateOrCreate(['key' => 'education_logo_name'], ['value' => $origName]);
            AdminSetting::updateOrCreate(['key' => 'education_logo_url'], ['value' => $logoUrl]);
            AdminSetting::updateOrCreate(['key' => 'dashboard_logo_path'], ['value' => $newPath]);
        }

        foreach ($validated as $key => $value) {
            AdminSetting::updateOrCreate(
                ['key' => $key],
                ['value' => (string) ($value ?? '')]
            );
        }

        Cache::forget('public-site-settings');

        $updated = $this->loadMergedSettings();

        return response()->json([
            'data' => $updated,
            'message' => 'Site settings and academic platform configuration updated successfully.',
        ]);
    }

    /**
     * Helper to load settings from DB merged with defaults.
     */
    private function loadMergedSettings(): array
    {
        $allowedKeys = array_keys($this->defaultSettings);
        $dbSettings = AdminSetting::whereIn('key', $allowedKeys)->pluck('value', 'key')->toArray();
        $merged = array_merge($this->defaultSettings, $dbSettings);

        // If education_logo_path exists in DB, ensure education_logo_url is generated
        $logoPath = $merged['education_logo_path'] ?? '';
        if ($logoPath && Storage::disk('public')->exists($logoPath)) {
            $merged['education_logo_url'] = url('api/site-settings/logo');
        } elseif (empty($merged['education_logo_url'])) {
            // Also check dashboard_logo_path
            $dashPath = AdminSetting::where('key', 'dashboard_logo_path')->value('value');
            if ($dashPath && Storage::disk('public')->exists($dashPath)) {
                $merged['education_logo_url'] = url('api/site-settings/logo');
                $merged['education_logo_name'] = AdminSetting::where('key', 'dashboard_logo_name')->value('value') ?: 'Dashboard Logo';
            }
        }

        return $merged;
    }

    /**
     * Get list of custom sections created by admin.
     */
    public function getCustomSections()
    {
        $raw = AdminSetting::where('key', 'custom_sections')->value('value');
        $sections = $raw ? json_decode($raw, true) : [];
        return response()->json(['data' => is_array($sections) ? $sections : []]);
    }

    /**
     * Store a new custom section (Admin only).
     */
    public function addCustomSection(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:100',
            'key' => 'nullable|string|max:50',
            'tagline' => 'nullable|string|max:255',
            'icon' => 'nullable|string|max:50',
            'color' => 'nullable|string|max:30',
        ]);

        $key = !empty($validated['key'])
            ? strtolower(preg_replace('/[^a-zA-Z0-9_]+/', '_', $validated['key']))
            : strtolower(preg_replace('/[^a-zA-Z0-9_]+/', '_', trim($validated['title'])));

        $reserved = ['admin', 'auth', 'payment', 'api', 'welcome', 'login', 'signup', 'settings'];
        if (in_array($key, $reserved, true)) {
            return response()->json(['message' => 'This section key is reserved.'], 422);
        }

        $raw = AdminSetting::where('key', 'custom_sections')->value('value');
        $sections = $raw ? json_decode($raw, true) : [];
        if (!is_array($sections)) $sections = [];

        foreach ($sections as $s) {
            if (($s['key'] ?? '') === $key) {
                return response()->json(['message' => 'A section with this key already exists.'], 422);
            }
        }

        $newSection = [
            'key' => $key,
            'title' => $validated['title'],
            'tagline' => $validated['tagline'] ?? 'Curated learning resources and materials.',
            'icon' => $validated['icon'] ?? 'bi-folder-fill',
            'color' => $validated['color'] ?? '#2563eb',
            'route' => '/' . str_replace('_', '-', $key),
            'created_at' => now()->toIso8601String(),
        ];

        $sections[] = $newSection;
        AdminSetting::updateOrCreate(
            ['key' => 'custom_sections'],
            ['value' => json_encode($sections)]
        );

        return response()->json([
            'data' => $newSection,
            'all' => $sections,
            'message' => 'New section added successfully.',
        ], 201);
    }

    /**
     * Update an existing custom section (Admin only).
     */
    public function updateCustomSection(Request $request, string $key)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:100',
            'tagline' => 'nullable|string|max:255',
            'icon' => 'nullable|string|max:50',
            'color' => 'nullable|string|max:30',
        ]);

        $raw = AdminSetting::where('key', 'custom_sections')->value('value');
        $sections = $raw ? json_decode($raw, true) : [];
        if (!is_array($sections)) $sections = [];

        $found = false;
        $updatedItem = null;
        foreach ($sections as &$s) {
            if (($s['key'] ?? '') === $key) {
                $s['title'] = $validated['title'];
                if (isset($validated['tagline'])) $s['tagline'] = $validated['tagline'];
                if (isset($validated['icon'])) $s['icon'] = $validated['icon'];
                if (isset($validated['color'])) $s['color'] = $validated['color'];
                $s['updated_at'] = now()->toIso8601String();
                $updatedItem = $s;
                $found = true;
                break;
            }
        }
        unset($s);

        if (!$found) {
            return response()->json(['message' => 'Custom section not found.'], 404);
        }

        AdminSetting::updateOrCreate(
            ['key' => 'custom_sections'],
            ['value' => json_encode($sections)]
        );

        return response()->json([
            'data' => $updatedItem,
            'all' => $sections,
            'message' => 'Custom section updated successfully.',
        ]);
    }

    /**
     * Delete a custom section (Admin only).
     */
    public function deleteCustomSection(string $key)
    {
        $raw = AdminSetting::where('key', 'custom_sections')->value('value');
        $sections = $raw ? json_decode($raw, true) : [];
        if (!is_array($sections)) $sections = [];

        $filtered = array_values(array_filter($sections, fn($s) => ($s['key'] ?? '') !== $key));

        AdminSetting::updateOrCreate(
            ['key' => 'custom_sections'],
            ['value' => json_encode($filtered)]
        );

        return response()->json([
            'message' => 'Custom section removed successfully.',
            'all' => $filtered,
        ]);
    }
}
