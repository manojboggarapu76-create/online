<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('concept_documents', function (Blueprint $table) {
            $table->boolean('is_locked')->default(true)->after('is_active');
        });

        Schema::table('concept_videos', function (Blueprint $table) {
            $table->boolean('is_locked')->default(true)->after('is_active');
        });
    }

    public function down(): void
    {
        Schema::table('concept_documents', function (Blueprint $table) {
            $table->dropColumn('is_locked');
        });

        Schema::table('concept_videos', function (Blueprint $table) {
            $table->dropColumn('is_locked');
        });
    }
};
