<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class UploadController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'file' => 'required|file|max:5120|mimes:jpg,jpeg,png,gif,webp,pdf',
                'folder' => 'sometimes|string|max:100',
            ]);

            $folder = $validated['folder'] ?? 'uploads';
            $file = $validated['file'];
            $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();
            $path = $file->storeAs($folder, $filename, 'public');

            return response()->json([
                'message' => 'File uploaded successfully.',
                'data' => [
                    'url' => Storage::disk('public')->url($path),
                    'path' => $path,
                    'filename' => $filename,
                ],
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed.',
                'error' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Upload failed.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
