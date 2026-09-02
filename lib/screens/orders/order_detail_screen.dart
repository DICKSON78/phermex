import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/models.dart';
import '../../services/api_service.dart';
import '../../services/customer_repository.dart';
import '../../state/cart_state.dart';
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
  bool _cancelling = false;

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

  bool get _canCancel => _order?.orderStatus == 'pending';

  Future<void> _cancelOrder() async {
    final order = _order;
    if (order == null || _cancelling) return;

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Cancel order?'),
        content: Text(
            'Order #${order.orderCode ?? order.id} will be cancelled and the pharmacy will be notified.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Keep Order')),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: TextButton.styleFrom(foregroundColor: const Color(0xFFDC2626)),
            child: const Text('Cancel Order'),
          ),
        ],
      ),
    );
    if (confirmed != true) return;

    setState(() => _cancelling = true);
    try {
      final updated = await CustomerRepository.cancelOrder(order.id);
      if (!mounted) return;
      setState(() {
        _order = updated;
        _cancelling = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('Order cancelled'),
        backgroundColor: AppTheme.primary,
        behavior: SnackBarBehavior.floating,
      ));
    } catch (e) {
      if (!mounted) return;
      setState(() => _cancelling = false);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(ApiService.friendlyError(e)),
        backgroundColor: const Color(0xFFDC2626),
        behavior: SnackBarBehavior.floating,
      ));
    }
  }

  void _reorder(Order order) {
    final cart = context.read<CartState>();
    for (final item in order.items) {
      final drugId = item.drugId;
      if (drugId == null) continue;
      cart.add(
        Drug(
          id: drugId,
          name: item.drugName,
          price: item.unitPrice,
          quantity: 100,
        ),
        qty: item.quantity,
        pharmacyId: order.pharmacyId,
        pharmacyName: order.pharmacyName,
      );
    }
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: const Text('Items added to cart'),
        behavior: SnackBarBehavior.floating,
        action: SnackBarAction(
          label: 'VIEW CART',
          onPressed: () => Navigator.pushNamed(context, '/cart'),
        ),
      ),
    );
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
    final cancelled = status == 'cancelled';
    final completed = status == 'delivered' || status == 'completed';

    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
        children: [
          // Pharmacy header (receipt top): logo/initial + name + order ref
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFEEF1F0)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    _PharmacyAvatar(name: order.pharmacyName),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(order.pharmacyName ?? 'Pharmacy',
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                  fontSize: 16, fontWeight: FontWeight.w700, color: Color(0xFF111827))),
                          const SizedBox(height: 2),
                          Text('#${order.orderCode ?? order.id}',
                              style: const TextStyle(fontSize: 12, color: Color(0xFF6B7280))),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: AppHelpers.statusColor(status).withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(status.toUpperCase(),
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w700,
                            color: AppHelpers.statusColor(status),
                          )),
                    ),
                  ],
                ),
              ],
            ),
          ),

          const SizedBox(height: 16),

          // Reorder button
          if (status == 'delivered' || status == 'completed') ...[
            const SizedBox(height: 12),
            SizedBox(height: 48, child: _reorderButton(order)),
          ],

          const SizedBox(height: 20),

          // Receipt / Items
          const Text('Receipt',
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
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Items
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
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(item.drugName ?? 'Drug',
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                      style: const TextStyle(fontSize: 13, color: Color(0xFF111827))),
                                  const SizedBox(height: 2),
                                  Text('${AppHelpers.formatTZS(item.unitPrice)} × ${item.quantity}',
                                      style: const TextStyle(fontSize: 11, color: Color(0xFF9CA3AF))),
                                ],
                              ),
                            ),
                            const SizedBox(width: 12),
                            Text(AppHelpers.formatTZS(item.totalPrice),
                                style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: Color(0xFF111827))),
                          ],
                        ),
                      )),
                const Divider(height: 16),
                _ReceiptRow(label: 'Subtotal', value: AppHelpers.formatTZS(order.subtotal)),
                if (order.discount > 0)
                  _ReceiptRow(label: 'Discount', value: '− ${AppHelpers.formatTZS(order.discount)}',
                      valueColor: const Color(0xFFDC2626)),
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
                const Divider(height: 16),
                // Order summary details
                _ReceiptRow(label: 'Order Ref', value: '#${order.orderCode ?? order.id}'),
                _ReceiptRow(label: 'Date', value: AppHelpers.formatDate(order.createdAt)),
                _ReceiptRow(label: 'Payment',
                    value:
                        '${AppHelpers.statusLabel(order.paymentStatus ?? '')} · ${order.paymentMethod ?? 'cash'}'),
                _ReceiptRow(label: 'Delivery',
                    value: AppHelpers.statusLabel(order.deliveryStatus ?? order.orderStatus ?? '')),
                if (order.deliveryAddress != null && order.deliveryAddress!.isNotEmpty)
                  _ReceiptRow(label: 'Deliver to', value: order.deliveryAddress!),
                if (order.deliveryPhone != null && order.deliveryPhone!.isNotEmpty)
                  _ReceiptRow(label: 'Contact', value: order.deliveryPhone!),
                if (order.notes != null && order.notes!.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(top: 6),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const SizedBox(width: 90, child: Text('Notes',
                            style: TextStyle(fontSize: 12, color: Color(0xFF9CA3AF)))),
                        Expanded(
                          child: Text(order.notes!,
                              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: Color(0xFF111827))),
                        ),
                      ],
                    ),
                  ),
              ],
            ),
          ),

          if (_canCancel) ...[
            const SizedBox(height: 20),
            SizedBox(
              height: 50,
              child: ElevatedButton.icon(
                onPressed: _cancelling ? null : _cancelOrder,
                icon: _cancelling
                    ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : const Icon(Icons.cancel_outlined, size: 18, color: Colors.white),
                label: const Text('Cancel Order',
                    style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 14)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFDC2626),
                  disabledBackgroundColor: const Color(0xFFDC2626).withValues(alpha: 0.5),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _reorderButton(Order order) {
    return ElevatedButton.icon(
      onPressed: () => _reorder(order),
      icon: const Icon(Icons.refresh, size: 16, color: Colors.white),
      label: const Text('Reorder', style: TextStyle(color: Colors.white)),
    );
  }
}

class _PharmacyAvatar extends StatelessWidget {
  final String? name;
  const _PharmacyAvatar({this.name});

  @override
  Widget build(BuildContext context) {
    final initial = ((name ?? 'P')).isNotEmpty
        ? (name!.trim().isEmpty ? 'P' : name!.trim()[0].toUpperCase())
        : 'P';
    return Container(
      width: 50,
      height: 50,
      decoration: BoxDecoration(
        color: AppTheme.primary.withValues(alpha: 0.12),
        shape: BoxShape.circle,
      ),
      alignment: Alignment.center,
      child: Text(initial,
          style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: AppTheme.primaryDark)),
    );
  }
}

class _ReceiptRow extends StatelessWidget {
  final String label;
  final String value;
  final Color? valueColor;
  const _ReceiptRow({required this.label, required this.value, this.valueColor});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(width: 90, child: Text(label,
              style: const TextStyle(fontSize: 12, color: Color(0xFF9CA3AF)))),
          Expanded(
            child: Text(value,
                textAlign: TextAlign.right,
                style: TextStyle(
                    fontSize: 12, fontWeight: FontWeight.w600, color: valueColor ?? const Color(0xFF111827))),
          ),
        ],
      ),
    );
  }
}
