import 'package:flutter/material.dart';
import '../../models/models.dart';
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
      if (mounted) setState(() => _error = e.toString());
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
                                ? const Icon(Icons.check, size: 14, color: AppTheme.dark)
                                : current
                                    ? const SizedBox(
                                        width: 10,
                                        height: 10,
                                        child: CircularProgressIndicator(strokeWidth: 2, color: AppTheme.dark),
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
}
