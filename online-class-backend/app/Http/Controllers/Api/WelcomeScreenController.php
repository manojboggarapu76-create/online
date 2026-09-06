<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AdminSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class WelcomeScreenController extends Controller
{
    /**
     * GET /api/welcome-screen
     * Public. Returns current welcome screen settings and media URL.
     */
    public function getSettings()
    {
        $settings = AdminSetting::whereIn('key', [
            'welcome_title',
            'welcome_tagline',
            'welcome_media_path',
            'welcome_media_name',
            'welcome_media_type',
            'welcome_duration',
            'dashboard_logo_path',
            'dashboard_logo_name',
        ])->pluck('value', 'key');

        $mediaPath = $settings['welcome_media_path'] ?? null;
        $mediaUrl = null;
        if ($mediaPath && Storage::disk('public')->exists($mediaPath)) {
            $mediaUrl = url('api/welcome-screen/stream');
        }

        $dashboardLogoPath = $settings['dashboard_logo_path'] ?? null;
        $dashboardLogoUrl = null;
        if ($dashboardLogoPath && Storage::disk('public')->exists($dashboardLogoPath)) {
            $dashboardLogoUrl = url('storage/' . $dashboardLogoPath);
        }

        return response()->json([
            'title' => $settings['welcome_title'] ?? 'Online Class',
            'tagline' => $settings['welcome_tagline'] ?? 'Your whole classroom, in one binder',
            'media_type' => $settings['welcome_media_type'] ?? 'none',
            'media_url' => $mediaUrl,
            'media_name' => $settings['welcome_media_name'] ?? null,
            'duration' => (int) ($settings['welcome_duration'] ?? 6),
            'dashboard_logo_url' => $dashboardLogoUrl,
            'dashboard_logo_name' => $settings['dashboard_logo_name'] ?? null,
        ]);
    }

    /**
     * POST /api/admin/welcome-screen
     * Admin protected. Updates welcome screen settings and handles photo/video upload.
     */
    public function updateSettings(Request $request)
    {
        @set_time_limit(0);
        @ini_set('max_execution_time', '0');

        $request->validate([
            'title' => 'nullable|string|max:255',
            'tagline' => 'nullable|string|max:255',
            'duration' => 'nullable|integer|min:2|max:120',
            'media_type' => 'nullable|string|in:photo,video,none',
            'file' => 'nullable|file|max:5242880', // 5GB
            'remove_media' => 'nullable|boolean',
            'dashboard_logo' => 'nullable|file|mimes:jpeg,png,jpg,gif,webp,svg|max:4096',
            'remove_dashboard_logo' => 'nullable|boolean',
        ]);

        if ($request->has('title')) {
            AdminSetting::updateOrCreate(['key' => 'welcome_title'], ['value' => $request->title ?: 'Online Class']);
        }
        if ($request->has('tagline')) {
            AdminSetting::updateOrCreate(['key' => 'welcome_tagline'], ['value' => $request->tagline ?: 'Your whole classroom, in one binder']);
        }
        if ($request->has('duration')) {
            AdminSetting::updateOrCreate(['key' => 'welcome_duration'], ['value' => (string) ($request->duration ?: 6)]);
        }

        $currentPath = AdminSetting::where('key', 'welcome_media_path')->value('value');

        if ($request->boolean('remove_media')) {
            if ($currentPath && Storage::disk('public')->exists($currentPath)) {
                Storage::disk('public')->delete($currentPath);
            }
            AdminSetting::updateOrCreate(['key' => 'welcome_media_path'], ['value' => '']);
            AdminSetting::updateOrCreate(['key' => 'welcome_media_name'], ['value' => '']);
            AdminSetting::updateOrCreate(['key' => 'welcome_media_type'], ['value' => 'none']);
        } elseif ($request->hasFile('file')) {
            if ($currentPath && Storage::disk('public')->exists($currentPath)) {
                Storage::disk('public')->delete($currentPath);
            }

            $file = $request->file('file');
            $newPath = $file->store('welcome-screen', 'public');
            $originalName = $file->getClientOriginalName();
            $mime = $file->getMimeType();

            $mediaType = str_starts_with($mime, 'video/') ? 'video' : 'photo';
            if ($request->filled('media_type') && in_array($request->media_type, ['photo', 'video'])) {
                $mediaType = $request->media_type;
            }

            AdminSetting::updateOrCreate(['key' => 'welcome_media_path'], ['value' => $newPath]);
            AdminSetting::updateOrCreate(['key' => 'welcome_media_name'], ['value' => $originalName]);
            AdminSetting::updateOrCreate(['key' => 'welcome_media_type'], ['value' => $mediaType]);
        } elseif ($request->filled('media_type')) {
            AdminSetting::updateOrCreate(['key' => 'welcome_media_type'], ['value' => $request->media_type]);
        }

        // Handle dashboard logo upload / removal
        $currentLogoPath = AdminSetting::where('key', 'dashboard_logo_path')->value('value');

        if ($request->boolean('remove_dashboard_logo')) {
            if ($currentLogoPath && Storage::disk('public')->exists($currentLogoPath)) {
                Storage::disk('public')->delete($currentLogoPath);
            }
            AdminSetting::updateOrCreate(['key' => 'dashboard_logo_path'], ['value' => '']);
            AdminSetting::updateOrCreate(['key' => 'dashboard_logo_name'], ['value' => '']);
        } elseif ($request->hasFile('dashboard_logo')) {
            if ($currentLogoPath && Storage::disk('public')->exists($currentLogoPath)) {
                Storage::disk('public')->delete($currentLogoPath);
            }
            $logoFile = $request->file('dashboard_logo');
            $newLogoPath = $logoFile->store('dashboard-logos', 'public');
            AdminSetting::updateOrCreate(['key' => 'dashboard_logo_path'], ['value' => $newLogoPath]);
            AdminSetting::updateOrCreate(['key' => 'dashboard_logo_name'], ['value' => $logoFile->getClientOriginalName()]);
        }

        return $this->getSettings();
    }

    /**
     * GET /api/welcome-screen/stream
     * High-performance stream endpoint with HTTP 206 Partial Content support for video/photo.
     */
    public function stream()
    {
        $path = AdminSetting::where('key', 'welcome_media_path')->value('value');
        if (! $path || ! Storage::disk('public')->exists($path)) {
            abort(404, 'No media configured');
        }

        $fullPath = Storage::disk('public')->path($path);
        $fileSize = filesize($fullPath);
        $mimeType = @mime_content_type($fullPath) ?: 'application/octet-stream';

        $extension = strtolower(pathinfo($fullPath, PATHINFO_EXTENSION));
        $mimes = [
            'mp4' => 'video/mp4',
            'webm' => 'video/webm',
            'ogg' => 'video/ogg',
            'mov' => 'video/quicktime',
            'mkv' => 'video/x-matroska',
            'm4v' => 'video/mp4',
            'jpg' => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'png' => 'image/png',
            'gif' => 'image/gif',
            'webp' => 'image/webp',
            'svg' => 'image/svg+xml',
        ];
        if (isset($mimes[$extension])) {
            $mimeType = $mimes[$extension];
        }

        $range = request()->header('Range');
        if (! $range) {
            return response()->file($fullPath, [
                'Content-Type' => $mimeType,
                'Content-Length' => $fileSize,
                'Accept-Ranges' => 'bytes',
                'Access-Control-Allow-Origin' => '*',
            ]);
        }

        if (! preg_match('/bytes=(\d+)-(\d+)?/', $range, $matches)) {
            return response('', 416, ['Content-Range' => "bytes */$fileSize"]);
        }

        $start = (int) $matches[1];
        $end = isset($matches[2]) && $matches[2] !== '' ? (int) $matches[2] : $fileSize - 1;

        if ($start > $end || $start >= $fileSize) {
            return response('', 416, ['Content-Range' => "bytes */$fileSize"]);
        }

        $end = min($end, $fileSize - 1);
        $length = $end - $start + 1;

        $headers = [
            'Content-Type' => $mimeType,
            'Content-Length' => $length,
            'Content-Range' => "bytes $start-$end/$fileSize",
            'Accept-Ranges' => 'bytes',
            'Access-Control-Allow-Origin' => '*',
        ];

        return response()->stream(function () use ($fullPath, $start, $length) {
            $handle = fopen($fullPath, 'rb');
            if ($handle === false) return;
            fseek($handle, $start);
            $bufferSize = 1024 * 128;
            $remaining = $length;
            while ($remaining > 0 && ! feof($handle)) {
                $readLength = min($bufferSize, $remaining);
                $buffer = fread($handle, $readLength);
                if ($buffer === false) break;
                echo $buffer;
                flush();
                $remaining -= strlen($buffer);
            }
            fclose($handle);
        }, 206, $headers);
    }
}
