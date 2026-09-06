<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * One table backs every dashboard section (lecture_material, online_class,
     * suggestion, proxy_support, registration). The `section` column is what
     * the frontend filters on, so the admin panel and public dashboard share
     * a single CRUD surface instead of five near-identical ones.
     */
    public function up(): void
    {
        Schema::create('content_items', function (Blueprint $table) {
            $table->id();
            $table->enum('section', [
                'lecture_material',
                'online_class',
                'suggestion',
                'proxy_support',
                'registration',
            ])->index();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('file_path')->nullable();   // uploaded PDF/doc/slide etc.
            $table->string('file_name')->nullable();    // original filename, for display
            $table->string('link')->nullable();         // meeting link / registration link / external url
            $table->dateTime('event_date')->nullable();  // class time, deadline, etc.
            $table->json('meta')->nullable();            // small extra fields per section (instructor, seats, etc.)
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('content_items');
    }
};
