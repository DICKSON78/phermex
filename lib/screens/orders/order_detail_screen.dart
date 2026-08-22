import 'package:flutter/material.dart';
import '../../models/models.dart';
import '../../services/customer_repository.dart';
import '../../theme.dart';
import '../../utils/helpers.dart';
import 'delivery_tracking_screen.dart';

class OrderDetailScreen extends StatefulWidget {
  final int orderId;
  const OrderDetailScreen({super.key, required this.orderId});

  @override
  State<OrderDetailScreen> createState() => _OrderDetailScreenState();
}

class _OrderDetailScreenState extends State<OrderDetailScreen> {
  Order? _order;
  bool _loading = true;
  String? _error;

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

  bool get _isActive {
    final s = _order?.orderStatus ?? '';
    return s.isNotEmpty && s != 'delivered' && s != 'completed' && s != 'cancelled';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.bgLight,
      appBar: AppBar(
        title: Text(_order != null ? '#${_order!.orderCode ?? _order!.id}' : 'Order Details'),
      ),
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
                  : _buildOrder(context),
    );
  }

  Widget _buildOrder(BuildContext context) {
    final order = _order!;
    final status = order.orderStatus ?? '';

    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
        children: [
          // Status card
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: AppTheme.dark,
              borderRadius: BorderRadius.circular(16),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(status.toUpperCase(),
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                          color: AppHelpers.statusColor(status),
                        )),
                    Text(AppHelpers.formatDate(order.createdAt),
                        style: const TextStyle(fontSize: 11, color: Color(0x99FFFFFF))),
                  ],
                ),
                const SizedBox(height: 8),
                Text(order.pharmacyName ?? 'Pharmacy',
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: Colors.white)),
                if (order.notes != null && order.notes!.isNotEmpty) ...[
                  const SizedBox(height: 6),
                  Text('Notes: ${order.notes}',
                      style: const TextStyle(fontSize: 12, color: Color(0x99FFFFFF))),
                ],
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.06),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Payment',
                                style: TextStyle(fontSize: 10, color: Color(0x99FFFFFF))),
                            Text(
                              '${AppHelpers.statusLabel(order.paymentStatus ?? '')} · ${order.paymentMethod ?? 'cash'}',
                              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.white),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.06),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Total',
                                style: TextStyle(fontSize: 10, color: Color(0x99FFFFFF))),
                            Text(AppHelpers.formatTZS(order.total),
                                style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppTheme.primary)),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          const SizedBox(height: 16),

          // Track button
          if (_isActive)
            SizedBox(
              height: 48,
              child: ElevatedButton.icon(
                onPressed: () => Navigator.of(context).push(
                  MaterialPageRoute(builder: (_) => DeliveryTrackingScreen(orderId: order.id)),
                ),
                icon: const Icon(Icons.navigation, size: 16, color: AppTheme.dark),
                label: const Text('Track Delivery', style: TextStyle(color: AppTheme.dark)),
              ),
            ),

          const SizedBox(height: 18),

          // Items
          const Text('Order Items',
              style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: Color(0xFF111827))),
          const SizedBox(height: 10),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFEEF1F0)),
            ),
            child: Column(
              children: [
                if (order.items.isEmpty)
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 12),
                    child: Text('No items recorded',
                        style: TextStyle(fontSize: 12, color: Color(0xFF9CA3AF))),
                  )
                else
                  ...order.items.map((item) => Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: Row(
                          children: [
                            Expanded(
                              child: Text(item.drugName ?? 'Drug',
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(fontSize: 13, color: Color(0xFF111827))),
                            ),
                            Text('x${item.quantity}',
                                style: const TextStyle(fontSize: 12, color: Color(0xFF9CA3AF))),
                            const SizedBox(width: 16),
                            Text(AppHelpers.formatTZS(item.totalPrice),
                                style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: Color(0xFF111827))),
                          ],
                        ),
                      )),
                const Divider(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Subtotal',
                        style: TextStyle(fontSize: 13, color: Color(0xFF6B7280))),
                    Text(AppHelpers.formatTZS(order.subtotal),
                        style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: Color(0xFF111827))),
                  ],
                ),
                const SizedBox(height: 6),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Total',
                        style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: Color(0xFF111827))),
                    Text(AppHelpers.formatTZS(order.total),
                        style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: AppTheme.primary)),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
