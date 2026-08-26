import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

class AppHelpers {
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
        return status.isEmpty ? '' : status[0].toUpperCase() + status.substring(1);
    }
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
  static const String appName = 'Pharmex';
  static const String tagline = 'Order medicines from trusted pharmacies near you';
}
