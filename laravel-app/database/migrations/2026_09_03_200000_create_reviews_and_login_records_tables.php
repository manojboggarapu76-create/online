<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Reviews table for student ratings and feedback
        if (!Schema::hasTable('reviews')) {
            Schema::create('reviews', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
                $table->unsignedTinyInteger('rating'); // 1 to 5
                $table->text('review');
                $table->boolean('is_featured')->default(false);
                $table->boolean('is_approved')->default(true);
                $table->timestamps();
            });
        }

        // 2. Login records table for tracking each user login event
        if (!Schema::hasTable('login_records')) {
            Schema::create('login_records', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
                $table->string('ip_address', 45)->nullable();
                $table->text('user_agent')->nullable();
                $table->timestamp('login_at')->nullable();
                $table->timestamps();
            });
        }

        // 3. Add login tracking columns to users table if not existing
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'login_count')) {
                $table->unsignedInteger('login_count')->default(0)->after('password');
            }
            if (!Schema::hasColumn('users', 'last_login_at')) {
                $table->timestamp('last_login_at')->nullable()->after('login_count');
            }
            if (!Schema::hasColumn('users', 'last_login_ip')) {
                $table->string('last_login_ip', 45)->nullable()->after('last_login_at');
            }
        });

        // 4. Backfill login records from existing user_sessions
        try {
            if (Schema::hasTable('user_sessions')) {
                $sessions = DB::table('user_sessions')->orderBy('created_at', 'asc')->get();
                foreach ($sessions as $s) {
                    DB::table('login_records')->insert([
                        'user_id' => $s->user_id,
                        'ip_address' => '127.0.0.1',
                        'user_agent' => 'Web Browser Session',
                        'login_at' => $s->created_at ?? now(),
                        'created_at' => $s->created_at ?? now(),
                        'updated_at' => $s->updated_at ?? now(),
                    ]);
                }

                $users = DB::table('users')->get();
                foreach ($users as $u) {
                    $cnt = DB::table('login_records')->where('user_id', $u->id)->count();
                    $last = DB::table('login_records')->where('user_id', $u->id)->orderBy('login_at', 'desc')->first();
                    DB::table('users')->where('id', $u->id)->update([
                        'login_count' => max($cnt, 1),
                        'last_login_at' => $last?->login_at ?? $u->created_at ?? now(),
                        'last_login_ip' => '127.0.0.1',
                    ]);
                }
            }
        } catch (\Throwable $e) {
            // Ignore backfill errors if any
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('reviews');
        Schema::dropIfExists('login_records');

        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'login_count')) {
                $table->dropColumn('login_count');
            }
            if (Schema::hasColumn('users', 'last_login_at')) {
                $table->dropColumn('last_login_at');
            }
            if (Schema::hasColumn('users', 'last_login_ip')) {
                $table->dropColumn('last_login_ip');
            }
        });
    }
};
