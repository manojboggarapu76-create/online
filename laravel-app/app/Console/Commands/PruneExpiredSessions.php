<?php

namespace App\Console\Commands;

use App\Models\AdminSession;
use App\Models\UserSession;
use Illuminate\Console\Command;

class PruneExpiredSessions extends Command
{
    protected $signature = 'sessions:prune-expired';
    protected $description = 'Delete expired student and administrator session tokens';

    public function handle(): int
    {
        $now = now();
        $studentCount = UserSession::where('expires_at', '<=', $now)->delete();
        $adminCount = AdminSession::where('expires_at', '<=', $now)->delete();

        $this->info("Pruned {$studentCount} student and {$adminCount} admin sessions.");

        return self::SUCCESS;
    }
}
