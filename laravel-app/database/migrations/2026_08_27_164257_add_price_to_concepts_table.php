<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add price column to concepts table.
     * Default 499 — individual concept subjects can be priced differently via the model accessor.
     */
    public function up(): void
    {
        Schema::table('concepts', function (Blueprint $table) {
            $table->unsignedInteger('price')->default(499)->after('rating');
        });
    }

    public function down(): void
    {
        Schema::table('concepts', function (Blueprint $table) {
            $table->dropColumn('price');
        });
    }
};
