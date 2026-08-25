import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/models.dart';

class CartState extends ChangeNotifier {
  static const _prefsKey = 'pharmex_customer_cart';

  final Map<int, CartItem> _items = {};

  int? _pharmacyId;
  String? _pharmacyName;

  CartState() {
    _restore();
  }

  List<CartItem> get items => _items.values.toList();

  bool get isEmpty => _items.isEmpty;

  int get count => _items.values.fold(0, (sum, i) => sum + i.quantity);

  double get subtotal => _items.values.fold(0.0, (sum, i) => sum + i.total);

  int? get pharmacyId => _pharmacyId;

  String? get pharmacyName => _pharmacyName;

  /// Adds a drug to the cart. If the drug is from a different pharmacy,
  /// the cart is cleared first (single-pharmacy checkout, matching PWA).
  void add(Drug drug, {int qty = 1, int? pharmacyId, String? pharmacyName}) {
    if (pharmacyId != null && _pharmacyId != null && _pharmacyId != pharmacyId) {
      _items.clear();
      _pharmacyId = pharmacyId;
      _pharmacyName = pharmacyName;
    } else if (_pharmacyId == null && pharmacyId != null) {
      _pharmacyId = pharmacyId;
      _pharmacyName = pharmacyName;
    }
    final existing = _items[drug.id];
    if (existing != null) {
      existing.quantity += qty;
    } else {
      _items[drug.id] = CartItem(drug: drug, quantity: qty);
    }
    _persist();
    notifyListeners();
  }

  void remove(int drugId) {
    _items.remove(drugId);
    if (_items.isEmpty) {
      _pharmacyId = null;
      _pharmacyName = null;
    }
    _persist();
    notifyListeners();
  }

  void setQuantity(int drugId, int qty) {
    final item = _items[drugId];
    if (item == null) return;
    if (qty <= 0) {
      _items.remove(drugId);
      if (_items.isEmpty) {
        _pharmacyId = null;
        _pharmacyName = null;
      }
    } else {
      item.quantity = qty;
    }
    _persist();
    notifyListeners();
  }

  void clear() {
    _items.clear();
    _pharmacyId = null;
    _pharmacyName = null;
    _persist();
    notifyListeners();
  }

  int quantityFor(int drugId) => _items[drugId]?.quantity ?? 0;

  Future<void> _persist() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      if (_items.isEmpty) {
        await prefs.remove(_prefsKey);
        return;
      }
      final data = {
        'pharmacy_id': _pharmacyId,
        'pharmacy_name': _pharmacyName,
        'items': items
            .map((i) => {'quantity': i.quantity, 'drug': i.drug.toJson()})
            .toList(),
      };
      await prefs.setString(_prefsKey, jsonEncode(data));
    } catch (_) {
      // Persistence failures must never break cart usage.
    }
  }

  Future<void> _restore() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final raw = prefs.getString(_prefsKey);
      if (raw == null || raw.isEmpty || _items.isNotEmpty) return;
      final data = jsonDecode(raw);
      if (data is! Map) return;
      final restored = <int, CartItem>{};
      for (final entry in (data['items'] as List? ?? [])) {
        if (entry is Map && entry['drug'] is Map && entry['quantity'] is int) {
          final drug = Drug.fromJson(Map<String, dynamic>.from(entry['drug'] as Map));
          if ((drug.quantity ?? 0) > 0) {
            restored[drug.id] = CartItem(drug: drug, quantity: entry['quantity'] as int);
          }
        }
      }
      if (restored.isEmpty) return;
      _items
        ..clear()
        ..addAll(restored);
      _pharmacyId = data['pharmacy_id'] is int ? data['pharmacy_id'] as int : null;
      _pharmacyName = data['pharmacy_name'] is String ? data['pharmacy_name'] as String : null;
      notifyListeners();
    } catch (_) {
      // Corrupt persisted carts are simply dropped.
    }
  }
}
