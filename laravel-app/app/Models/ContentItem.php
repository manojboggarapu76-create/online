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

    // Canonical built-in sections
    public const SECTIONS = [
        'lecture_material',
        'online_class',
        'suggestion',
        'proxy_support',
        'registration',
        'interview_prep',
    ];

    /**
     * Get all valid sections (built-in + any custom sections added by the administrator).
     */
    public static function allValidSections(): array
    {
        $sections = self::SECTIONS;
        try {
            $raw = AdminSetting::where('key', 'custom_sections')->value('value');
            if ($raw) {
                $custom = json_decode($raw, true);
                if (is_array($custom)) {
                    foreach ($custom as $item) {
                        if (!empty($item['key']) && !in_array($item['key'], $sections, true)) {
                            $sections[] = $item['key'];
                        }
                    }
                }
            }
        } catch (\Throwable $e) {}

        return $sections;
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeSection($query, string $section)
    {
        return $query->where('section', $section);
    }
}
