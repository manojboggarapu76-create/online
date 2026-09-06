<?php

use App\Http\Controllers\GoogleOAuthController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "web" middleware group. Make something great!
|
*/

Route::get('/', function () {
    return view('welcome');
});

// Google returns here after its consent screen. These must stay web routes so
// Laravel can keep the same-site session used to validate the OAuth state.
Route::get('/auth/google/redirect', [GoogleOAuthController::class, 'redirect'])->middleware('throttle:10,1');
Route::get('/auth/google/callback', [GoogleOAuthController::class, 'callback'])->middleware('throttle:10,1');
