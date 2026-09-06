<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** Index the predicates and ordering used by high-traffic request paths. */
    public function up(): void
    {
        Schema::table('user_sessions', fn (Blueprint $table) => $table->index('expires_at', 'user_sessions_expires_at_idx'));
        Schema::table('login_records', function (Blueprint $table) {
            $table->index('login_at', 'login_records_login_at_idx');
            $table->index(['user_id', 'login_at'], 'login_records_user_login_at_idx');
        });
        Schema::table('content_items', fn (Blueprint $table) => $table->index(['section', 'is_active', 'sort_order', 'created_at'], 'content_items_public_list_idx'));
        Schema::table('payments', function (Blueprint $table) {
            $table->index(['user_id', 'purpose', 'status'], 'payments_user_purpose_status_idx');
            $table->index(['purpose', 'status'], 'payments_purpose_status_idx');
        });
        Schema::table('reviews', fn (Blueprint $table) => $table->index(['is_approved', 'created_at'], 'reviews_public_list_idx'));
        Schema::table('concepts', fn (Blueprint $table) => $table->index(['is_active', 'sort_order', 'id'], 'concepts_public_list_idx'));
        Schema::table('concept_documents', fn (Blueprint $table) => $table->index(['concept_id', 'is_active', 'sort_order', 'id'], 'concept_documents_public_list_idx'));
        Schema::table('concept_videos', fn (Blueprint $table) => $table->index(['concept_id', 'is_active', 'sort_order', 'id'], 'concept_videos_public_list_idx'));
        Schema::table('career_pathways', fn (Blueprint $table) => $table->index(['is_active', 'sort_order', 'id'], 'career_pathways_public_list_idx'));
    }

    public function down(): void
    {
        Schema::table('career_pathways', fn (Blueprint $table) => $table->dropIndex('career_pathways_public_list_idx'));
        Schema::table('concept_videos', fn (Blueprint $table) => $table->dropIndex('concept_videos_public_list_idx'));
        Schema::table('concept_documents', fn (Blueprint $table) => $table->dropIndex('concept_documents_public_list_idx'));
        Schema::table('concepts', fn (Blueprint $table) => $table->dropIndex('concepts_public_list_idx'));
        Schema::table('reviews', fn (Blueprint $table) => $table->dropIndex('reviews_public_list_idx'));
        Schema::table('payments', function (Blueprint $table) {
            $table->dropIndex('payments_user_purpose_status_idx');
            $table->dropIndex('payments_purpose_status_idx');
        });
        Schema::table('content_items', fn (Blueprint $table) => $table->dropIndex('content_items_public_list_idx'));
        Schema::table('login_records', function (Blueprint $table) {
            $table->dropIndex('login_records_login_at_idx');
            $table->dropIndex('login_records_user_login_at_idx');
        });
        Schema::table('user_sessions', fn (Blueprint $table) => $table->dropIndex('user_sessions_expires_at_idx'));
    }
};
