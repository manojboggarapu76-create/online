<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('career_pathways', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->string('title');
            $table->string('badge')->default('Popular');
            $table->string('color')->default('#3b82f6');
            $table->string('icon')->default('bi-diagram-3-fill');
            $table->text('description')->nullable();
            $table->json('skills')->nullable();
            $table->string('duration')->default('12 Weeks');
            $table->string('level')->default('All Levels');
            $table->integer('price')->default(499);
            $table->json('curriculum_modules')->nullable();
            $table->integer('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('career_pathways');
    }
};
