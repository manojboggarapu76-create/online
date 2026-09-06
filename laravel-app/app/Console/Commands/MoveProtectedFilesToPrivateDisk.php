<?php

namespace App\Console\Commands;

use App\Models\ConceptDocument;
use App\Models\ConceptVideo;
use App\Models\ContentItem;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class MoveProtectedFilesToPrivateDisk extends Command
{
    protected $signature = 'security:move-protected-files {--force : Move files; without this option only report candidates}';

    protected $description = 'Move existing course resource files from the public disk to Laravel private storage.';

    public function handle(): int
    {
        $resources = [
            'content items' => ContentItem::query()->whereNotNull('file_path')->get(['id', 'file_path']),
            'concept documents' => ConceptDocument::query()->whereNotNull('file_path')->get(['id', 'file_path']),
            'concept videos' => ConceptVideo::query()->whereNotNull('file_path')->get(['id', 'file_path']),
        ];

        $force = (bool) $this->option('force');
        $moved = 0;
        $skipped = 0;

        foreach ($resources as $label => $items) {
            foreach ($items as $item) {
                $path = $item->file_path;
                if (! $path || str_starts_with($path, 'http://') || str_starts_with($path, 'https://')) {
                    $skipped++;
                    continue;
                }

                if (Storage::disk('local')->exists($path)) {
                    $skipped++;
                    continue;
                }

                if (! Storage::disk('public')->exists($path)) {
                    $this->warn("Missing {$label} file: {$path}");
                    $skipped++;
                    continue;
                }

                if (! $force) {
                    $this->line("Would move {$label} #{$item->id}: {$path}");
                    continue;
                }

                $stream = Storage::disk('public')->readStream($path);
                if ($stream === false || ! Storage::disk('local')->writeStream($path, $stream)) {
                    if (is_resource($stream)) {
                        fclose($stream);
                    }
                    $this->error("Could not move {$label} #{$item->id}: {$path}");
                    return self::FAILURE;
                }
                fclose($stream);
                Storage::disk('public')->delete($path);
                $moved++;
            }
        }

        if (! $force) {
            $this->info('Dry run complete. Review the list, back up storage, then run: php artisan security:move-protected-files --force');
            return self::SUCCESS;
        }

        $this->info("Moved {$moved} protected files. Skipped {$skipped} files.");
        return self::SUCCESS;
    }
}
