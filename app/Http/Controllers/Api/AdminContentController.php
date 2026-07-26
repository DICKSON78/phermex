<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ContentPost;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminContentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        try {
            $query = ContentPost::with('creator');

            if ($request->filled('type')) {
                $query->where('type', $request->input('type'));
            }

            if ($request->filled('status')) {
                $query->where('status', $request->input('status'));
            }

            if ($request->filled('search')) {
                $search = $request->input('search');
                $query->where(function ($q) use ($search) {
                    $q->where('title', 'like', "%{$search}%")
                        ->orWhere('content', 'like', "%{$search}%");
                });
            }

            $content = $query->latest()->paginate($request->input('per_page', 20));

            return response()->json($content);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch content.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'title' => 'required|string|max:255',
                'type' => 'required|in:banner,announcement,promotion,blog',
                'content' => 'required|string',
                'image_url' => 'nullable|string|max:500',
                'status' => 'sometimes|in:active,draft,archived',
                'starts_at' => 'nullable|date',
                'ends_at' => 'nullable|date|after_or_equal:starts_at',
                'metadata' => 'nullable|array',
            ]);

            $validated['created_by'] = $request->user()->id;
            $validated['status'] = $validated['status'] ?? 'draft';

            $post = ContentPost::create($validated);

            return response()->json([
                'message' => 'Content created successfully.',
                'data' => $post->load('creator'),
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to create content.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function show($id): JsonResponse
    {
        try {
            $post = ContentPost::with('creator')->findOrFail($id);

            return response()->json(['data' => $post]);
        } catch (\Illuminate\Database\ModelNotFoundException) {
            return response()->json(['message' => 'Content not found.'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch content.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function update(Request $request, $id): JsonResponse
    {
        try {
            $post = ContentPost::findOrFail($id);

            $validated = $request->validate([
                'title' => 'sometimes|string|max:255',
                'type' => 'sometimes|in:banner,announcement,promotion,blog',
                'content' => 'sometimes|string',
                'image_url' => 'nullable|string|max:500',
                'status' => 'sometimes|in:active,draft,archived',
                'starts_at' => 'nullable|date',
                'ends_at' => 'nullable|date|after_or_equal:starts_at',
                'metadata' => 'nullable|array',
            ]);

            $post->update($validated);

            return response()->json([
                'message' => 'Content updated successfully.',
                'data' => $post->fresh()->load('creator'),
            ]);
        } catch (\Illuminate\Database\ModelNotFoundException) {
            return response()->json(['message' => 'Content not found.'], 404);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to update content.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function destroy($id): JsonResponse
    {
        try {
            $post = ContentPost::findOrFail($id);
            $post->delete();

            return response()->json(['message' => 'Content deleted successfully.']);
        } catch (\Illuminate\Database\ModelNotFoundException) {
            return response()->json(['message' => 'Content not found.'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to delete content.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function toggleStatus(Request $request, $id): JsonResponse
    {
        try {
            $post = ContentPost::findOrFail($id);
            $newStatus = $post->status === 'active' ? 'draft' : 'active';
            $post->update(['status' => $newStatus]);

            return response()->json([
                'message' => "Content status changed to {$newStatus}.",
                'data' => $post->fresh(),
            ]);
        } catch (\Illuminate\Database\ModelNotFoundException) {
            return response()->json(['message' => 'Content not found.'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to toggle content status.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function duplicate(Request $request, $id): JsonResponse
    {
        try {
            $original = ContentPost::findOrFail($id);

            $duplicate = ContentPost::create([
                'title' => $original->title . ' (Copy)',
                'type' => $original->type,
                'content' => $original->content,
                'image_url' => $original->image_url,
                'status' => 'draft',
                'starts_at' => $original->starts_at,
                'ends_at' => $original->ends_at,
                'metadata' => $original->metadata,
                'created_by' => $request->user()->id,
            ]);

            return response()->json([
                'message' => 'Content duplicated successfully.',
                'data' => $duplicate->load('creator'),
            ], 201);
        } catch (\Illuminate\Database\ModelNotFoundException) {
            return response()->json(['message' => 'Content not found.'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to duplicate content.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
