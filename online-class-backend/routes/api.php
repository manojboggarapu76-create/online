<?php

use App\Http\Controllers\Api\AdminAuthController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CareerPathwayController;
use App\Http\Controllers\Api\ConceptController;
use App\Http\Controllers\Api\ContentItemController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\ProxySupportController;
use App\Http\Controllers\Api\RegistrationFormController;
use App\Http\Controllers\Api\SecurityLogController;
use App\Http\Controllers\Api\SiteSettingsController;
use App\Http\Controllers\Api\WelcomeScreenController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Public routes -- read only, no login needed.
|--------------------------------------------------------------------------
*/
Route::get('/sections/{section}', [ContentItemController::class, 'publicIndex']);
Route::get('/stream/{item}', [ContentItemController::class, 'stream'])
    ->middleware('signed')
    ->name('stream.item');
Route::get('/download/{item}', [ContentItemController::class, 'download']);
Route::get('/welcome-screen', [WelcomeScreenController::class, 'getSettings']);
Route::get('/welcome-screen/stream', [WelcomeScreenController::class, 'stream']);
Route::get('/site-settings', [SiteSettingsController::class, 'getPublicSettings']);

/*
|--------------------------------------------------------------------------
| Lecture & Material Concept System (Public)
|--------------------------------------------------------------------------
*/
Route::get('/concepts', [ConceptController::class, 'publicIndex']);
Route::get('/concepts/{identifier}', [ConceptController::class, 'publicShow']);
Route::get('/concepts/documents/{document}/stream', [ConceptController::class, 'streamDocument'])
    ->middleware('signed')
    ->name('concept.document.stream');
Route::get('/concepts/documents/{document}/download', [ConceptController::class, 'downloadDocument']);
Route::get('/concepts/videos/{video}/stream', [ConceptController::class, 'streamVideo'])
    ->middleware('signed')
    ->name('concept.video.stream');

/*
|--------------------------------------------------------------------------
| Career Pathways & Specializations (Public)
|--------------------------------------------------------------------------
*/
Route::get('/career-pathways', [CareerPathwayController::class, 'publicIndex']);
Route::get('/career-pathways/{identifier}', [CareerPathwayController::class, 'publicShow']);

/*
|--------------------------------------------------------------------------
| Student Inquiries: Proxy Support & Course Registrations (Public)
|--------------------------------------------------------------------------
*/
Route::post('/proxy-support/messages', [ProxySupportController::class, 'submitMessage']);
Route::post('/registrations/submit', [RegistrationFormController::class, 'submitRegistration']);

/*
|--------------------------------------------------------------------------
| Security audit ingestion (Public endpoint for recording client events)
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| Student accounts
|--------------------------------------------------------------------------
*/
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);

/*
|--------------------------------------------------------------------------
| Razorpay webhook
|--------------------------------------------------------------------------
*/
Route::post('/payment/webhook', [PaymentController::class, 'webhook']);

Route::middleware('user.auth')->group(function () {
    // Audit data is accepted only from an authenticated student session.
    // This prevents anonymous clients from forging or flooding security logs.
    Route::post('/security/log', [SecurityLogController::class, 'log'])->middleware('throttle:60,1');

    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);

    Route::prefix('payment')->group(function () {
        Route::post('/create-order', [PaymentController::class, 'createOrder']);
        Route::post('/verify', [PaymentController::class, 'verify']);
        Route::get('/status', [PaymentController::class, 'status']);
    });

    // Career Pathway specific checkout and access
    Route::get('/career-pathways-access/status', [CareerPathwayController::class, 'myAccess']);
    Route::post('/career-pathways/{identifier}/create-order', [CareerPathwayController::class, 'createOrder']);
    Route::post('/career-pathways/{identifier}/verify-payment', [CareerPathwayController::class, 'verifyPayment']);

    // Lecture & Material Concept specific checkout and access
    Route::get('/concepts-access/status', [ConceptController::class, 'myAccess']);
    Route::post('/concepts/{identifier}/create-order', [ConceptController::class, 'createOrder']);
    Route::post('/concepts/{identifier}/verify-payment', [ConceptController::class, 'verifyPayment']);
});

/*
|--------------------------------------------------------------------------
| Admin auth & management endpoints
|--------------------------------------------------------------------------
*/
Route::post('/admin/login', [AdminAuthController::class, 'login']);

Route::middleware('admin.auth')->prefix('admin')->group(function () {
    Route::post('/logout', [AdminAuthController::class, 'logout']);
    Route::get('/me', [AdminAuthController::class, 'me']);
    Route::post('/change-password', [AdminAuthController::class, 'changePassword']);

    Route::get('/welcome-screen', [WelcomeScreenController::class, 'getSettings']);
    Route::post('/welcome-screen', [WelcomeScreenController::class, 'updateSettings']);

    Route::get('/site-settings', [SiteSettingsController::class, 'getAdminSettings']);
    Route::post('/site-settings', [SiteSettingsController::class, 'updateAdminSettings']);

    Route::get('/items', [ContentItemController::class, 'adminIndex']);
    Route::post('/items', [ContentItemController::class, 'store']);
    Route::post('/items/{item}', [ContentItemController::class, 'update']);
    Route::delete('/items/{item}', [ContentItemController::class, 'destroy']);

    // Lecture & Material Concept Management
    Route::get('/concepts/stats', [ConceptController::class, 'adminStats']);
    Route::get('/concepts', [ConceptController::class, 'adminConceptsIndex']);
    Route::post('/concepts', [ConceptController::class, 'adminConceptStore']);
    Route::get('/concepts/{concept}', [ConceptController::class, 'adminConceptShow']);
    Route::post('/concepts/{concept}', [ConceptController::class, 'adminConceptUpdate']);
    Route::patch('/concepts/{id}/price', [ConceptController::class, 'adminUpdatePrice']);
    Route::patch('/concepts/{id}/lock', [ConceptController::class, 'adminToggleLock']);
    Route::delete('/concepts/{concept}', [ConceptController::class, 'adminConceptDestroy']);

    Route::get('/concept-documents', [ConceptController::class, 'adminDocumentsIndex']);
    Route::post('/concept-documents', [ConceptController::class, 'adminDocumentStore']);
    Route::post('/concept-documents/{document}', [ConceptController::class, 'adminDocumentUpdate']);
    Route::patch('/concept-documents/{id}/lock', [ConceptController::class, 'adminToggleDocumentLock']);
    Route::delete('/concept-documents/{document}', [ConceptController::class, 'adminDocumentDestroy']);

    Route::get('/concept-videos', [ConceptController::class, 'adminVideosIndex']);
    Route::post('/concept-videos', [ConceptController::class, 'adminVideoStore']);
    Route::post('/concept-videos/{video}', [ConceptController::class, 'adminVideoUpdate']);
    Route::patch('/concept-videos/{id}/lock', [ConceptController::class, 'adminToggleVideoLock']);
    Route::delete('/concept-videos/{video}', [ConceptController::class, 'adminVideoDestroy']);

    // Career Pathways Management
    Route::get('/career-pathways', [CareerPathwayController::class, 'adminIndex']);
    Route::post('/career-pathways', [CareerPathwayController::class, 'adminStore']);
    Route::put('/career-pathways/{id}', [CareerPathwayController::class, 'adminUpdate']);
    Route::patch('/career-pathways/{id}/price', [CareerPathwayController::class, 'adminUpdatePrice']);
    Route::patch('/career-pathways/{id}/lock', [CareerPathwayController::class, 'adminToggleLock']);
    Route::delete('/career-pathways/{id}', [CareerPathwayController::class, 'adminDestroy']);

    // Proxy Support Messages Management
    Route::get('/proxy-messages', [ProxySupportController::class, 'adminIndex']);
    Route::put('/proxy-messages/{id}', [ProxySupportController::class, 'adminUpdate']);
    Route::delete('/proxy-messages/{id}', [ProxySupportController::class, 'adminDestroy']);

    // Student Registrations Management
    Route::get('/registrations', [RegistrationFormController::class, 'adminIndex']);
    Route::put('/registrations/{id}', [RegistrationFormController::class, 'adminUpdate']);
    Route::delete('/registrations/{id}', [RegistrationFormController::class, 'adminDestroy']);

    Route::get('/payments', [PaymentController::class, 'adminIndex']);
    Route::delete('/payments/{id}', [PaymentController::class, 'destroy']);
    Route::delete('/payments', [PaymentController::class, 'clearAll']);

    Route::get('/security-logs', [SecurityLogController::class, 'adminIndex']);
    Route::delete('/security-logs/{id}', [SecurityLogController::class, 'destroy']);
    Route::delete('/security-logs', [SecurityLogController::class, 'clearAll']);
});
