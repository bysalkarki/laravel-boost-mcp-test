<?php

namespace App\Models\ReadModels;

use Illuminate\Database\Eloquent\Model;

class ContentGeneration extends Model
{
    protected $table = 'content_generations';

    protected $fillable = [
        'aggregate_id',
        'prompt',
        'generated_content',
        'status',
        'failure_reason',
    ];
}
