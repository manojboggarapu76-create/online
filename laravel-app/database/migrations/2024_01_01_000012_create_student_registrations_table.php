<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('student_registrations', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email');
            $table->string('phone');
            $table->string('course_track')->nullable();
            $table->string('background')->nullable();
            $table->string('preferred_batch')->nullable();
            $table->text('notes')->nullable();
            $table->string('status')->default('pending'); // 'pending' | 'contacted' | 'enrolled' | 'closed'
            $table->text('admin_notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_registrations');
    }
};
