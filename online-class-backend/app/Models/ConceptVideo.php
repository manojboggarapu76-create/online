<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ConceptVideo extends Model
{
    use HasFactory;

    protected $fillable = [
        'concept_id',
        'title',
        'description',
        'video_url',
        'file_path',
        'thumbnail_path',
        'duration',
        'sort_order',
        'is_active',
        'is_locked',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'is_locked' => 'boolean',
        'sort_order' => 'integer',
    ];

    protected $appends = [
        'stream_url',
        'thumbnail_url',
    ];

    public function getStreamUrlAttribute(): ?string
    {
        if ($this->video_url) {
            return $this->video_url;
        }

        if ($this->file_path) {
            if (str_starts_with($this->file_path, 'http://') || str_starts_with($this->file_path, 'https://')) {
                return $this->file_path;
            }
            return url('api/concepts/videos/' . $this->id . '/stream');
        }

        return null;
    }

    public function getThumbnailUrlAttribute(): ?string
    {
        if (!$this->thumbnail_path) {
            return null;
        }

        if (str_starts_with($this->thumbnail_path, 'http://') || str_starts_with($this->thumbnail_path, 'https://')) {
            return $this->thumbnail_path;
        }

        return url('storage/' . $this->thumbnail_path);
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
