import 'dart:convert';

import '../models/models.dart';
import 'api_service.dart';

/// Loads pharmacy reels for the customer-facing reel feed.
///
/// The backend guarantees one reel per pharmacy and only serves reels published
/// within the last [lifetime]. This service mirrors both rules: reels are keyed
/// by pharmacy id so a pharmacy can never occupy more than one slot, and any
/// reel older than the lifetime is dropped. When nothing is live the caller
/// shows an empty state — there are no placeholder reels.
class ReelService {
  static const Duration _cacheTtl = Duration(minutes: 5);

  /// A reel stays in the feed for 24 hours after it was last saved.
  static const Duration lifetime = Duration(hours: 24);

  static List<PharmacyReel>? _cache;
  static DateTime? _cachedAt;

  static void clearCache() {
    _cache = null;
    _cachedAt = null;
  }

  /// Returns one live reel per pharmacy, newest first. Never throws — on any
  /// failure the caller gets an empty list and shows the empty state.
  static Future<List<PharmacyReel>> fetchReels({bool forceRefresh = false}) async {
    final cached = _cache;
    final cachedAt = _cachedAt;
    final fresh = cached != null &&
        cachedAt != null &&
        DateTime.now().difference(cachedAt) < _cacheTtl;

    if (!forceRefresh && fresh) return cached;

    try {
      final response = await ApiService.get('/reels');
      final decoded = response is String ? jsonDecode(response) : response;

      final rawList = decoded is Map ? decoded['data'] : decoded;
      if (rawList is! List) return const [];

      final cutoff = DateTime.now().subtract(lifetime);
      final seenPharmacies = <int>{};
      final reels = <PharmacyReel>[];

      for (final item in rawList) {
        if (item is! Map) continue;
        final reel = PharmacyReel.fromJson(Map<String, dynamic>.from(item));
        if (reel.mediaUrl.isEmpty) continue;
        // Expired reels are not shown.
        if (reel.updatedAt != null && reel.updatedAt!.isBefore(cutoff)) continue;
        // First reel wins for a given pharmacy; skip any duplicate.
        if (!seenPharmacies.add(reel.pharmacyId)) continue;
        reels.add(reel);
      }

      _cache = reels;
      _cachedAt = DateTime.now();
      return reels;
    } catch (_) {
      return const [];
    }
  }
}
