<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

/**
 * NOTE: every fresh Laravel install already ships a `users` table
 * (migration 2014_10_12_000000_create_users_table.php) and a matching
 * app/Models/User.php. This file REPLACES that default User.php -- it's
 * the same scaffold, with two additions at the bottom (sessions/payments)
 * for student login and the Online Classes paywall.
 */
class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
    ];

    public function sessions()
    {
        return $this->hasMany(UserSession::class);
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }

    /**
     * Whether this user has ever completed a paid "online_class" order.
     * Access is a one-time unlock (no expiry) once a payment is verified.
     */
    public function hasPaidForOnlineClass(): bool
    {
        return $this->payments()
            ->where('purpose', 'online_class')
            ->where('status', 'paid')
            ->exists();
    }
}
