import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../l10n/app_localizations.dart';
import '../../models/models.dart';
import '../../services/api_service.dart';
import '../../services/customer_repository.dart';
import '../../state/cart_state.dart';
import '../../theme.dart';
import '../../utils/helpers.dart';
import 'delivery_tracking_screen.dart';

String _orderStatusText(AppLocalizations L, String status) {
  switch (status) {
    case 'pending':
    case 'Pending':
      return L.t('oh.statusPending');
    case 'processing':
    case 'Processing':
      return L.t('oh.statusProcessing');
    case 'shipped':
    case 'Shipped':
      return L.t('oh.statusShipped');
    case 'delivered':
    case 'Delivered':
      return L.t('oh.statusDelivered');
    case 'completed':
    case 'Completed':
      return L.t('oh.statusCompleted');
    case 'cancelled':
    case 'Cancelled':
      return L.t('oh.statusCancelled');
    case 'in_transit':
    case 'In Transit':
      return L.t('oh.statusInTransit');
    case 'out_for_delivery':
    case 'Out for Delivery':
      return L.t('oh.statusOutForDelivery');
    case 'paid':
    case 'Paid':
      return L.t('oh.statusPaid');
    case 'unpaid':
    case 'Unpaid':
      return L.t('oh.statusUnpaid');
    case 'pending_customer_transfer':
    case 'Pending Customer Transfer':
      return L.t('shop.paymentPendingConfirmation');
    case 'partial':
    case 'Partial':
      return L.t('shop.paymentPendingConfirmation');
    default:
      return AppHelpers.statusLabel(status);
  }
}

class OrderDetailScreen extends StatefulWidget {
  final int orderId;
  const OrderDetailScreen({super.key, required this.orderId});

  @override
  State<OrderDetailScreen> createState() => _OrderDetailScreenState();
}

class _OrderDetailScreenState extends State<OrderDetailScreen> {
  Order? _order;
  bool _loading = true;
  bool _loadedOnce = false;
  String? _error;
  bool _cancelling = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = !_loadedOnce);
    try {
      final order = await CustomerRepository.orderDetail(widget.orderId);
      if (!mounted) return;
      setState(() {
        _order = order;
        _error = null;
        _loadedOnce = true;
      });
    } catch (e) {
      if (mounted) setState(() => _error = ApiService.friendlyError(e));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  bool get _canCancel => _order?.orderStatus == 'pending';

  Future<void> _cancelOrder() async {
    final L = AppLocalizations.of(context);
    final order = _order;
    if (order == null || _cancelling) return;

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(L.t('oh.cancelOrderTitle')),
        content: Text(
            '${L.t('oh.orderWord')} #${order.orderCode ?? order.id} ${L.t('oh.willBeCancelledNotify')}'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: Text(L.t('oh.keepOrder'))),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: TextButton.styleFrom(foregroundColor: const Color(0xFFDC2626)),
            child: Text(L.t('oh.cancelOrder')),
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
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(L.t('oh.orderCancelled')),
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
    final L = AppLocalizations.of(context);
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
        content: Text(L.t('oh.itemsAddedToCart')),
        behavior: SnackBarBehavior.floating,
        action: SnackBarAction(
          label: L.t('oh.viewCart'),
          onPressed: () => Navigator.pushNamed(context, '/cart'),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final L = AppLocalizations.of(context);
    return Scaffold(
      backgroundColor: AppTheme.bgLight,
      appBar: AppBar(
        title: Text(_order != null ? '#${_order!.orderCode ?? _order!.id}' : L.t('oh.orderDetails')),
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
                        OutlinedButton(onPressed: _load, child: Text(L.t('oh.retry'))),
                      ],
                    ),
                  ),
                )
              : _order == null
                  ? Center(child: Text(L.t('oh.orderNotFound')))
                  : _buildOrder(context),
    );
  }

  Widget _buildOrder(BuildContext context) {
    final L = AppLocalizations.of(context);
    final order = _order!;
    final status = order.orderStatus ?? '';

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
                          Text(order.pharmacyName ?? L.t('oh.pharmacy'),
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
                      child: Text(_orderStatusText(L, status).toUpperCase(),
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

          // Live tracking (shipped/processing orders)
          if (status == 'processing' || status == 'shipped') ...[
            SizedBox(
              height: 50,
              child: ElevatedButton.icon(
                onPressed: () => Navigator.of(context).push(
                  MaterialPageRoute(
                    builder: (_) => DeliveryTrackingScreen(orderId: order.id),
                  ),
                ),
                icon: const Icon(Icons.navigation_rounded, size: 16, color: Colors.white),
                label: Text(L.t('trackLiveOrder'),
                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.brand600,
                ),
              ),
            ),
            const SizedBox(height: 16),
          ],

          // Reorder button
          if (status == 'delivered' || status == 'completed') ...[
            const SizedBox(height: 12),
            SizedBox(height: 48, child: _reorderButton(context, order)),
          ],

          const SizedBox(height: 20),

          // Settlement invoice. The order has been processed, so the customer
          // now pays this pharmacy directly. Nothing is collected here: this
          // card only says where to send the money and who confirms it.
          ..._settlementInvoice(context, order, status),

          const SizedBox(height: 20),

          // Receipt / Items
          Text(L.t('oh.receipt'),
              style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: Color(0xFF111827))),
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
                  Padding(
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    child: Text(L.t('oh.noItems'),
                        style: const TextStyle(fontSize: 12, color: Color(0xFF9CA3AF))),
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
                                  Text(item.drugName ?? L.t('oh.drug'),
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
                _ReceiptRow(label: L.t('oh.subtotal'), value: AppHelpers.formatTZS(order.subtotal)),
                if (order.discount > 0)
                  _ReceiptRow(label: L.t('oh.discount'), value: '− ${AppHelpers.formatTZS(order.discount)}',
                      valueColor: const Color(0xFFDC2626)),
                const SizedBox(height: 6),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(L.t('oh.total'),
                        style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: Color(0xFF111827))),
                    Text(AppHelpers.formatTZS(order.total),
                        style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: AppTheme.primary)),
                  ],
                ),
                const Divider(height: 16),
                // Order summary details
                _ReceiptRow(label: L.t('oh.orderRef'), value: '#${order.orderCode ?? order.id}'),
                _ReceiptRow(label: L.t('oh.date'), value: AppHelpers.formatDate(order.createdAt)),
                _ReceiptRow(label: L.t('oh.payment'),
                    value:
                        '${_orderStatusText(L, order.paymentStatus ?? '')} · ${order.paymentMethod ?? L.t('oh.cash')}'),
                _ReceiptRow(label: L.t('oh.delivery'),
                    value: _orderStatusText(L, order.deliveryStatus ?? order.orderStatus ?? '')),
                if (order.deliveryAddress != null && order.deliveryAddress!.isNotEmpty)
                  _ReceiptRow(label: L.t('oh.deliverTo'), value: order.deliveryAddress!),
                if (order.deliveryPhone != null && order.deliveryPhone!.isNotEmpty)
                  _ReceiptRow(label: L.t('oh.contact'), value: order.deliveryPhone!),
                if (order.notes != null && order.notes!.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(top: 6),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        SizedBox(width: 90, child: Text(L.t('oh.notes'),
                            style: const TextStyle(fontSize: 12, color: Color(0xFF9CA3AF)))),
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
                label: Text(L.t('oh.cancelOrder'),
                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 14)),
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


  /// What the customer must do to settle a processed order with the pharmacy,
  /// and later, the evidence that they did.
  List<Widget> _settlementInvoice(BuildContext context, Order order, String status) {
    final L = AppLocalizations.of(context);
    final details = order.paymentDetails;
    final paid = order.paymentStatus == 'paid';

    // Cash orders have nothing to settle before arrival, and an order still
    // being prepared has no bill to pay yet.
    if (details == null && !paid) return const [];
    final processed = const ['ready', 'out_for_delivery', 'dispensed', 'delivered'].contains(status);
    if (!processed && !paid) return const [];

    final number = details?['pharmacy_payment_number'] as String?;
    final name = details?['pharmacy_payment_name'] as String?;
    final method = details?['pharmacy_payment_method'] as String?;

    return [
      Container(
        padding: const EdgeInsets.all(18),
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
                Container(
                  width: 30,
                  height: 30,
                  decoration: BoxDecoration(
                    color: (paid ? const Color(0xFF16A34A) : AppTheme.primary).withValues(alpha: 0.12),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    paid ? Icons.check_rounded : Icons.receipt_long_rounded,
                    size: 16,
                    color: paid ? const Color(0xFF16A34A) : AppTheme.primary,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    L.t('oh.payment'),
                    style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: Color(0xFF111827)),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),

            // Amount the pharmacy is owed.
            Row(
              children: [
                Expanded(
                  child: Text(L.t('shop.amountToSend'),
                      style: const TextStyle(fontSize: 12.5, color: Color(0xFF6B7280))),
                ),
                Text('TZS ${order.total.toStringAsFixed(0)}',
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: Color(0xFF111827))),
              ],
            ),
            const SizedBox(height: 12),

            // Where to send it, when the pharmacy has published an account.
            if (!paid && number != null && number.trim().isNotEmpty) ...[
              const Divider(height: 1, color: Color(0xFFF0F3F1)),
              const SizedBox(height: 12),
              Text(L.t('shop.pharmacyMobileMoney'),
                  style: const TextStyle(fontSize: 12.5, color: Color(0xFF6B7280))),
              const SizedBox(height: 5),
              Row(
                children: [
                  Expanded(
                    child: Text(
                      [method, number].where((e) => e != null && e.trim().isNotEmpty).join(' · '),
                      style: const TextStyle(fontSize: 15.5, fontWeight: FontWeight.w700, color: Color(0xFF111827)),
                    ),
                  ),
                  if (name != null && name.trim().isNotEmpty)
                    Expanded(
                      child: Text(name,
                          textAlign: TextAlign.right,
                          style: const TextStyle(fontSize: 12.5, color: Color(0xFF6B7280))),
                    ),
                ],
              ),
              const SizedBox(height: 14),
              Text(L.t('shop.payPharmacyDirectBody'),
                  style: const TextStyle(fontSize: 12.5, color: Color(0xFF6B7280), height: 1.45)),
            ],

            const SizedBox(height: 14),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
              decoration: BoxDecoration(
                color: (paid ? const Color(0xFF16A34A) : const Color(0xFFB9762A)).withValues(alpha: 0.10),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Row(
                children: [
                  Icon(
                    paid ? Icons.verified_rounded : Icons.hourglass_top_rounded,
                    size: 14,
                    color: paid ? const Color(0xFF16A34A) : const Color(0xFFB9762A),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      paid ? L.t('shop.paidViaDirectTransfer') : L.t('shop.paymentPendingConfirmation'),
                      style: TextStyle(
                        fontSize: 12.5,
                        fontWeight: FontWeight.w700,
                        color: paid ? const Color(0xFF16A34A) : const Color(0xFFB9762A),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    ];
  }

  Widget _reorderButton(BuildContext context, Order order) {
    final L = AppLocalizations.of(context);
    return ElevatedButton.icon(
      onPressed: () => _reorder(order),
      icon: const Icon(Icons.refresh, size: 16, color: Colors.white),
      label: Text(L.t('oh.reorder'), style: const TextStyle(color: Colors.white)),
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
