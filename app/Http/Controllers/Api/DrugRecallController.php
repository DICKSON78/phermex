<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DrugRecall;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DrugRecallController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        try {
            $query = DrugRecall::with('drug')
                ->where('pharmacy_id', $request->input('pharmacy_id'));

            if ($request->filled('status')) {
                $query->where('status', $request->input('status'));
            }

            if ($request->filled('severity')) {
                $query->where('severity', $request->input('severity'));
            }

            $recalls = $query->latest()->paginate($request->input('per_page', 20));

            return response()->json($recalls);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to fetch recalls.', 'error' => $e->getMessage()], 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'pharmacy_id' => 'required|exists:pharmacies,id',
                'drug_id' => 'required|exists:drugs,id',
                'recall_number' => 'required|string|max:255',
                'recall_reason' => 'required|in:defective,contamination,labeling,efficacy,safety',
                'severity' => 'required|in:class_i,class_ii,class_iii',
                'manufacturer' => 'required|string|max:255',
                'batch_numbers' => 'required|array|min:1',
                'date_issued' => 'required|date',
                'affected_quantity' => 'required|integer|min:1',
                'notes' => 'nullable|string',
            ]);

            $recall = DrugRecall::create([...$validated, 'status' => 'pending']);

            return response()->json(['message' => 'Recall recorded.', 'recall' => $recall->load('drug')], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => 'Validation failed.', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to record recall.', 'error' => $e->getMessage()], 500);
        }
    }

    public function show($id): JsonResponse
    {
        try {
            $recall = DrugRecall::with('drug')->findOrFail($id);
            return response()->json(['recall' => $recall]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Recall not found.'], 404);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to fetch recall.', 'error' => $e->getMessage()], 500);
        }
    }

    public function acknowledge($id): JsonResponse
    {
        try {
            $recall = DrugRecall::findOrFail($id);
            $recall->acknowledge();

            return response()->json(['message' => 'Recall acknowledged.', 'recall' => $recall->fresh()->load('drug')]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Recall not found.'], 404);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to acknowledge recall.', 'error' => $e->getMessage()], 500);
        }
    }

    public function process($id): JsonResponse
    {
        try {
            $recall = DrugRecall::findOrFail($id);
            $recall->process();

            return response()->json(['message' => 'Recall processing started.', 'recall' => $recall->fresh()->load('drug')]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Recall not found.'], 404);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to process recall.', 'error' => $e->getMessage()], 500);
        }
    }

    public function getActive(Request $request): JsonResponse
    {
        try {
            $recalls = DrugRecall::with('drug')
                ->where('pharmacy_id', $request->input('pharmacy_id'))
                ->whereIn('status', ['pending', 'acknowledged', 'in_progress'])
                ->latest()
                ->get();

            return response()->json(['recalls' => $recalls]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to fetch active recalls.', 'error' => $e->getMessage()], 500);
        }
    }
}
