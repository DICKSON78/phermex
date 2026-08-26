<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Drug;
use App\Models\DrugCategory;
use App\Models\DrugMovement;
use App\Models\Notification;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Pharmacy;
use App\Models\Prescription;
use App\Models\SupportTicket;
use App\Models\TicketReply;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class CustomerAppController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'phone' => 'required|string|max:20',
                'email' => 'required|email|unique:users,email',
                'password' => ['required', 'string', 'min:8', 'confirmed'],
            ]);

            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'phone' => $validated['phone'],
                'role' => 'customer',
                'user_code' => 'CUS-' . strtoupper(Str::random(8)),
                'password' => Hash::make($validated['password']),
                'is_active' => true,
            ]);

            $token = $user->createToken('customer-auth-token')->plainTextToken;

            return response()->json([
                'message' => 'Registration successful.',
                'data' => [
                    'user' => $user,
                    'token' => $token,
                ],
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed.',
                'error' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Registration failed.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function login(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'login' => 'required|string',
                'password' => 'required|string',
            ]);

            $login = $request->input('login');
            $password = $request->input('password');

            $user = User::where(function ($q) use ($login) {
                $q->where('email', $login)->orWhere('phone', $login);
            })->where('role', 'customer')->first();

            if (!$user || !Hash::check($password, $user->password)) {
                return response()->json([
                    'message' => 'Invalid credentials.',
                ], 401);
            }

            if (!$user->is_active) {
                return response()->json([
                    'message' => 'Your account has been deactivated. Please contact support.',
                ], 403);
            }

            $token = $user->createToken('customer-auth-token')->plainTextToken;

            return response()->json([
                'message' => 'Login successful.',
                'data' => [
                    'user' => $user,
                    'token' => $token,
                ],
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed.',
                'error' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Login failed.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function me(Request $request): JsonResponse
    {
        try {
            $user = $request->user();

            return response()->json([
                'message' => 'Profile retrieved.',
                'data' => $user,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to retrieve profile.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function updateProfile(Request $request): JsonResponse
    {
        try {
            $user = $request->user();

            $validated = $request->validate([
                'name' => 'sometimes|string|max:255',
                'phone' => 'sometimes|string|max:20',
                'email' => 'sometimes|email|unique:users,email,' . $user->id,
                'password' => ['sometimes', 'nullable', 'string', 'min:8', 'confirmed'],
            ]);

            if (isset($validated['password']) && $validated['password']) {
                $validated['password'] = Hash::make($validated['password']);
            } else {
                unset($validated['password']);
            }

            $user->update($validated);

            return response()->json([
                'message' => 'Profile updated successfully.',
                'data' => $user->fresh(),
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed.',
                'error' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to update profile.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function nearbyPharmacies(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'latitude' => 'required|numeric|between:-90,90',
                'longitude' => 'required|numeric|between:-180,180',
                'radius_km' => 'sometimes|numeric|min:1|max:100',
                'search' => 'sometimes|string|max:255',
            ]);

            $lat = $request->input('latitude');
            $lng = $request->input('longitude');
            $radius = $request->input('radius_km', 10);
            $search = $request->input('search');

            $query = Pharmacy::selectRaw('*, (6371 * acos(cos(radians(?)) * cos(radians(latitude)) * cos(radians(longitude) - radians(?)) + sin(radians(?)) * sin(radians(latitude)))) AS distance', [$lat, $lng, $lat])
                ->whereNotNull('latitude')
                ->whereNotNull('longitude')
                ->where('status', 'active')
                ->where('is_published', true);

            if ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('pharmacy_name', 'like', "%{$search}%")
                      ->orWhere('district', 'like', "%{$search}%")
                      ->orWhere('region', 'like', "%{$search}%")
                      ->orWhere('ward', 'like', "%{$search}%");
                });
            }

            $pharmacies = $query->having('distance', '<=', $radius)
                ->orderBy('distance')
                ->get();

            return response()->json([
                'message' => 'Nearby pharmacies retrieved.',
                'data' => $pharmacies,
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed.',
                'error' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to retrieve nearby pharmacies.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function pharmacyDetail(Request $request, string $id): JsonResponse
    {
        try {
            $pharmacy = Pharmacy::where('status', 'active')
                ->where('is_published', true)
                ->findOrFail($id);

            $drugCount = Drug::where('pharmacy_id', $pharmacy->id)
                ->where('is_published', true)
                ->count();

            return response()->json([
                'message' => 'Pharmacy details retrieved.',
                'data' => [
                    'pharmacy' => $pharmacy,
                    'drug_count' => $drugCount,
                ],
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json([
                'message' => 'Pharmacy not found.',
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to retrieve pharmacy.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function pharmacyDrugs(Request $request, string $id): JsonResponse
    {
        try {
            $pharmacy = Pharmacy::where('status', 'active')
                ->where('is_published', true)
                ->findOrFail($id);

            $query = Drug::where('pharmacy_id', $pharmacy->id)
                ->where('is_published', true)
                ->with('category');

            if ($request->has('search')) {
                $search = $request->input('search');
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('generic_name', 'like', "%{$search}%")
                      ->orWhere('manufacturer', 'like', "%{$search}%");
                });
            }

            if ($request->has('category_id')) {
                $query->where('category_id', $request->input('category_id'));
            }

            $drugs = $query->orderBy('name')
                ->paginate($request->input('per_page', 20));

            return response()->json([
                'message' => 'Pharmacy drugs retrieved.',
                'data' => $drugs,
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json([
                'message' => 'Pharmacy not found.',
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to retrieve drugs.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function pharmacyCategories(Request $request, string $id): JsonResponse
    {
        try {
            $pharmacy = Pharmacy::where('status', 'active')
                ->where('is_published', true)
                ->findOrFail($id);

            $categories = DrugCategory::where('pharmacy_id', $pharmacy->id)
                ->withCount(['drugs' => function ($q) {
                    $q->where('is_published', true);
                }])
                ->get();

            return response()->json([
                'message' => 'Pharmacy categories retrieved.',
                'data' => $categories,
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json([
                'message' => 'Pharmacy not found.',
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to retrieve categories.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function placeOrder(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'pharmacy_id' => 'required|exists:pharmacies,id',
                'items' => 'required|array|min:1',
                'items.*.drug_id' => 'required|exists:drugs,id',
                'items.*.quantity' => 'required|integer|min:1',
                'notes' => 'sometimes|nullable|string|max:1000',
                'delivery_address' => 'required|string|max:500',
                'delivery_phone' => 'sometimes|nullable|string|max:20',
                'delivery_latitude' => 'sometimes|nullable|numeric|between:-90,90',
                'delivery_longitude' => 'sometimes|nullable|numeric|between:-180,180',
            ]);

            $user = $request->user();

            DB::beginTransaction();

            $pharmacy = Pharmacy::findOrFail($validated['pharmacy_id']);
            $subtotal = 0;
            $orderItems = [];

            $orderCode = 'ORD-' . now()->format('Y') . '-' . strtoupper(Str::random(5));

            foreach ($validated['items'] as $item) {
                $drug = Drug::lockForUpdate()
                    ->where('id', $item['drug_id'])
                    ->where('pharmacy_id', $pharmacy->id)
                    ->where('is_published', true)
                    ->first();

                if (!$drug) {
                    DB::rollBack();
                    return response()->json([
                        'message' => "Drug ID {$item['drug_id']} not found in this pharmacy.",
                    ], 422);
                }

                if ($drug->quantity < $item['quantity']) {
                    DB::rollBack();
                    return response()->json([
                        'message' => "Insufficient stock for '{$drug->name}'. Available: {$drug->quantity}.",
                    ], 422);
                }

                $totalPrice = $drug->selling_price * $item['quantity'];
                $subtotal += $totalPrice;

                $orderItems[] = [
                    'drug_id' => $drug->id,
                    'quantity' => $item['quantity'],
                    'unit_price' => $drug->selling_price,
                    'total_price' => $totalPrice,
                ];

                $drug->decrement('quantity', $item['quantity']);

                DrugMovement::create([
                    'pharmacy_id' => $pharmacy->id,
                    'drug_id' => $drug->id,
                    'movement_type' => 'sale',
                    'quantity' => -$item['quantity'],
                    'unit_cost' => $drug->buying_price,
                    'reference_number' => $orderCode,
                    'performed_by' => $user->id,
                ]);
            }

            $order = Order::create([
                'pharmacy_id' => $pharmacy->id,
                'user_id' => $user->id,
                'order_code' => $orderCode,
                'order_type' => 'online',
                'subtotal' => $subtotal,
                'discount' => 0,
                'tax' => 0,
                'total' => $subtotal,
                'payment_method' => 'cash',
                'payment_status' => 'unpaid',
                'order_status' => 'pending',
                'notes' => $validated['notes'] ?? null,
                'delivery_address' => $validated['delivery_address'],
                'delivery_phone' => $validated['delivery_phone'] ?? $user->phone,
                'delivery_latitude' => $validated['delivery_latitude'] ?? null,
                'delivery_longitude' => $validated['delivery_longitude'] ?? null,
                'processed_by' => $pharmacy->owner_id,
            ]);

            foreach ($orderItems as $oi) {
                OrderItem::create(array_merge($oi, ['order_id' => $order->id]));
            }

            Notification::create([
                'pharmacy_id' => $pharmacy->id,
                'user_id' => $pharmacy->owner_id,
                'title' => 'New Online Order',
                'message' => "Order #{$orderCode} received from {$user->name} (deliver to: {$validated['delivery_address']}). Total: " . number_format($subtotal, 2) . " TZS",
                'type' => 'info',
                'is_read' => false,
                'link' => "/dashboard/orders/{$order->id}",
            ]);

            $order->load('items.drug', 'pharmacy', 'user');

            DB::commit();

            return response()->json([
                'message' => 'Order placed successfully.',
                'data' => $order,
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Validation failed.',
                'error' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to place order.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function myOrders(Request $request): JsonResponse
    {
        try {
            $orders = Order::where('user_id', $request->user()->id)
                ->with('pharmacy')
                ->orderByDesc('created_at')
                ->paginate($request->input('per_page', 15));

            return response()->json([
                'message' => 'Orders retrieved.',
                'data' => $orders,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to retrieve orders.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function cancelOrder(Request $request, string $id): JsonResponse
    {
        try {
            $order = Order::where('id', $id)
                ->where('user_id', $request->user()->id)
                ->with('items.drug')
                ->firstOrFail();

            if ($order->order_status !== 'pending') {
                return response()->json([
                    'message' => 'This order can no longer be cancelled. It is already being processed.',
                ], 422);
            }

            DB::beginTransaction();

            foreach ($order->items as $item) {
                if (!$item->drug) {
                    continue;
                }
                $item->drug->increment('quantity', $item->quantity);

                DrugMovement::create([
                    'pharmacy_id' => $order->pharmacy_id,
                    'drug_id' => $item->drug_id,
                    'movement_type' => 'return',
                    'quantity' => $item->quantity,
                    'unit_cost' => $item->drug->buying_price,
                    'reference_number' => $order->order_code,
                    'performed_by' => $request->user()->id,
                ]);
            }

            $order->update(['order_status' => 'cancelled']);

            Notification::create([
                'pharmacy_id' => $order->pharmacy_id,
                'user_id' => $order->pharmacy->owner_id,
                'title' => 'Order Cancelled',
                'message' => "Order #{$order->order_code} was cancelled by the customer. Stock has been restored.",
                'type' => 'warning',
                'is_read' => false,
                'link' => "/dashboard/orders/{$order->id}",
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Order cancelled successfully.',
                'data' => $order->fresh(['items.drug', 'pharmacy']),
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json([
                'message' => 'Order not found.',
            ], 404);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Failed to cancel order.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function orderDetail(Request $request, string $id): JsonResponse
    {
        try {
            $order = Order::where('id', $id)
                ->where('user_id', $request->user()->id)
                ->with('items.drug', 'pharmacy')
                ->firstOrFail();

            return response()->json([
                'message' => 'Order details retrieved.',
                'data' => $order,
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json([
                'message' => 'Order not found.',
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to retrieve order.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function uploadPrescription(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'pharmacy_id' => 'required|exists:pharmacies,id',
                'doctor_name' => 'required|string|max:255',
                'hospital_name' => 'sometimes|nullable|string|max:255',
                'notes' => 'sometimes|nullable|string|max:1000',
                'photo' => 'sometimes|nullable|string|max:500',
            ]);

            $user = $request->user();

            $rxCode = 'RX-' . strtoupper(Str::random(5)) . '-' . time();

            $prescription = Prescription::create([
                'pharmacy_id' => $validated['pharmacy_id'],
                'user_id' => $user->id,
                'prescription_code' => $rxCode,
                'doctor_name' => $validated['doctor_name'],
                'hospital_name' => $validated['hospital_name'] ?? null,
                'notes' => $validated['notes'] ?? null,
                'photo' => $validated['photo'] ?? null,
                'status' => 'pending',
            ]);

            $prescription->load('pharmacy');

            return response()->json([
                'message' => 'Prescription uploaded successfully.',
                'data' => $prescription,
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed.',
                'error' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to upload prescription.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function myPrescriptions(Request $request): JsonResponse
    {
        try {
            $prescriptions = Prescription::where('user_id', $request->user()->id)
                ->with('pharmacy')
                ->orderByDesc('created_at')
                ->paginate($request->input('per_page', 15));

            return response()->json([
                'message' => 'Prescriptions retrieved.',
                'data' => $prescriptions,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to retrieve prescriptions.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function myNotifications(Request $request): JsonResponse
    {
        try {
            $notifications = Notification::where('user_id', $request->user()->id)
                ->orderByDesc('created_at')
                ->paginate($request->input('per_page', 20));

            return response()->json([
                'message' => 'Notifications retrieved.',
                'data' => $notifications,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to retrieve notifications.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function markNotificationRead(Request $request, string $id): JsonResponse
    {
        try {
            Notification::where('id', $id)
                ->where('user_id', $request->user()->id)
                ->update(['is_read' => true]);

            return response()->json([
                'message' => 'Notification marked as read.',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function markAllNotificationsRead(Request $request): JsonResponse
    {
        try {
            Notification::where('user_id', $request->user()->id)
                ->where('is_read', false)
                ->update(['is_read' => true]);

            return response()->json([
                'message' => 'All notifications marked as read.',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function unreadNotificationCount(Request $request): JsonResponse
    {
        try {
            $count = Notification::where('user_id', $request->user()->id)
                ->where('is_read', false)
                ->count();

            return response()->json([
                'message' => 'Count retrieved.',
                'data' => ['count' => $count],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function mySupportTickets(Request $request): JsonResponse
    {
        try {
            $tickets = SupportTicket::with(['pharmacy:id,pharmacy_name', 'replies.user:id,name,role'])
                ->where('user_id', $request->user()->id)
                ->latest()
                ->paginate($request->input('per_page', 20));

            return response()->json($tickets);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch support tickets.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function createSupportTicket(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'pharmacy_id' => 'nullable|exists:pharmacies,id',
                'subject' => 'required|string|max:255',
                'description' => 'required|string',
                'priority' => 'sometimes|in:low,medium,high,urgent',
                'category' => 'nullable|string|max:100',
            ]);

            $validated['user_id'] = $request->user()->id;
            $validated['priority'] = $validated['priority'] ?? 'medium';
            $validated['status'] = 'open';

            $ticket = SupportTicket::create($validated);

            return response()->json([
                'message' => 'Support ticket submitted. We will get back to you.',
                'data' => $ticket->load('pharmacy'),
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to create support ticket.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function replySupportTicket(Request $request, string $id): JsonResponse
    {
        try {
            $ticket = SupportTicket::where('id', $id)
                ->where('user_id', $request->user()->id)
                ->firstOrFail();

            $validated = $request->validate([
                'message' => 'required|string',
            ]);

            $reply = TicketReply::create([
                'ticket_id' => $ticket->id,
                'user_id' => $request->user()->id,
                'message' => $validated['message'],
            ]);

            if ($ticket->status === 'closed') {
                $ticket->update(['status' => 'open']);
            }

            return response()->json([
                'message' => 'Reply added.',
                'data' => $reply->load('user'),
            ], 201);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Ticket not found.'], 404);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to add reply.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }
}
