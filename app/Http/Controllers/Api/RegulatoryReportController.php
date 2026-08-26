<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RegulatoryReport;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RegulatoryReportController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        try {
            $query = RegulatoryReport::where('pharmacy_id', $request->input('pharmacy_id'));

            if ($request->filled('report_type')) {
                $query->where('report_type', $request->input('report_type'));
            }

            if ($request->filled('status')) {
                $query->where('status', $request->input('status'));
            }

            $reports = $query->latest()->paginate($request->input('per_page', 20));

            return response()->json($reports);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to fetch reports.', 'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.'], 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'pharmacy_id' => 'required|exists:pharmacies,id',
                'report_type' => 'required|in:monthly_sales,quarterly_tmda,annual_return,control_substance,expiry_report',
                'report_period_month' => 'required|integer|min:1|max:12',
                'report_period_year' => 'required|integer|min:2020|max:2050',
                'notes' => 'nullable|string',
            ]);

            $report = RegulatoryReport::create([...$validated, 'status' => 'draft']);
            $report->generate();

            return response()->json(['message' => 'Report generated.', 'report' => $report], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => 'Validation failed.', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to generate report.', 'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.'], 500);
        }
    }

    public function show($id): JsonResponse
    {
        try {
            $report = RegulatoryReport::findOrFail($id);
            return response()->json(['report' => $report]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Report not found.'], 404);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to fetch report.', 'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.'], 500);
        }
    }

    public function submit(Request $request, $id): JsonResponse
    {
        try {
            $validated = $request->validate([
                'submitted_to' => 'required|string|max:255',
            ]);

            $report = RegulatoryReport::findOrFail($id);
            $report->submit($validated['submitted_to']);

            return response()->json(['message' => 'Report submitted.', 'report' => $report->fresh()]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Report not found.'], 404);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => 'Validation failed.', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to submit report.', 'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.'], 500);
        }
    }

    public function getTemplates(): JsonResponse
    {
        return response()->json(['templates' => RegulatoryReport::getTemplates()]);
    }
}
