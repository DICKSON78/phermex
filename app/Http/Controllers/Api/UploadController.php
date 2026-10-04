<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class UploadController extends Controller
{
    private const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'mp4', 'webm', 'mov'];

    private const MIME_TO_EXTENSION = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/gif' => 'gif',
        'image/webp' => 'webp',
        'application/pdf' => 'pdf',
        'video/mp4' => 'mp4',
        'video/webm' => 'webm',
        'video/quicktime' => 'mov',
    ];

    private const VIDEO_EXTENSIONS = ['mp4', 'webm', 'mov'];

    /** Videos get a larger ceiling than documents and images. */
    private const VIDEO_MAX_KB = 51200;

    private function maxKbFor(string $extension): int
    {
        return in_array($extension, self::VIDEO_EXTENSIONS, true) ? self::VIDEO_MAX_KB : 5120;
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'file' => 'required|file|mimes:jpg,jpeg,png,gif,webp,pdf,mp4,webm,mov|max:51200',
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

            $maxKb = self::maxKbFor($detectedExtension);
            if ($file->getSize() > $maxKb * 1024) {
                return response()->json([
                    'message' => 'Validation failed.',
                    'error' => ['file' => ['The file may not be larger than ' . ($maxKb / 1024) . ' MB.']],
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
