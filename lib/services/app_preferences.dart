import 'dart:convert';
import 'dart:ui';

import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'api_service.dart';

class AppPreferences extends ChangeNotifier {
  static const String _langKey = 'helix_app_language';
  static const String _notifKey = 'helix_notification_preferences';

  static const List<String> supportedLanguageCodes = ['en', 'sw'];

  static const Map<String, bool> defaultNotificationPrefs = {
    'push_enabled': true,
    'order_updates': true,
    'offers_promotions': true,
    'health_tips': true,
  };

  String _languageCode = 'en';
  Map<String, bool> _notificationPrefs = {...defaultNotificationPrefs};

  String get languageCode => _languageCode;

  Locale get locale => Locale(_languageCode);

  Map<String, bool> get notificationPrefs => Map.unmodifiable(_notificationPrefs);

  Future<void> init() async {
    await ApiService.loadSession();

    final prefs = await SharedPreferences.getInstance();

    final savedLang = prefs.getString(_langKey);
    if (savedLang != null && supportedLanguageCodes.contains(savedLang)) {
      _languageCode = savedLang;
    } else if (ApiService.isLoggedIn) {
      _languageCode = _validLanguageCode(ApiService.cachedUser?['language']);
    }

    final savedNotif = prefs.getString(_notifKey);
    if (savedNotif != null) {
      _notificationPrefs = _loadNotifPrefs(savedNotif);
    } else if (ApiService.isLoggedIn) {
      final serverPrefs = ApiService.cachedUser?['notification_preferences'];
      if (serverPrefs is Map) {
        _notificationPrefs = {...defaultNotificationPrefs}
          ..addAll(Map<String, bool>.from(serverPrefs.map(
            (k, v) => MapEntry(k.toString(), v == true),
          )));
      }
    }

    notifyListeners();
  }

  Future<bool> setLanguage(String code) async {
    if (!supportedLanguageCodes.contains(code) || _languageCode == code) {
      return true;
    }
    _languageCode = code;
    notifyListeners();

    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_langKey, code);

    if (!ApiService.isLoggedIn) return true;
    return _sync({'language': code});
  }

  Future<bool> setNotificationPref(String key, bool value) async {
    final current = _notificationPrefs[key];
    if (current == value) return true;

    _notificationPrefs = {..._notificationPrefs, key: value};
    notifyListeners();

    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_notifKey, jsonEncode(_notificationPrefs));

    if (!ApiService.isLoggedIn) return true;
    return _sync({'notification_preferences': {..._notificationPrefs}});
  }

  Future<bool> _sync(Map<String, dynamic> body) async {
    try {
      final res = await ApiService.put('/me', body);
      final data = res is Map ? res['data'] : null;
      if (data is Map<String, dynamic>) {
        await ApiService.updateCachedUser(data);
      }
      return true;
    } catch (_) {
      return false;
    }
  }

  static String _validLanguageCode(dynamic value) {
    final lang = value?.toString().trim().toLowerCase() ?? '';
    return supportedLanguageCodes.contains(lang) ? lang : 'en';
  }

  static Map<String, bool> _loadNotifPrefs(String raw) {
    try {
      final decoded = jsonDecode(raw);
      if (decoded is Map) {
        return {...defaultNotificationPrefs}
          ..addAll(Map<String, bool>.from(decoded.map(
            (k, v) => MapEntry(k.toString(), v == true),
          )));
      }
    } catch (_) {}
    return {...defaultNotificationPrefs};
  }
}