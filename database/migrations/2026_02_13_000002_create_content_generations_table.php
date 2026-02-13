<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('content_generations', function (Blueprint $table) {
            $table->id();
            $table->uuid('aggregate_id')->unique();
            $table->text('prompt');
            $table->text('generated_content')->nullable();
            $table->string('status')->default('pending');
            $table->text('failure_reason')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('content_generations');
    }
};
