<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\URL;

class ConceptDocument extends Model
{
    use HasFactory;

    protected $fillable = [
        'concept_id',
        'title',
        'description',
        'file_path',
        'file_name',
        'file_type',
        'file_size',
        'sort_order',
        'is_active',
        'is_locked',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'is_locked' => 'boolean',
        'sort_order' => 'integer',
        'file_size' => 'integer',
    ];

    protected $appends = [
        'file_url',
        'download_url',
        'formatted_size',
    ];

    public function getFileUrlAttribute(): ?string
    {
        if (!$this->file_path) {
            return null;
        }

        if (str_starts_with($this->file_path, 'http://') || str_starts_with($this->file_path, 'https://')) {
            return $this->file_path;
        }

        // The stream route is signature-protected. Admin responses may expose
        // a short-lived view URL; public concept payloads replace this value
        // only after their own student-access check.
        return URL::temporarySignedRoute(
            'concept.document.stream',
            now()->addMinutes(10),
            ['document' => $this->id]
        );
    }

    public function getDownloadUrlAttribute(): ?string
    {
        if (!$this->file_path) {
            return null;
        }

        return url('api/concepts/documents/' . $this->id . '/download');
    }

    public function getFormattedSizeAttribute(): string
    {
        if (!$this->file_size) {
            return 'Document';
        }

        $bytes = $this->file_size;
        if ($bytes >= 1073741824) {
            return number_format($bytes / 1073741824, 2) . ' GB';
        }
        if ($bytes >= 1048576) {
            return number_format($bytes / 1048576, 1) . ' MB';
        }
        if ($bytes >= 1024) {
            return number_format($bytes / 1024, 0) . ' KB';
        }

        return $bytes . ' B';
    }

    public function concept(): BelongsTo
    {
        return $this->belongsTo(Concept::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
