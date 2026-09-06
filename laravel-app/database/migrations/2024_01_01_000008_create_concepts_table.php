<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('concepts', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('short_description')->nullable();
            $table->longText('description')->nullable();
            $table->json('important_points')->nullable();
            $table->json('topics_covered')->nullable();
            $table->longText('examples_notes')->nullable();
            $table->string('image_path')->nullable();
            $table->string('icon_class')->nullable()->default('bi-journal-code');
            $table->string('color_scheme')->default('blue'); // blue, cyan, purple, emerald, amber, rose, indigo, teal, dark-gold
            $table->decimal('rating', 2, 1)->default(5.0);
            $table->integer('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('concepts');
    }
};
