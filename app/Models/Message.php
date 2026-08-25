<?php

namespace App\Models;

use App\Models\Scopes\TenantScoped;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Message extends Model
{
    use TenantScoped;
    protected $fillable = [
        'pharmacy_id',
        'sender_id',
        'receiver_id',
        'message',
        'message_type',
        'is_read',
    ];

    protected $casts = [
        'is_read' => 'boolean',
    ];

    public function pharmacy(): BelongsTo
    {
        return $this->belongsTo(Pharmacy::class);
    }

    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    public function receiver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'receiver_id');
    }

    public static function conversation(int $userId1, int $userId2, int $pharmacyId)
    {
        return self::where('pharmacy_id', $pharmacyId)
            ->where(function ($q) use ($userId1, $userId2) {
                $q->where('sender_id', $userId1)->where('receiver_id', $userId2)
                  ->orWhere('sender_id', $userId2)->where('receiver_id', $userId1);
            })
            ->orderBy('created_at', 'asc');
    }
}
