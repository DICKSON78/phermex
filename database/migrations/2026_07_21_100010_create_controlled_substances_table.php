<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('controlled_substances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pharmacy_id')->constrained('pharmacies')->cascadeOnDelete();
            $table->foreignId('drug_id')->constrained('drugs')->cascadeOnDelete();
            $table->enum('schedule', ['schedule_i', 'schedule_ii', 'schedule_iii']);
            $table->string('register_number');
            $table->date('date_received');
            $table->integer('quantity_received');
            $table->integer('balance_stock');
            $table->string('issued_to')->nullable();
            $table->integer('quantity_issued')->default(0);
            $table->date('issue_date')->nullable();
            $table->foreignId('issuing_pharmacist_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('receiving_person_name')->nullable();
            $table->string('receiving_person_id_number')->nullable()->comment('NIDA ID number');
            $table->string('witness_name')->nullable();
            $table->string('witness_id_number')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['pharmacy_id', 'register_number']);
            $table->index(['pharmacy_id', 'schedule']);
            $table->index(['drug_id', 'schedule']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('controlled_substances');
    }
};
