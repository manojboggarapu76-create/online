<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ContentItem;
use App\Models\UserSession;
use App\Services\UserSessionCache;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Illuminate\Validation\Rule;

class ContentItemController extends Controller
{
    /**
     * GET /api/sections/{section}
     * Public -- no token required to call it -- but if a valid user bearer
     * token IS sent, we use it to work out whether that visitor is entitled
     * to watch Online Classes videos. Everyone can see titles/descriptions;
     * only a logged-in, paid-up user gets a real, playable file_url for a
     * video in the online_class section. Everything else is untouched.
     */
    public function publicIndex(Request $request, string $section)
    {
        $this->assertValidSection($section);

        $entitled = $this->requesterIsEntitled($request, $section);

        $loadItems = fn () => ContentItem::section($section)
            ->active()
            ->orderBy('sort_order')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn ($item) => $this->transform($item, $entitled))
            ->values()
            ->all();

        // Online Class results are entitlement-specific and must never be
        // shared. Other anonymous public sections are cacheable and every
        // admin mutation below invalidates the affected cache key immediately.
        $items = $section !== 'online_class' && ! $request->bearerToken()
            ? Cache::remember($this->publicCacheKey($section), now()->addMinutes(5), $loadItems)
            : $loadItems();

        return response()->json(['data' => $items]);
    }

    /**
     * GET /api/admin/items?section=lecture_material
     * Protected. Admin sees inactive items too, so nothing is ever "lost".
     */
    public function adminIndex(Request $request)
    {
        $request->validate(['section' => ['required', Rule::in(ContentItem::allValidSections())]]);

        $items = ContentItem::section($request->section)
            ->orderBy('sort_order')
            ->orderByDesc('created_at')
            ->get()
            // Admin always sees real, playable file URLs -- the paywall is
            // for public visitors, not for the person managing content.
            ->map(fn ($item) => $this->transform($item, true));

        return response()->json(['data' => $items]);
    }

    /**
     * POST /api/admin/items (multipart/form-data, supports an optional "file")
     */
    public function store(Request $request)
    {
        @set_time_limit(0);
        @ini_set('max_execution_time', '0');

        $validated = $this->validateItem($request);

        if ($request->hasFile('file')) {
            $validated['file_path'] = $request->file('file')->store('protected-content/content-items', 'local');
            $validated['file_name'] = $request->file('file')->getClientOriginalName();
        }

        $item = ContentItem::create($validated);
        $this->forgetPublicCache($item->section);

        return response()->json(['data' => $this->transform($item, true)], 201);
    }

    /**
     * POST /api/admin/items/{item} (with _method=PUT for multipart support)
     */
    public function update(Request $request, ContentItem $item)
    {
        @set_time_limit(0);
        @ini_set('max_execution_time', '0');

        $validated = $this->validateItem($request, $item->id);

        if ($request->hasFile('file')) {
            if ($item->file_path) {
                $this->deleteManagedFile($item->file_path);
            }
            $validated['file_path'] = $request->file('file')->store('protected-content/content-items', 'local');
            $validated['file_name'] = $request->file('file')->getClientOriginalName();
        }

        $item->update($validated);
        $this->forgetPublicCache($item->section);

        return response()->json(['data' => $this->transform($item->fresh(), true)]);
    }

    /**
     * DELETE /api/admin/items/{item}
     */
    public function destroy(ContentItem $item)
    {
        $section = $item->section;
        if ($item->file_path) {
            $this->deleteManagedFile($item->file_path);
        }

        $item->delete();
        $this->forgetPublicCache($section);

        return response()->json(['message' => 'Deleted.']);
    }

    private function validateItem(Request $request, ?int $ignoreId = null): array
    {
        $validated = $request->validate([
            'section' => ['required', Rule::in(ContentItem::allValidSections())],
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'link' => 'nullable|url|max:2048',
            'event_date' => 'nullable|date',
            'meta' => 'nullable|array',
            'sort_order' => 'nullable|integer',
            'is_active' => 'nullable|boolean',
            'file' => 'nullable|file|max:5242880', // 5GB (5 * 1024 * 1024 KB)
        ]);

        unset($validated['file']);
        $validated['is_active'] = $request->boolean('is_active', true);

        return $validated;
    }

    /**
     * GET /api/stream/{item}
     * High-performance chunked media streaming with HTTP 206 Partial Content support.
     * Allows video seeking, instant playback, and streaming of files up to 5GB without memory overhead.
     */
    public function stream(Request $request, ContentItem $item)
    {
        if (! $request->hasValidSignature()) {
            abort(403, 'Protected resource access has expired or is invalid.');
        }

        $disk = $this->managedDisk($item->file_path);
        if (! $item->file_path || ! $disk || ! $disk->exists($item->file_path)) {
            abort(404, 'File not found');
        }

        // An HTML <video src="..."> element loads this URL directly, as a
        // plain browser request -- it can NOT attach an Authorization
        // header, so checking a bearer token here would reject every real
        // playback request even for a paying visitor. Instead, transform()
        // only ever hands out a *signed* URL for a video the current
        // visitor is entitled to -- the proof of entitlement is baked into
        // the URL's signature itself, checked here, rather than a header.
        $path = $disk->path($item->file_path);
        $fileSize = filesize($path);
        $mimeType = @mime_content_type($path) ?: 'application/octet-stream';

        $extension = strtolower(pathinfo($item->file_name ?: $item->file_path, PATHINFO_EXTENSION));
        $allMimes = [
            // Video
            'mp4' => 'video/mp4',
            'webm' => 'video/webm',
            'ogg' => 'video/ogg',
            'ogv' => 'video/ogg',
            'mov' => 'video/quicktime',
            'mkv' => 'video/x-matroska',
            'm4v' => 'video/mp4',
            'avi' => 'video/x-msvideo',
            // Documents & PDFs
            'pdf' => 'application/pdf',
            'txt' => 'text/plain',
            'html' => 'text/html',
            'csv' => 'text/csv',
            'doc' => 'application/msword',
            'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'ppt' => 'application/vnd.ms-powerpoint',
            'pptx' => 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'xls' => 'application/vnd.ms-excel',
            'xlsx' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'zip' => 'application/zip',
            // Images
            'png' => 'image/png',
            'jpg' => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'webp' => 'image/webp',
            'gif' => 'image/gif',
            'svg' => 'image/svg+xml',
        ];
        if (isset($allMimes[$extension])) {
            $mimeType = $allMimes[$extension];
        }

        $range = request()->header('Range');
        if (! $range) {
            return response()->file($path, [
                'Content-Type' => $mimeType,
                'Content-Length' => $fileSize,
                'Content-Disposition' => 'inline; filename="' . ($item->file_name ?: basename($path)) . '"',
                'Accept-Ranges' => 'bytes',
                'Access-Control-Allow-Origin' => '*',
                'X-Content-Type-Options' => 'nosniff',
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

        return response()->stream(function () use ($path, $start, $length) {
            $handle = fopen($path, 'rb');
            if ($handle === false) {
                return;
            }
            fseek($handle, $start);
            $bufferSize = 1024 * 128;
            $remaining = $length;
            while ($remaining > 0 && ! feof($handle)) {
                $readLength = min($bufferSize, $remaining);
                $buffer = fread($handle, $readLength);
                if ($buffer === false) {
                    break;
                }
                echo $buffer;
                flush();
                $remaining -= strlen($buffer);
            }
            fclose($handle);
        }, 206, $headers);
    }

    /**
     * GET /api/download/{item}
     * Download attached file with original filename. Only non-video files can be downloaded directly.
     */
    public function download(ContentItem $item)
    {
        abort(403, 'Protected resources are view-only and cannot be downloaded.');
    }

    private function assertValidSection(string $section): void
    {
        if (! in_array($section, ContentItem::allValidSections(), true)) {
            abort(404, 'Unknown section.');
        }
    }

    private function publicCacheKey(string $section): string
    {
        return "public-content-items:{$section}";
    }

    private function forgetPublicCache(string $section): void
    {
        Cache::forget($this->publicCacheKey($section));
    }

    private function managedDisk(?string $path)
    {
        if (! $path || str_starts_with($path, 'http://') || str_starts_with($path, 'https://')) {
            return null;
        }

        return Storage::disk('local')->exists($path) ? Storage::disk('local') : Storage::disk('public');
    }

    private function deleteManagedFile(?string $path): void
    {
        $disk = $this->managedDisk($path);
        if ($disk && $disk->exists($path)) {
            $disk->delete($path);
        }
    }

    private function isVideoFilename(?string $filename): bool
    {
        if (! $filename) {
            return false;
        }
        $extension = strtolower(pathinfo($filename, PATHINFO_EXTENSION));

        return in_array($extension, ['mp4', 'webm', 'ogg', 'ogv', 'mov', 'mkv', 'm4v', 'avi'], true);
    }

    /**
     * Resolves the user attached to a request's bearer token, if any, without
     * ever failing the request when the token is missing or invalid -- this
     * is used on PUBLIC endpoints, so an anonymous visitor is a normal case,
     * not an error.
     */
    private function resolveRequestUser(Request $request)
    {
        $token = $request->bearerToken();
        if (! $token) {
            return null;
        }

        $sessionCache = app(UserSessionCache::class);
        $session = $sessionCache->resolve($token);

        return $session ? $sessionCache->user($session) : null;
    }

    /**
     * The rule from the brief: only the "online_class" section is paywalled,
     * and only for a visitor who is both logged in AND has a completed
     * payment. Every other section is open to everyone, as before.
     */
    private function requesterIsEntitled(Request $request, string $section): bool
    {
        if ($section !== 'online_class') {
            return true;
        }

        $user = $this->resolveRequestUser($request);

        return (bool) $user?->hasPaidForOnlineClass();
    }

    private function transform(ContentItem $item, bool $entitled = true): array
    {
        $isVideo = $this->isVideoFilename($item->file_name ?: $item->file_path);
        $locked = $item->section === 'online_class' && $isVideo && ! $entitled;
        $isPaywalledVideo = $item->section === 'online_class' && $isVideo;

        $fileUrl = null;
        $downloadUrl = null;
        if ($item->file_path && ! $locked) {
            // HTML media elements cannot attach a bearer header. A short-lived
            // signed URL is therefore issued only after this controller has
            // evaluated the visitor's entitlement in publicIndex().
            $fileUrl = URL::temporarySignedRoute('stream.item', now()->addMinutes(30), ['item' => $item->id]);
        }

        return [
            'id' => $item->id,
            'section' => $item->section,
            'title' => $item->title,
            'description' => $item->description,
            'file_url' => $fileUrl,
            'download_url' => $downloadUrl,
            'file_name' => $item->file_name,
            'link' => $item->link,
            'event_date' => $item->event_date?->toIso8601String(),
            'meta' => $item->meta,
            'sort_order' => $item->sort_order,
            'is_active' => $item->is_active,
            'created_at' => $item->created_at?->toIso8601String(),
            // True only for an Online Classes video the current visitor
            // hasn't unlocked yet -- the frontend shows a login/pay CTA
            // instead of a player when this is true.
            'locked' => $locked,
            'is_video' => $isVideo,
        ];
    }
}
