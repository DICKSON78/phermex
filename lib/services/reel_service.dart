import 'dart:convert';

import '../models/models.dart';
import 'api_service.dart';

/// Loads pharmacy reels for the customer-facing reel feed.
///
/// The backend guarantees one reel per pharmacy. This service also dedupes by
/// pharmacy id defensively so a pharmacy can never occupy more than one slot in
/// the feed, and caches the result so each reel is not re-shown on every open.
class ReelService {
  static const Duration _cacheTtl = Duration(minutes: 15);

  static List<PharmacyReel>? _cache;
  static DateTime? _cachedAt;

  static void clearCache() {
    _cache = null;
    _cachedAt = null;
  }

  /// Returns one reel per pharmacy, newest first. Never throws — on any failure
  /// the caller falls back to its placeholder content.
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
      if (rawList is! List) return cached ?? const [];

      final seenPharmacies = <int>{};
      final reels = <PharmacyReel>[];

      for (final item in rawList) {
        if (item is! Map) continue;
        final reel = PharmacyReel.fromJson(Map<String, dynamic>.from(item));
        if (reel.mediaUrl.isEmpty) continue;
        // First reel wins for a given pharmacy; skip any duplicate.
        if (!seenPharmacies.add(reel.pharmacyId)) continue;
        reels.add(reel);
      }

      _cache = reels;
      _cachedAt = DateTime.now();
      return reels;
    } catch (_) {
      return cached ?? const [];
    }
  }
}
