import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import '../../models/models.dart';
import '../../services/api_service.dart';
import '../../services/customer_repository.dart';
import '../../theme.dart';

class DeliveryTrackingScreen extends StatefulWidget {
  final int orderId;
  const DeliveryTrackingScreen({super.key, required this.orderId});

  @override
  State<DeliveryTrackingScreen> createState() => _DeliveryTrackingScreenState();
}

class _DeliveryTrackingScreenState extends State<DeliveryTrackingScreen> {
  Order? _order;
  bool _loading = true;
  String? _error;

  static const _steps = [
    ('Order Placed', 'We received your order'),
    ('Processing', 'Pharmacy is preparing your items'),
    ('Shipped', 'Order is on the way'),
    ('Delivered', 'Order has arrived'),
  ];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final order = await CustomerRepository.orderDetail(widget.orderId);
      if (!mounted) return;
      setState(() {
        _order = order;
        _error = null;
      });
    } catch (e) {
      if (mounted) setState(() => _error = ApiService.friendlyError(e));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  int _currentStep(String status) {
    switch (status) {
      case 'processing':
        return 1;
      case 'shipped':
        return 2;
      case 'delivered':
      case 'completed':
        return 3;
      case 'cancelled':
        return 0;
      default:
        return 0;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.bgLight,
      appBar: AppBar(title: const Text('Track Delivery')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(_error!, textAlign: TextAlign.center,
                            style: const TextStyle(fontSize: 13, color: Color(0xFFDC2626))),
                        const SizedBox(height: 12),
                        OutlinedButton(onPressed: _load, child: const Text('Retry')),
                      ],
                    ),
                  ),
                )
              : _order == null
                  ? const Center(child: Text('Order not found'))
                  : _buildTracking(context),
    );
  }

  Widget _buildTracking(BuildContext context) {
    final order = _order!;
    final status = order.orderStatus ?? 'pending';
    final step = _currentStep(status);
    final cancelled = status == 'cancelled';

    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFEEF1F0)),
            ),
            child: Row(
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: AppTheme.primary.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(Icons.local_shipping_outlined, size: 20, color: AppTheme.primary),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(order.pharmacyName ?? 'Pharmacy',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: Color(0xFF111827))),
                      Text('#${order.orderCode ?? order.id}',
                          style: const TextStyle(fontSize: 12, color: Color(0xFF9CA3AF))),
                    ],
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 20),

          _buildMap(order),

          const SizedBox(height: 20),

          if (cancelled)
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFFFEF2F2),
                borderRadius: BorderRadius.circular(16),
              ),
              child: const Row(
                children: [
                  Icon(Icons.cancel_outlined, size: 18, color: Color(0xFFDC2626)),
                  SizedBox(width: 10),
                  Expanded(
                    child: Text('This order was cancelled.',
                        style: TextStyle(fontSize: 13, color: Color(0xFFDC2626), fontWeight: FontWeight.w600)),
                  ),
                ],
              ),
            )
          else
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFEEF1F0)),
              ),
              child: Column(
                children: List.generate(_steps.length, (i) {
                  final done = i < step;
                  final current = i == step;
                  final color = done || current ? AppTheme.primary : const Color(0xFFD1D5DB);
                  final last = i == _steps.length - 1;
                  return Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Column(
                        children: [
                          Container(
                            width: 26,
                            height: 26,
                            decoration: BoxDecoration(
                              color: done || current ? AppTheme.primary : const Color(0xFFF3F4F6),
                              shape: BoxShape.circle,
                            ),
                            child: done
                                ? const Icon(Icons.check, size: 14, color: Colors.white)
                                : current
                                    ? const SizedBox(
                                        width: 10,
                                        height: 10,
                                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                                      )
                                    : null,
                          ),
                          if (!last)
                            Container(
                              width: 2,
                              height: 34,
                              color: color.withOpacity(0.4),
                            ),
                        ],
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Padding(
                          padding: EdgeInsets.only(bottom: last ? 0 : 18),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(_steps[i].$1,
                                  style: TextStyle(
                                    fontSize: 14,
                                    fontWeight: current || done ? FontWeight.w700 : FontWeight.w600,
                                    color: current || done ? const Color(0xFF111827) : const Color(0xFF9CA3AF),
                                  )),
                              const SizedBox(height: 2),
                              Text(_steps[i].$2,
                                  style: TextStyle(
                                    fontSize: 11,
                                    color: current || done ? const Color(0xFF6B7280) : const Color(0xFF9CA3AF),
                                  )),
                            ],
                          ),
                        ),
                      ),
                    ],
                  );
                }),
              ),
            ),
        ],
      ),
    );
  }

  /// Uber-style live map: pharmacy (origin) → delivery location (destination),
  /// with a connecting polyline and floating "live" badge.
  Widget _buildMap(Order order) {
    final fromLat = order.pharmacyLatitude;
    final fromLng = order.pharmacyLongitude;
    final toLat = order.deliveryLatitude;
    final toLng = order.deliveryLongitude;
    final hasOrigin = fromLat != null && fromLng != null;
    final hasDest = toLat != null && toLng != null;

    if (!hasOrigin && !hasDest) {
      return const SizedBox.shrink();
    }

    final from = LatLng(
      hasOrigin ? fromLat : (hasDest ? toLat : 0),
      hasOrigin ? fromLng : (hasDest ? toLng : 0),
    );
    final to = LatLng(
      hasDest ? toLat : (hasOrigin ? fromLat : 0),
      hasDest ? toLng : (hasOrigin ? fromLng : 0),
    );

    final center = LatLng(
      (from.latitude + to.latitude) / 2,
      (from.longitude + to.longitude) / 2,
    );

    return ClipRRect(
      borderRadius: BorderRadius.circular(18),
      child: SizedBox(
        height: 240,
        child: Stack(
          children: [
            FlutterMap(
              options: MapOptions(
                initialCenter: center,
                initialZoom: 14,
                interactionOptions: const InteractionOptions(
                    flags: InteractiveFlag.all & ~InteractiveFlag.rotate),
              ),
              children: [
                TileLayer(
                  urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                  userAgentPackageName: 'com.pharmex.pharmex_customer_app',
                ),
                if (hasOrigin && hasDest)
                  PolylineLayer(
                    polylines: [
                      Polyline(
                        points: [from, to],
                        color: AppTheme.primary,
                        strokeWidth: 4,
                      ),
                    ],
                  ),
                if (hasOrigin)
                  MarkerLayer(
                    markers: [
                      Marker(
                        point: from,
                        width: 42,
                        height: 48,
                        child: Column(
                          children: [Icon(Icons.local_pharmacy, size: 38, color: AppTheme.primary)],
                        ),
                      ),
                    ],
                  ),
                if (hasDest)
                  MarkerLayer(
                    markers: [
                      Marker(
                        point: to,
                        width: 40,
                        height: 44,
                        child: Column(
                          children: [Icon(Icons.location_on, size: 38, color: const Color(0xFFDC2626))],
                        ),
                      ),
                    ],
                  ),
              ],
            ),
            // Live badge
            Positioned(
              top: 12,
              left: 12,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: AppTheme.primary,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    SizedBox(
                      width: 8,
                      height: 8,
                      child: CircularProgressIndicator(strokeWidth: 1.6, color: Colors.white),
                    ),
                    SizedBox(width: 6),
                    Text('LIVE',
                        style: TextStyle(
                            fontSize: 11, fontWeight: FontWeight.w700, color: Colors.white)),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
