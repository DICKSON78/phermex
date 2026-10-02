import 'dart:async';

import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../config/api_config.dart';

class AppHelpers {
  /// Resolves an API image field to a loadable absolute URL.
  ///
  /// The API returns absolute URLs for some records and bare storage paths for
  /// others, so relative values are joined onto the public site root. Returns
  /// null when there is nothing to load, letting callers keep their fallback.
  static String? imageUrl(String? raw) {
    if (raw == null) return null;
    final v = raw.trim();
    if (v.isEmpty) return null;
    if (v.startsWith('http://') || v.startsWith('https://')) return v;
    if (v.startsWith('data:')) return null;
    return '${ApiConfig.publicUrl}${v.startsWith('/') ? v : '/$v'}';
  }

  static String formatTZS(num? amount) {
    final n = amount ?? 0;
    return 'TZS ${NumberFormat('#,##0').format(n.toDouble().round())}';
  }

  static String formatDate(String? iso) {
    if (iso == null || iso.isEmpty) return '';
    try {
      final dt = DateTime.parse(iso).toLocal();
      return DateFormat('MMM d, yyyy · h:mm a').format(dt);
    } catch (_) {
      return iso;
    }
  }

  static String statusLabel(String status) {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'processing':
        return 'Processing';
      case 'shipped':
        return 'Shipped';
      case 'delivered':
        return 'Delivered';
      case 'completed':
        return 'Completed';
      case 'in_transit':
        return 'In Transit';
      case 'out_for_delivery':
        return 'Out for Delivery';
      case 'cancelled':
        return 'Cancelled';
      case 'paid':
        return 'Paid';
      case 'unpaid':
        return 'Unpaid';
      default:
        return status.isEmpty
            ? ''
            : status[0].toUpperCase() + status.substring(1);
    }
  }

  /// True when an order is still moving and can be tracked on the map.
  ///
  /// Any status that has not reached a terminal state counts as in transit,
  /// so a newly placed order is trackable immediately instead of dropping the
  /// user back to the plain order list.
  /// Guards a screen's data loading so it loads once up front and then
  /// refreshes silently in the background.
  ///
  /// Screens used to set their loading flag on every reload, which swapped the
  /// visible content for a spinner each time. With this gate a screen shows its
  /// blocking spinner only for the very first load; later refreshes keep the
  /// current data on screen and simply swap it out when new data arrives.
  static LoadGate loadGate() => LoadGate();
  static bool isOrderInTransit(String? status) {
    final s = (status ?? '').trim().toLowerCase();
    if (s.isEmpty) return false;
    const terminal = {
      'delivered',
      'completed',
      'cancelled',
      'canceled',
      'rejected',
      'returned',
      'failed',
    };
    return !terminal.contains(s);
  }

  static Color statusColor(String status) {
    switch (status) {
      case 'delivered':
      case 'completed':
      case 'paid':
      case 'approved':
        return const Color(0xFF059669);
      case 'pending':
      case 'processing':
      case 'shipped':
        return const Color(0xFFD97706);
      case 'in_transit':
        return const Color(0xFF3B82F6);
      case 'out_for_delivery':
        return const Color(0xFF8B5CF6);
      case 'cancelled':
      case 'rejected':
      case 'unpaid':
        return const Color(0xFFDC2626);
      default:
        return const Color(0xFF6B7280);
    }
  }
}

class AppStrings {
  static const String appName = 'Helix';
  static const String tagline =
      'Order medicines from trusted pharmacies near you';
}

/// Tracks whether a screen has loaded once, and whether a load is in flight.
///
/// See [AppHelpers.loadGate].
class LoadGate {
  bool _running = false;
  bool _loaded = false;

  /// True while a request is in flight.
  bool get running => _running;

  /// True once at least one load has completed successfully.
  bool get loaded => _loaded;

  /// Should the screen show a blocking spinner for this load?
  ///
  /// True only for the first load, or when the user pulls to refresh.
  bool shouldBlock() => !_loaded;
}

/// Starts a repeating, silent background refresh.
///
/// This lets a screen load once and then keep its data current without ever
/// flashing a spinner. Pair it with a `_load(silent: true)` implementation.
class AutoRefresh {
  Timer? _timer;

  /// Begins calling [onTick] every [interval] unless already running.
  void start(Duration interval, VoidCallback onTick) {
    stop();
    _timer = Timer.periodic(interval, (_) => onTick());
  }

  void stop() {
    _timer?.cancel();
    _timer = null;
  }
}
