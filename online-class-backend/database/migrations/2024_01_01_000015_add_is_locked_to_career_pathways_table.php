<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('career_pathways', function (Blueprint $table) {
            // When true (default), this pathway requires payment when the global
            // payment_required toggle is ON. When false, access is free regardless
            // of the global switch.
            $table->boolean('is_locked')->default(true)->after('is_active');
        });
    }

    public function down(): void
    {
        Schema::table('career_pathways', function (Blueprint $table) {
            $table->dropColumn('is_locked');
        });
    }
};
