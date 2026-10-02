import '../models/models.dart';

/// Process-level cache for the pharmacy list.
///
/// Screens are pushed as new routes, so their widget state (and therefore
/// their "already loaded" flag) is discarded every time the user navigates back
/// and in again. Without this the list re-fetches and shows a spinner on every
/// visit. The cache lets a new screen instance paint the previous result right
/// away and refresh quietly in the background.
class PharmacyCache {
  static String _key = '';
  static List<Pharmacy>? _list;
  static DateTime _storedAt = DateTime.fromMillisecondsSinceEpoch(0);

  /// Identifies the cached list. The search term is part of the key so typing a
  /// new query is never served stale results.
  static String keyFor({String scope = 'nearby', String? search}) =>
      '$scope|${(search ?? '').trim().toLowerCase()}';

  /// True when a fresh-enough copy exists for [key].
  static bool has(String key, {Duration ttl = const Duration(minutes: 5)}) {
    if (_list == null || _key != key) return false;
    return DateTime.now().difference(_storedAt) < ttl;
  }

  static List<Pharmacy>? get cached {
    return _list;
  }

  static void store(String key, List<Pharmacy> list) {
    _key = key;
    _list = list;
    _storedAt = DateTime.now();
  }

  /// Drops the cached list, e.g. when a pull-to-refresh wants a clean read.
  static void clear() {
    _list = null;
    _storedAt = DateTime.fromMillisecondsSinceEpoch(0);
  }
}
