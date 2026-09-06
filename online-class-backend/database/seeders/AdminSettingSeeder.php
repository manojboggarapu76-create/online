<?php

namespace Database\Seeders;

use App\Models\AdminSetting;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminSettingSeeder extends Seeder
{
    /**
     * Default admin panel password is "1", exactly as requested.
     * It is stored hashed and can be changed later from inside the
     * admin panel itself (Admin Panel -> Settings -> Change Password).
     */
    public function run(): void
    {
        AdminSetting::updateOrCreate(
            ['key' => 'admin_password'],
            ['value' => Hash::make('1')]
        );
    }
}
