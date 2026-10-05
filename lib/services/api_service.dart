import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../config/api_config.dart';
import '../l10n/app_localizations.dart';
import '../screens/auth/login_screen.dart';

class ApiException implements Exception {
  final String message;
  ApiException(this.message);
  @override
  String toString() => message;
}

class ApiService {
  static const String _tokenKey = 'pharmex_customer_token';
  static const String _userKey = 'pharmex_customer_user';

  // Legacy keys used before the secure-storage migration (plaintext).
  static const String _legacyTokenKey = 'pharmex_customer_token';
  static const String _legacyUserKey = 'pharmex_customer_user';

  static const FlutterSecureStorage _secureStorage = FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
  );

  static String? _token;
  static Map<String, dynamic>? _cachedUser;

  static final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();

  static Future<void> saveSession(String token, Map<String, dynamic> user) async {
    _token = token;
    _cachedUser = user;
    await _storeSession(token, user);
  }

  static Future<void> _storeSession(String token, Map<String, dynamic> user) async {
    await _secureStorage.write(key: _tokenKey, value: token);
    await _secureStorage.write(key: _userKey, value: jsonEncode(user));
    // Best-effort cleanup of legacy plaintext copies.
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_legacyTokenKey);
      await prefs.remove(_legacyUserKey);
    } catch (_) {}
  }

  static Future<void> loadSession() async {
    try {
      _token = await _secureStorage.read(key: _tokenKey);
      final userStr = await _secureStorage.read(key: _userKey);
      if (userStr != null) {
        _cachedUser = jsonDecode(userStr) as Map<String, dynamic>?;
      }
    } catch (_) {}

    // First launch after migration: read any legacy plaintext session and
    // move it into secure storage.
    if (_token == null) {
      try {
        final prefs = await SharedPreferences.getInstance();
        final legacyToken = prefs.getString(_legacyTokenKey);
        final legacyUser = prefs.getString(_legacyUserKey);
        if (legacyToken != null) {
          final user = legacyUser != null
              ? (jsonDecode(legacyUser) as Map<String, dynamic>?)
              : null;
          await _storeSession(legacyToken, user ?? {});
        }
      } catch (_) {}
    }
  }

  static bool get isLoggedIn => _token != null;

  static Map<String, dynamic>? get cachedUser => _cachedUser;

  /// Updates the cached user profile without touching the auth token.
  static Future<void> updateCachedUser(Map<String, dynamic> user) async {
    _cachedUser = user;
    try {
      await _secureStorage.write(key: _userKey, value: jsonEncode(user));
    } catch (_) {}
  }

  static String? get userName => _cachedUser?['name'];

  static String? get userEmail => _cachedUser?['email'];

  static String? get userCustomerId {
    final id = _cachedUser?['id'];
    if (id is String && id.isNotEmpty) return id;
    if (id is num) return id.round().toString();
    return null;
  }

  static Future<void> logout() async {
    _token = null;
    _cachedUser = null;
    try {
      await _secureStorage.delete(key: _tokenKey);
      await _secureStorage.delete(key: _userKey);
    } catch (_) {}
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_legacyTokenKey);
    await prefs.remove(_legacyUserKey);
  }

  static Future<void> clearSession() async {
    _token = null;
    _cachedUser = null;
    try {
      await _secureStorage.delete(key: _tokenKey);
      await _secureStorage.delete(key: _userKey);
    } catch (_) {}
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_legacyTokenKey);
    await prefs.remove(_legacyUserKey);
    navigatorKey.currentState?.pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => const LoginScreen()),
      (route) => false,
    );
  }

  static const Duration _timeout = Duration(seconds: 30);

  static Map<String, String> _headers({bool auth = true}) {
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      if (auth && _token != null) 'Authorization': 'Bearer $_token',
    };
  }

  static Uri _uri(String path) => Uri.parse('${ApiConfig.baseUrl}$path');

  static dynamic _decode(http.Response res) {    if (res.statusCode == 401) {
      clearSession();
      throw ApiException(AppLocalizations.tr('misc.sessionExpired'));
    }
    dynamic body;
    try {
      body = jsonDecode(res.body);
    } catch (_) {
      body = null;
    }
    if (res.statusCode >= 200 && res.statusCode < 300) {
      return body;
    }
    String message =
        '${AppLocalizations.tr('misc.requestFailed')} (${res.statusCode})';
    if (body is Map && body['message'] != null) {
      message = body['message'].toString();
    }
    throw ApiException(message);
  }

  static final Exception _transportTimeout = Exception('Request timed out. Please check your connection.');

  /// Converts a raw transport/network exception (or a server-provided message)
  /// into a customer-safe [ApiException] before it reaches the UI. Server
  /// success/validation messages pass through; TLS/socket/timed-out errors are
  /// replaced with friendly text so customers never see raw internals.
  static Exception _sanitize(Object e) {
    if (e is ApiException) return e;
    final msg = e.toString();
    final lower = msg.toLowerCase();
    final isTransport = lower.contains('handshake') ||
        lower.contains('tls') ||
        lower.contains('certificate') ||
        lower.contains('ssl') ||
        lower.contains('sockethostlookup') ||
        lower.contains('socketexception') ||
        lower.contains('connection refused') ||
        lower.contains('connection closed') ||
        lower.contains('connection reset') ||
        lower.contains('clientexception') ||
        lower.contains('bad state') ||
        lower.contains('timed out') ||
        lower.contains('timeout') ||
        lower.contains('network');
    if (isTransport) {
      return ApiException(friendlyError(e));
    }
    // Unknown/other exceptions: never echo raw internals to the customer.
    return ApiException(AppLocalizations.tr('misc.somethingWrong'));
  }

  static Future<dynamic> get(String path) async {
    try {
      final res = await http
          .get(_uri(path), headers: _headers())
          .timeout(_timeout, onTimeout: () => throw _transportTimeout);
      return _decode(res);
    } catch (e) {
      throw _sanitize(e);
    }
  }

  static Future<dynamic> post(String path, [Map<String, dynamic>? body]) async {
    try {
      final res = await http
          .post(
            _uri(path),
            headers: _headers(),
            body: jsonEncode(body ?? {}),
          )
          .timeout(_timeout, onTimeout: () => throw _transportTimeout);
      return _decode(res);
    } catch (e) {
      throw _sanitize(e);
    }
  }

  static Future<dynamic> put(String path, [Map<String, dynamic>? body]) async {
    try {
      final res = await http
          .put(
            _uri(path),
            headers: _headers(),
            body: jsonEncode(body ?? {}),
          )
          .timeout(_timeout, onTimeout: () => throw _transportTimeout);
      return _decode(res);
    } catch (e) {
      throw _sanitize(e);
    }
  }

  static Future<dynamic> delete(String path) async {
    try {
      final res = await http
          .delete(_uri(path), headers: _headers())
          .timeout(_timeout, onTimeout: () => throw _transportTimeout);
      return _decode(res);
    } catch (e) {
      throw _sanitize(e);
    }
  }

  /// Uploads a local file via multipart/form-data to /upload,
  /// returns the decoded JSON response (contains data.url).
  static Future<dynamic> uploadFile(String filePath, {String folder = 'uploads'}) async {
    try {
      final uri = Uri.parse('${ApiConfig.apiBaseUrl}/upload');
      final req = http.MultipartRequest('POST', uri)
        ..headers['Accept'] = 'application/json'
        ..headers['Authorization'] = _token != null ? 'Bearer $_token' : ''
        ..fields['folder'] = folder
        ..files.add(await http.MultipartFile.fromPath('file', filePath));
      final streamed = await req.send().timeout(_timeout, onTimeout: () => throw _transportTimeout);
      final res = await http.Response.fromStream(streamed);
      return _decode(res);
    } catch (e) {
      throw _sanitize(e);
    }
  }

  static String friendlyError(Object e) {
    // ApiException.toString() returns just the message, so the string checks
    // below could never match it and every real API error collapsed into the
    // generic "something went wrong". Match the type instead: these messages
    // were already made customer-safe by _decode/_sanitize.
    if (e is ApiException) {
      final direct = e.message.trim();
      if (direct.isNotEmpty && !direct.toLowerCase().contains('connection')) {
        return direct;
      }
      return AppLocalizations.tr('misc.somethingWrong');
    }

    final msg = e.toString();
    if (msg.contains('timed out')) return AppLocalizations.tr('misc.timeoutError');
    if (msg.contains('SocketException') ||
        msg.contains('Connection refused') ||
        msg.contains('Connection closed') ||
        msg.contains('Connection reset')) {
      return AppLocalizations.tr('misc.noInternet');
    }
    if (msg.contains('HandshakeException') ||
        msg.contains('TlsException') ||
        msg.contains('certificate') ||
        msg.contains('SSL')) {
      return AppLocalizations.tr('misc.secureConnectionFailed');
    }
    if (msg.contains('ClientException') || msg.contains('Bad state')) {
      return AppLocalizations.tr('misc.noInternet');
    }
    if (msg.contains('500') || msg.contains('503')) return AppLocalizations.tr('misc.serverError');
    if (msg.contains('429')) return AppLocalizations.tr('misc.tooManyAttempts');
    if (msg.contains('422')) return AppLocalizations.tr('misc.invalidData');
    if (msg.contains('401')) return AppLocalizations.tr('misc.sessionExpired');
    if (msg.contains('403')) return AppLocalizations.tr('misc.noPermission');
    if (msg.contains('404')) return AppLocalizations.tr('misc.notFound');
    if (msg.contains('ApiException') || msg.contains('Exception')) {
      // Return the sanitized, trimmed message produced by ApiService (already
      // customer-safe), otherwise a generic fallback.
      final trimmed = msg.replaceAll(RegExp(r'^(ApiException|Exception):?\s*'), '').trim();
      if (trimmed.isNotEmpty && !trimmed.contains('connection')) {
        return trimmed;
      }
    }
    return AppLocalizations.tr('misc.somethingWrong');
  }
}
