<?php

namespace App\Console\Commands;

use Illuminate\Foundation\Console\ServeCommand as BaseServeCommand;

class ServeCommand extends BaseServeCommand
{
    /**
     * Get the full server command with 5GB upload limits configured.
     *
     * @return array
     */
    protected function serverCommand()
    {
        $command = parent::serverCommand();
        $phpBinary = array_shift($command);

        return [
            $phpBinary,
            '-d', 'upload_max_filesize=5120M',
            '-d', 'post_max_size=5120M',
            '-d', 'memory_limit=1024M',
            '-d', 'max_execution_time=0',
            '-d', 'max_input_time=-1',
            ...$command,
        ];
    }
}
