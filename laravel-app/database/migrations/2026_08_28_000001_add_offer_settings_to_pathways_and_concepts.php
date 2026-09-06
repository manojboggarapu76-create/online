<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('career_pathways', function (Blueprint $table) {
            $table->unsignedInteger('original_price')->nullable();
            // Career pathways already displayed promotional pricing, so keep
            // that existing presentation until an admin switches it off.
            $table->boolean('offer_enabled')->default(true);
        });

        Schema::table('concepts', function (Blueprint $table) {
            $table->unsignedInteger('original_price')->nullable();
            // Lecture materials previously had a single normal price.
            $table->boolean('offer_enabled')->default(false);
        });

        // Preserve the existing pathway offer experience for already-created
        // tracks, but make its reference price explicit and admin-editable.
        DB::table('career_pathways')->orderBy('id')->each(function ($pathway) {
            $price = (int) $pathway->price;
            $originalPrice = $price === 499 ? 1499 : ($price === 599 ? 1999 : ($price === 399 ? 1199 : (int) round($price * 2.8)));

            DB::table('career_pathways')->where('id', $pathway->id)->update([
                'original_price' => $originalPrice,
                'offer_enabled' => true,
            ]);
        });
    }

    public function down(): void
    {
        Schema::table('career_pathways', function (Blueprint $table) {
            $table->dropColumn(['original_price', 'offer_enabled']);
        });

        Schema::table('concepts', function (Blueprint $table) {
            $table->dropColumn(['original_price', 'offer_enabled']);
        });
    }
};
