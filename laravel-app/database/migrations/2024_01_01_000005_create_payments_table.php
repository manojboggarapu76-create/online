<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * One row per Razorpay order. Created (status=created) the moment
     * PaymentController@createOrder asks Razorpay for an order id, then
     * flipped to status=paid the moment PaymentController@verify checks
     * out the signature Razorpay returns to the browser. The admin
     * "Payments" tab reads straight from this table, so it is accurate
     * the instant a payment is verified -- no separate sync step.
     */
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('purpose')->default('online_class'); // what access this unlocks
            $table->string('razorpay_order_id')->unique();
            $table->string('razorpay_payment_id')->nullable()->unique();
            $table->string('razorpay_signature')->nullable();
            $table->unsignedInteger('amount'); // smallest currency unit (paise for INR)
            $table->string('currency', 8)->default('INR');
            $table->enum('status', ['created', 'paid', 'failed'])->default('created')->index();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
