import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../config/api_config.dart';

class ApiException implements Exception {
  final String message;
  ApiException(this.message);
  @override
  String toString() => message;
}

class ApiService {
  static const String _tokenKey = 'pharmex_customer_token';
  static const String _userKey = 'pharmex_customer_user';

  static String? _token;
  static Map<String, dynamic>? _cachedUser;

  static Future<void> saveSession(String token, Map<String, dynamic> user) async {
    _token = token;
    _cachedUser = user;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_tokenKey, token);
    await prefs.setString(_userKey, jsonEncode(user));
  }

  static Future<void> loadSession() async {
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString(_tokenKey);
    final userStr = prefs.getString(_userKey);
    if (userStr != null) {
      _cachedUser = jsonDecode(userStr);
    }
  }

  static bool get isLoggedIn => _token != null;

  static Map<String, dynamic>? get cachedUser => _cachedUser;

  /// Updates the cached user profile without touching the auth token.
  static Future<void> updateCachedUser(Map<String, dynamic> user) async {
    _cachedUser = user;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_userKey, jsonEncode(user));
  }

  static String? get userName => _cachedUser?['name'];

  static Future<void> logout() async {
    _token = null;
    _cachedUser = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
    await prefs.remove(_userKey);
  }

  static Map<String, String> _headers({bool auth = true}) {
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      if (auth && _token != null) 'Authorization': 'Bearer $_token',
    };
  }

  static Uri _uri(String path) => Uri.parse('${ApiConfig.baseUrl}$path');

  static dynamic _decode(http.Response res) {
    dynamic body;
    try {
      body = jsonDecode(res.body);
    } catch (_) {
      body = null;
    }
    if (res.statusCode >= 200 && res.statusCode < 300) {
      return body;
    }
    String message = 'Request failed (${res.statusCode})';
    if (body is Map && body['message'] != null) {
      message = body['message'].toString();
    }
    throw ApiException(message);
  }

  static Future<dynamic> get(String path) async {
    final res = await http.get(_uri(path), headers: _headers());
    return _decode(res);
  }

  static Future<dynamic> post(String path, [Map<String, dynamic>? body]) async {
    final res = await http.post(
      _uri(path),
      headers: _headers(),
      body: jsonEncode(body ?? {}),
    );
    return _decode(res);
  }

  static Future<dynamic> put(String path, [Map<String, dynamic>? body]) async {
    final res = await http.put(
      _uri(path),
      headers: _headers(),
      body: jsonEncode(body ?? {}),
    );
    return _decode(res);
  }

  /// Uploads a local file via multipart/form-data to /upload,
  /// returns the decoded JSON response (contains data.url).
  static Future<dynamic> uploadFile(String filePath, {String folder = 'uploads'}) async {
    final uri = Uri.parse('${ApiConfig.apiBaseUrl}/upload');
    final req = http.MultipartRequest('POST', uri)
      ..headers['Accept'] = 'application/json'
      ..headers['Authorization'] = _token != null ? 'Bearer $_token' : ''
      ..fields['folder'] = folder
      ..files.add(await http.MultipartFile.fromPath('file', filePath));
    final streamed = await req.send();
    final res = await http.Response.fromStream(streamed);
    return _decode(res);
  }
}
