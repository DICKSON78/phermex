import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';

/// Stores the customer's saved delivery addresses locally in SharedPreferences
/// under the `helix_saved_addresses` key (a JSON string list).
class AddressBookService {
  static const String _key = 'helix_saved_addresses';
  static const String _defaultKey = 'helix_default_address';

  static Future<List<String>> getAddresses() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final raw = prefs.getString(_key);
      if (raw == null || raw.isEmpty) return [];
      final decoded = jsonDecode(raw);
      if (decoded is List) {
        return decoded.map((e) => e.toString()).toList();
      }
    } catch (_) {}
    return [];
  }

  static Future<void> _save(List<String> addresses) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_key, jsonEncode(addresses));
  }

  static Future<void> addAddress(String address) async {
    final addresses = await getAddresses();
    addresses.add(address);
    await _save(addresses);
    if ((await getDefaultAddress()) == null) {
      await setDefaultAddress(address);
    }
  }

  static Future<void> removeAddress(String address) async {
    final addresses = await getAddresses();
    addresses.remove(address);
    await _save(addresses);
    if (await getDefaultAddress() == address) {
      await _removeDefault();
    }
  }

  static Future<void> setDefaultAddress(String address) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_defaultKey, address);
  }

  static Future<String?> getDefaultAddress() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      return prefs.getString(_defaultKey);
    } catch (_) {
      return null;
    }
  }

  static Future<void> _removeDefault() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_defaultKey);
  }
}
