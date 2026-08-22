import 'package:flutter/foundation.dart';
import '../models/models.dart';

class CartState extends ChangeNotifier {
  final Map<int, CartItem> _items = {};

  int? _pharmacyId;
  String? _pharmacyName;

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
    notifyListeners();
  }

  void remove(int drugId) {
    _items.remove(drugId);
    if (_items.isEmpty) {
      _pharmacyId = null;
      _pharmacyName = null;
    }
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
    notifyListeners();
  }

  void clear() {
    _items.clear();
    _pharmacyId = null;
    _pharmacyName = null;
    notifyListeners();
  }

  int quantityFor(int drugId) => _items[drugId]?.quantity ?? 0;
}
