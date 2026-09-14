import 'dart:convert';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Monitors network connectivity and provides a simple JSON cache layer backed
/// by SharedPreferences so the app still shows recent data while offline.
///
/// Writes are best-effort and never throw; callers fall back through to the
/// network and store whatever they fetched for the next offline session.
class OfflineService {
  OfflineService._();

  static final OfflineService instance = OfflineService._();

  /// Exposes whether the device currently has any usable connection.
  static final ValueNotifier<bool> isOffline = ValueNotifier<bool>(false);

  static final List<VoidCallback> _cacheListeners = [];

  static const String _cachePrefix = 'offline_cache_v1:';

  static void init() {
    Connectivity().onConnectivityChanged.listen((results) {
      final any = results.any((r) => r != ConnectivityResult.none);
      isOffline.value = !any;
      if (any) {
        _notifyOnline();
      }
    });
    // Seed the current state once.
    Connectivity().checkConnectivity().then((results) {
      final any = results.any((r) => r != ConnectivityResult.none);
      isOffline.value = !any;
    }).catchError((_) {});
  }

  static void addListener(VoidCallback cb) {
    _cacheListeners.add(cb);
  }

  static void _notifyOnline() {
    for (final cb in List.of(_cacheListeners)) {
      try { cb(); } catch (_) {}
    }
  }

  // ------------------------------------------------------------------
  // Cache API (Simple JSON cache by key)
  // ------------------------------------------------------------------

  static Future<void> cacheSet(String key, dynamic value) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('$_cachePrefix$key', jsonEncode(value));
    } catch (_) {
      // Cache is best-effort; never crash the caller.
    }
  }

  static Future<dynamic> cacheGet(String key) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final raw = prefs.getString('$_cachePrefix$key');
      if (raw == null) return null;
      return jsonDecode(raw);
    } catch (_) {
      return null;
    }
  }

  static Future<void> cacheRemove(String key) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('$_cachePrefix$key');
    } catch (_) {}
  }

  /// Stores a network response (the decoded `data` value) under a cache key.
  static Future<void> remember(String key, dynamic data) => cacheSet(key, data);

  /// Returns cached data or an empty list. Used as an offline fallback for
  /// list endpoints that always respond with a JSON list.
  static Future<List<dynamic>> cachedListOrEmpty(String key) async {
    final cached = await cacheGet(key);
    if (cached is List) return cached;
    if (cached is Map && cached['data'] is List) return cached['data'];
    return [];
  }
}