<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class UploadController extends Controller
{
    private const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf'];

    private const MIME_TO_EXTENSION = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/gif' => 'gif',
        'image/webp' => 'webp',
        'application/pdf' => 'pdf',
    ];

    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'file' => 'required|file|max:5120|mimes:jpg,jpeg,png,gif,webp,pdf',
                'folder' => 'sometimes|string|max:100',
            ]);

            $folder = $validated['folder'] ?? 'uploads';
            $file = $validated['file'];

            $clientExtension = strtolower($file->getClientOriginalExtension());
            if (!in_array($clientExtension, self::ALLOWED_EXTENSIONS, true)) {
                return response()->json([
                    'message' => 'Validation failed.',
                    'error' => ['file' => ['The file type is not allowed.']],
                ], 422);
            }

            $detectedExtension = self::MIME_TO_EXTENSION[$file->getMimeType()] ?? $clientExtension;
            if (!in_array($detectedExtension, self::ALLOWED_EXTENSIONS, true)) {
                return response()->json([
                    'message' => 'Validation failed.',
                    'error' => ['file' => ['The file type is not allowed.']],
                ], 422);
            }

            $filename = Str::uuid() . '.' . $detectedExtension;
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
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }
}
