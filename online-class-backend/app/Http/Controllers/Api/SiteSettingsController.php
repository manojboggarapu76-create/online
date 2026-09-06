<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AdminSetting;
use Illuminate\Http\Request;

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
    ];

    /**
     * Get public site settings for footer & contact info.
     */
    public function getPublicSettings()
    {
        $settings = $this->loadMergedSettings();
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
        ]);

        foreach ($validated as $key => $value) {
            AdminSetting::updateOrCreate(
                ['key' => $key],
                ['value' => (string) ($value ?? '')]
            );
        }

        $updated = $this->loadMergedSettings();

        return response()->json([
            'data' => $updated,
            'message' => 'Site footer and academic security settings updated successfully.',
        ]);
    }

    /**
     * Helper to load settings from DB merged with defaults.
     */
    private function loadMergedSettings(): array
    {
        $allowedKeys = array_keys($this->defaultSettings);
        $dbSettings = AdminSetting::whereIn('key', $allowedKeys)->pluck('value', 'key')->toArray();
        return array_merge($this->defaultSettings, $dbSettings);
    }
}
