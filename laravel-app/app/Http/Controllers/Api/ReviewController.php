<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LoginRecord;
use App\Models\Review;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class ReviewController extends Controller
{
    /**
     * GET /api/user/my-review
     * Retrieve the current authenticated student's review (if submitted).
     */
    public function getMyReview(Request $request)
    {
        $user = $request->attributes->get('auth_user');

        $review = Review::where('user_id', $user->id)->first();

        return response()->json([
            'review' => $review,
        ]);
    }

    /**
     * POST /api/user/reviews
     * Submit or update review and rating from the main dashboard (only when logged in).
     */
    public function storeOrUpdate(Request $request)
    {
        $user = $request->attributes->get('auth_user');

        $validated = $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'review' => 'required|string|min:3|max:2000',
        ]);

        $review = Review::updateOrCreate(
            ['user_id' => $user->id],
            [
                'rating' => $validated['rating'],
                'review' => trim($validated['review']),
                'is_approved' => true,
            ]
        );
        Cache::forget('public-approved-reviews');

        return response()->json([
            'message' => 'Thank you! Your review and rating have been saved.',
            'review' => $review,
        ]);
    }

    /**
     * GET /api/reviews
     * Public list of approved reviews for testimonials.
     */
    public function getPublicReviews()
    {
        $reviews = Cache::remember('public-approved-reviews', now()->addMinutes(5), fn () => Review::with('user:id,name')
            ->where('is_approved', true)
            ->orderBy('created_at', 'desc')
            ->limit(20)
            ->get());

        return response()->json([
            'data' => $reviews,
        ]);
    }

    /**
     * GET /api/admin/reviews
     * Complete admin audit of all reviews with comprehensive user account details.
     */
    public function adminIndex(Request $request)
    {
        $reviews = Review::with(['user.payments'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($rev) {
                $user = $rev->user;
                return [
                    'id' => $rev->id,
                    'rating' => $rev->rating,
                    'review' => $rev->review,
                    'is_featured' => (bool) $rev->is_featured,
                    'is_approved' => (bool) $rev->is_approved,
                    'created_at' => $rev->created_at?->toIso8601String(),
                    'updated_at' => $rev->updated_at?->toIso8601String(),
                    'user' => $user ? [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'registered_at' => $user->created_at?->toIso8601String(),
                        'login_count' => $user->login_count ?? 1,
                        'last_login_at' => $user->last_login_at?->toIso8601String(),
                        'last_login_ip' => $user->last_login_ip ?? '127.0.0.1',
                        'is_paid' => $user->hasPaidForOnlineClass(),
                        'payments_count' => $user->payments->where('status', 'paid')->count(),
                        'total_paid' => $user->payments->where('status', 'paid')->sum('amount'),
                    ] : null,
                ];
            });

        return response()->json([
            'data' => $reviews,
        ]);
    }

    /**
     * PATCH /api/admin/reviews/{id}/feature
     * Toggle featured badge for display on homepage testimonials.
     */
    public function adminToggleFeature($id)
    {
        $review = Review::findOrFail($id);
        $review->is_featured = !$review->is_featured;
        $review->save();
        Cache::forget('public-approved-reviews');

        return response()->json([
            'message' => $review->is_featured ? 'Review is now featured on the homepage!' : 'Review removed from featured list.',
            'review' => $review,
        ]);
    }

    /**
     * DELETE /api/admin/reviews/{id}
     */
    public function adminDestroy($id)
    {
        $review = Review::findOrFail($id);
        $review->delete();
        Cache::forget('public-approved-reviews');

        return response()->json([
            'message' => 'Review deleted successfully.',
        ]);
    }

    /**
     * GET /api/admin/user-logins-stats
     * Return comprehensive user login occurrences, account details, and analytics.
     */
    public function adminLoginStats(Request $request)
    {
        $totalLogins = LoginRecord::count();
        $totalUsers = User::count();
        $totalReviews = Review::count();
        $avgRating = Review::avg('rating') ? round((float) Review::avg('rating'), 1) : 5.0;

        // Rating breakdown
        $ratingDistribution = [
            5 => Review::where('rating', 5)->count(),
            4 => Review::where('rating', 4)->count(),
            3 => Review::where('rating', 3)->count(),
            2 => Review::where('rating', 2)->count(),
            1 => Review::where('rating', 1)->count(),
        ];

        // Recent login records (last 50 events)
        $recentLogins = LoginRecord::with('user:id,name,email')
            ->orderBy('login_at', 'desc')
            ->limit(50)
            ->get()
            ->map(function ($record) {
                return [
                    'id' => $record->id,
                    'user_id' => $record->user_id,
                    'user_name' => $record->user?->name ?? 'Deleted User',
                    'user_email' => $record->user?->email ?? 'N/A',
                    'ip_address' => $record->ip_address ?? '127.0.0.1',
                    'user_agent' => $record->user_agent ?? 'Web Browser',
                    'login_at' => $record->login_at?->toIso8601String() ?? $record->created_at?->toIso8601String(),
                ];
            });

        // Registered accounts directory with their login statistics
        $userAccounts = User::withCount(['loginRecords', 'reviews'])
            ->with(['payments'])
            ->orderBy('id', 'desc')
            ->get()
            ->map(function ($u) {
                return [
                    'id' => $u->id,
                    'name' => $u->name,
                    'email' => $u->email,
                    'registered_at' => $u->created_at?->toIso8601String(),
                    'login_count' => max($u->login_count ?? 0, $u->login_records_count ?? 1),
                    'last_login_at' => $u->last_login_at?->toIso8601String(),
                    'last_login_ip' => $u->last_login_ip ?? '127.0.0.1',
                    'has_reviewed' => $u->reviews_count > 0,
                    'is_paid' => $u->hasPaidForOnlineClass(),
                    'payments_count' => $u->payments->where('status', 'paid')->count(),
                    'total_paid' => $u->payments->where('status', 'paid')->sum('amount'),
                ];
            });

        return response()->json([
            'total_logins' => $totalLogins,
            'total_users' => $totalUsers,
            'total_reviews' => $totalReviews,
            'average_rating' => $avgRating,
            'rating_distribution' => $ratingDistribution,
            'recent_logins' => $recentLogins,
            'user_accounts' => $userAccounts,
        ]);
    }
}
