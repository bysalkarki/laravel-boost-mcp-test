<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('domain_events', function (Blueprint $table) {
            $table->id();
            $table->uuid('event_id')->unique();
            $table->uuid('aggregate_id')->index();
            $table->string('aggregate_type');
            $table->string('event_type');
            $table->unsignedInteger('version');
            $table->json('payload');
            $table->json('metadata')->nullable();
            $table->timestamp('occurred_at');

            $table->unique(['aggregate_id', 'version']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('domain_events');
    }
};
