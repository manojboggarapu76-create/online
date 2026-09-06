<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CareerPathway extends Model
{
    use HasFactory;

    protected $fillable = [
        'slug',
        'title',
        'badge',
        'color',
        'icon',
        'description',
        'skills',
        'duration',
        'level',
        'price',
        'curriculum_modules',
        'sort_order',
        'is_active',
        'is_locked',
    ];

    protected $casts = [
        'skills' => 'array',
        'curriculum_modules' => 'array',
        'is_active' => 'boolean',
        'is_locked' => 'boolean',
        'price' => 'integer',
        'sort_order' => 'integer',
    ];

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
