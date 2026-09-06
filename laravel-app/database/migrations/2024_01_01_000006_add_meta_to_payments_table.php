<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Small audit trail for support/debugging: which path confirmed this
     * payment (the browser-triggered /verify, or the authoritative
     * Razorpay webhook) and the raw event payload that proved it, if any.
     */
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->json('meta')->nullable()->after('status');
        });
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropColumn('meta');
        });
    }
};
