<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Pharmacy;
use App\Models\EPrescription;
use App\Models\EPrescriptionItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class EPrescriptionController extends Controller
{
    /**
     * E-Prescription API Documentation
     * 
     * This API enables:
     * - MoH Health systems to submit e-prescriptions
     * - Pharmacies to retrieve and fulfill prescriptions
     * - Patients to access prescriptions across any pharmacy
     * - Delivery partners to track prescriptions
     * - Wholesalers to process orders from retail pharmacies
     */

    /**
     * Submit e-prescription from MoH/Healthcare system
     * 
     * POST /api/eprescriptions/submit
     * 
     * Required headers:
     *   Authorization: Bearer {api_key}
     *   Content-Type: application/json
     * 
     * Request body:
     * {
     *   "patient": {
     *     "id": "MZ12345",          // MoH Patient ID
     *     "name": "John Doe",
     *     "phone": "+255712345678",
     *     "email": "john@example.com",
     *     "date_of_birth": "1990-05-15",
     *     "national_id": "123456789"
     *   },
     *   "healthcare_facility": {
     *     "name": "Muhimbili Hospital",
     *     "moh_code": "HC001"
     *   },
     *   "prescriber": {
     *     "name": "Dr. Jane Smith",
     *     "license_number": "DOC12345",
     *     "specialty": "General Practitioner"
     *   },
     *   "prescription_items": [
     *     {
     *       "drug_name": "Amoxicillin",
     *       "dosage": "500mg",
     *       "quantity": 30,
     *       "frequency": "3 times daily",
     *       "duration_days": 7,
     *       "instructions": "With or without food"
     *     }
     *   ],
     *   "notes": "Patient allergic to Penicillin derivatives - use with caution",
     *   "valid_until": "2026-12-05"
     * }
     * 
     * Response:
     * {
     *   "success": true,
     *   "prescription_id": "RX-20261105-001",
     *   "patient_id": "MZ12345",
     *   "status": "pending",
     *   "created_at": "2026-11-05T10:30:00Z",
     *   "valid_until": "2026-12-05T23:59:59Z",
     *   "qr_code": "https://helix.co.tz/prescription/RX-20261105-001"
     * }
     */
    public function submitPrescription(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'patient.id' => 'required|string|max:50',
                'patient.name' => 'required|string|max:255',
                'patient.phone' => 'required|string|max:20',
                'patient.email' => 'nullable|email',
                'patient.date_of_birth' => 'required|date',
                'patient.national_id' => 'required|string|max:50',
                'healthcare_facility.name' => 'required|string|max:255',
                'healthcare_facility.moh_code' => 'required|string|max:50',
                'prescriber.name' => 'required|string|max:255',
                'prescriber.license_number' => 'required|string|max:100',
                'prescriber.specialty' => 'required|string|max:100',
                'prescription_items' => 'required|array|min:1',
                'prescription_items.*.drug_name' => 'required|string|max:255',
                'prescription_items.*.dosage' => 'required|string|max:100',
                'prescription_items.*.quantity' => 'required|integer|min:1',
                'prescription_items.*.frequency' => 'required|string|max:255',
                'prescription_items.*.duration_days' => 'required|integer|min:1',
                'valid_until' => 'required|date|after:today',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors(),
                ], 422);
            }

            $prescriptionId = 'RX-' . date('Ymd') . '-' . str_pad(
                EPrescription::whereDate('created_at', today())->count() + 1,
                6,
                '0',
                STR_PAD_LEFT
            );

            $prescription = EPrescription::create([
                'prescription_id' => $prescriptionId,
                'patient_id' => $request->input('patient.id'),
                'patient_name' => $request->input('patient.name'),
                'patient_phone' => $request->input('patient.phone'),
                'patient_email' => $request->input('patient.email'),
                'patient_dob' => $request->input('patient.date_of_birth'),
                'patient_national_id' => $request->input('patient.national_id'),
                'healthcare_facility' => $request->input('healthcare_facility.name'),
                'moh_facility_code' => $request->input('healthcare_facility.moh_code'),
                'prescriber_name' => $request->input('prescriber.name'),
                'prescriber_license' => $request->input('prescriber.license_number'),
                'prescriber_specialty' => $request->input('prescriber.specialty'),
                'notes' => $request->input('notes'),
                'valid_until' => $request->input('valid_until'),
                'status' => 'pending',
                'qr_code' => route('prescription.view', $prescriptionId),
            ]);

            // Create prescription items
            foreach ($request->input('prescription_items') as $item) {
                EPrescriptionItem::create([
                    'eprescription_id' => $prescription->id,
                    'drug_name' => $item['drug_name'],
                    'dosage' => $item['dosage'],
                    'quantity' => $item['quantity'],
                    'frequency' => $item['frequency'],
                    'duration_days' => $item['duration_days'],
                    'instructions' => $item['instructions'] ?? null,
                ]);
            }

            Log::info("E-prescription created: $prescriptionId for patient: {$request->input('patient.id')}");

            return response()->json([
                'success' => true,
                'prescription_id' => $prescriptionId,
                'patient_id' => $request->input('patient.id'),
                'status' => 'pending',
                'created_at' => $prescription->created_at->toIso8601String(),
                'valid_until' => $prescription->valid_until,
                'qr_code' => $prescription->qr_code,
            ], 201);

        } catch (\Exception $e) {
            Log::error("E-prescription submission error: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Failed to submit prescription',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get prescription for patient (by patient ID or prescription ID)
     * 
     * GET /api/eprescriptions/{prescription_id}?patient_id=MZ12345
     * 
     * Response:
     * {
     *   "success": true,
     *   "prescription": {
     *     "id": "RX-20261105-001",
     *     "patient": { ... },
     *     "prescriber": { ... },
     *     "items": [ ... ],
     *     "status": "pending|fulfilled|expired|cancelled",
     *     "created_at": "2026-11-05T10:30:00Z",
     *     "valid_until": "2026-12-05T23:59:59Z"
     *   }
     * }
     */
    public function getPrescription($prescriptionId, Request $request): JsonResponse
    {
        try {
            $prescription = EPrescription::where('prescription_id', $prescriptionId)
                ->first();

            if (!$prescription) {
                return response()->json([
                    'success' => false,
                    'error' => 'Prescription not found',
                ], 404);
            }

            // Verify patient access
            if ($request->has('patient_id') && $request->input('patient_id') !== $prescription->patient_id) {
                return response()->json([
                    'success' => false,
                    'error' => 'Unauthorized access',
                ], 403);
            }

            $items = $prescription->items()->get(['drug_name', 'dosage', 'quantity', 'frequency', 'duration_days', 'instructions']);

            return response()->json([
                'success' => true,
                'prescription' => [
                    'id' => $prescription->prescription_id,
                    'patient' => [
                        'id' => $prescription->patient_id,
                        'name' => $prescription->patient_name,
                        'phone' => $prescription->patient_phone,
                        'email' => $prescription->patient_email,
                        'dob' => $prescription->patient_dob,
                        'national_id' => $prescription->patient_national_id,
                    ],
                    'healthcare_facility' => $prescription->healthcare_facility,
                    'moh_code' => $prescription->moh_facility_code,
                    'prescriber' => [
                        'name' => $prescription->prescriber_name,
                        'license' => $prescription->prescriber_license,
                        'specialty' => $prescription->prescriber_specialty,
                    ],
                    'items' => $items,
                    'notes' => $prescription->notes,
                    'status' => $prescription->status,
                    'created_at' => $prescription->created_at->toIso8601String(),
                    'valid_until' => $prescription->valid_until,
                    'fulfilled_at' => $prescription->fulfilled_at,
                ],
            ]);

        } catch (\Exception $e) {
            Log::error("Get prescription error: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Failed to retrieve prescription',
            ], 500);
        }
    }

    /**
     * Pharmacy fulfills prescription (dispense drugs)
     * 
     * POST /api/eprescriptions/{prescription_id}/fulfill
     * 
     * Request body:
     * {
     *   "pharmacy_id": "PHARM001",
     *   "fulfilled_items": [
     *     {
     *       "drug_name": "Amoxicillin",
     *       "quantity_dispensed": 30,
     *       "batch_number": "BATCH123",
     *       "expiry_date": "2027-06-30"
     *     }
     *   ],
     *   "notes": "Patient advised on medication usage"
     * }
     */
    public function fulfillPrescription($prescriptionId, Request $request): JsonResponse
    {
        try {
            $prescription = EPrescription::where('prescription_id', $prescriptionId)->first();

            if (!$prescription) {
                return response()->json(['success' => false, 'error' => 'Prescription not found'], 404);
            }

            if ($prescription->status !== 'pending') {
                return response()->json([
                    'success' => false,
                    'error' => 'Prescription already fulfilled or expired',
                ], 422);
            }

            if (now() > $prescription->valid_until) {
                $prescription->update(['status' => 'expired']);
                return response()->json([
                    'success' => false,
                    'error' => 'Prescription has expired',
                ], 422);
            }

            $prescription->update([
                'status' => 'fulfilled',
                'fulfilled_at' => now(),
                'fulfilled_by_pharmacy' => $request->input('pharmacy_id'),
                'fulfillment_notes' => $request->input('notes'),
            ]);

            Log::info("Prescription $prescriptionId fulfilled by pharmacy: " . $request->input('pharmacy_id'));

            return response()->json([
                'success' => true,
                'message' => 'Prescription fulfilled successfully',
                'prescription_id' => $prescriptionId,
                'status' => 'fulfilled',
                'fulfilled_at' => $prescription->fulfilled_at->toIso8601String(),
            ]);

        } catch (\Exception $e) {
            Log::error("Fulfill prescription error: " . $e->getMessage());
            return response()->json(['success' => false, 'error' => 'Failed to fulfill prescription'], 500);
        }
    }

    /**
     * Create wholesale order from retail pharmacy (via e-prescription)
     * 
     * POST /api/eprescriptions/{prescription_id}/wholesale-order
     * 
     * Request body:
     * {
     *   "pharmacy_id": "PHARM001",
     *   "wholesaler_id": "WHOLE001",
     *   "items": [
     *     {
     *       "drug_id": 1,
     *       "quantity": 100,
     *       "unit_price": 50.00
     *     }
     *   ],
     *   "delivery_address": "Clinic Address, Dar es Salaam",
     *   "payment_method": "bank_transfer"
     * }
     */
    public function createWholesaleOrder($prescriptionId, Request $request): JsonResponse
    {
        try {
            $prescription = EPrescription::where('prescription_id', $prescriptionId)->first();

            if (!$prescription) {
                return response()->json(['success' => false, 'error' => 'Prescription not found'], 404);
            }

            // Create order record
            $orderId = 'WO-' . date('Ymd') . '-' . Str::random(6);

            $orderData = [
                'order_id' => $orderId,
                'eprescription_id' => $prescription->id,
                'pharmacy_id' => $request->input('pharmacy_id'),
                'wholesaler_id' => $request->input('wholesaler_id'),
                'items' => json_encode($request->input('items')),
                'delivery_address' => $request->input('delivery_address'),
                'payment_method' => $request->input('payment_method'),
                'status' => 'pending',
                'total_amount' => collect($request->input('items'))
                    ->sum(fn($item) => $item['quantity'] * $item['unit_price']),
            ];

            // Store order (implement in your Orders model)
            DB::table('wholesale_orders')->insert($orderData);

            Log::info("Wholesale order created: $orderId for prescription: $prescriptionId");

            return response()->json([
                'success' => true,
                'order_id' => $orderId,
                'prescription_id' => $prescriptionId,
                'status' => 'pending',
                'total_amount' => $orderData['total_amount'],
            ], 201);

        } catch (\Exception $e) {
            Log::error("Wholesale order creation error: " . $e->getMessage());
            return response()->json(['success' => false, 'error' => 'Failed to create order'], 500);
        }
    }

    /**
     * Delivery tracking
     * 
     * GET /api/eprescriptions/{prescription_id}/delivery-status
     */
    public function getDeliveryStatus($prescriptionId): JsonResponse
    {
        try {
            $prescription = EPrescription::where('prescription_id', $prescriptionId)
                ->with('deliveryTracking')
                ->first();

            if (!$prescription) {
                return response()->json(['success' => false, 'error' => 'Prescription not found'], 404);
            }

            return response()->json([
                'success' => true,
                'prescription_id' => $prescriptionId,
                'delivery_status' => $prescription->deliveryTracking->status ?? 'pending',
                'tracking_details' => $prescription->deliveryTracking,
            ]);

        } catch (\Exception $e) {
            return response()->json(['success' => false, 'error' => 'Failed to get delivery status'], 500);
        }
    }

    /**
     * Validate API key and get system info
     * 
     * POST /api/eprescriptions/validate-key
     * 
     * Request body:
     * {
     *   "api_key": "your_api_key",
     *   "system_name": "MoH Health System"
     * }
     */
    public function validateApiKey(Request $request): JsonResponse
    {
        $apiKey = $request->input('api_key');
        
        // Verify API key against database
        $integration = DB::table('api_integrations')
            ->where('api_key', hash('sha256', $apiKey))
            ->where('status', 'active')
            ->first();

        if (!$integration) {
            return response()->json([
                'success' => false,
                'error' => 'Invalid or inactive API key',
            ], 401);
        }

        return response()->json([
            'success' => true,
            'message' => 'API key is valid',
            'integration_name' => $integration->name,
            'system_type' => $integration->system_type, // laravel, nodejs, spring
            'rate_limit' => $integration->rate_limit ?? '1000/hour',
            'endpoints' => [
                'submit_prescription' => '/api/eprescriptions/submit',
                'get_prescription' => '/api/eprescriptions/{id}',
                'fulfill_prescription' => '/api/eprescriptions/{id}/fulfill',
                'wholesale_order' => '/api/eprescriptions/{id}/wholesale-order',
                'delivery_status' => '/api/eprescriptions/{id}/delivery-status',
            ],
        ]);
    }
}
