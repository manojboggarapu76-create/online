<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ContentItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'section',
        'title',
        'description',
        'file_path',
        'file_name',
        'link',
        'event_date',
        'meta',
        'sort_order',
        'is_active',
    ];

    protected $casts = [
        'meta' => 'array',
        'event_date' => 'datetime',
        'is_active' => 'boolean',
    ];

    // Valid values for the `section` column -- shared by the controller
    // for validation and by anything else that needs the canonical list.
    public const SECTIONS = [
        'lecture_material',
        'online_class',
        'suggestion',
        'proxy_support',
        'registration',
    ];

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeSection($query, string $section)
    {
        return $query->where('section', $section);
    }
}
