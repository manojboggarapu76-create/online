<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Concept extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'short_description',
        'description',
        'important_points',
        'topics_covered',
        'examples_notes',
        'image_path',
        'icon_class',
        'color_scheme',
        'rating',
        'price',
        'sort_order',
        'is_active',
        'is_locked',
    ];

    protected $casts = [
        'important_points' => 'array',
        'topics_covered' => 'array',
        'rating' => 'float',
        'price' => 'integer',
        'is_active' => 'boolean',
        'is_locked' => 'boolean',
        'sort_order' => 'integer',
    ];

    protected $appends = [
        'image_url',
        'price',
    ];

    public function getImageUrlAttribute(): ?string
    {
        if (!$this->image_path) {
            return null;
        }

        if (str_starts_with($this->image_path, 'http://') || str_starts_with($this->image_path, 'https://')) {
            return $this->image_path;
        }

        return url('storage/' . $this->image_path);
    }

    public function getPriceAttribute($value): int
    {
        if ($value !== null && (int)$value > 0) {
            return (int)$value;
        }

        $slug = strtolower(($this->slug ?? '') . ' ' . ($this->name ?? ''));
        if (str_contains($slug, 'ai') || str_contains($slug, 'machine') || str_contains($slug, 'learning')) {
            return 599;
        }
        if (str_contains($slug, 'database') || str_contains($slug, 'sql')) {
            return 399;
        }

        return 499;
    }

    public function documents(): HasMany
    {
        return $this->hasMany(ConceptDocument::class)->orderBy('sort_order')->orderBy('id');
    }

    public function videos(): HasMany
    {
        return $this->hasMany(ConceptVideo::class)->orderBy('sort_order')->orderBy('id');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
