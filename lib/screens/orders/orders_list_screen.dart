import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../l10n/app_localizations.dart';
import '../../models/models.dart';
import '../../services/api_service.dart';
import '../../services/customer_repository.dart';
import '../../theme.dart';
import '../../utils/helpers.dart';
import 'order_detail_screen.dart';
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
    default:
      return AppHelpers.statusLabel(status);
  }
}

String _filterLabelKey(String filter) {
  switch (filter) {
    case 'All':
      return 'oh.filterAll';
    case 'Active':
      return 'oh.filterActive';
    case 'Completed':
      return 'oh.filterCompleted';
    case 'Cancelled':
      return 'oh.filterCancelled';
    default:
      return filter;
  }
}

class OrdersListScreen extends StatefulWidget {
  final int refreshTick;
  const OrdersListScreen({super.key, this.refreshTick = 0});

  @override
  State<OrdersListScreen> createState() => _OrdersListScreenState();
}

class _OrdersListScreenState extends State<OrdersListScreen> {
  List<Order> _orders = [];
  bool _loading = true;
  bool _loadingMore = false;
  String? _error;
  String _filter = 'All';
  int _currentPage = 1;
  int _lastPage = 1;

  static const _filters = ['All', 'Active', 'Completed', 'Cancelled'];

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
    _load();
  }

  @override
  void didUpdateWidget(covariant OrdersListScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.refreshTick != oldWidget.refreshTick) {
      _load();
    }
  }

  @override
  void dispose() {
    _scrollController.removeListener(_onScroll);
    _scrollController.dispose();
    super.dispose();
  }

  final ScrollController _scrollController = ScrollController();

  void _onScroll() {
    if (_scrollController.position.pixels >= _scrollController.position.maxScrollExtent - 200 &&
        !_loadingMore &&
        _currentPage < _lastPage) {
      _loadMore();
    }
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _currentPage = 1;
    });
    try {
      final result = await CustomerRepository.myOrdersPaginated(page: 1);
      if (!mounted) return;
      setState(() {
        _orders = (result['orders'] as List).cast<Order>();
        _currentPage = result['currentPage'] as int;
        _lastPage = result['lastPage'] as int;
        _error = null;
      });
    } catch (e) {
      if (mounted) setState(() => _error = ApiService.friendlyError(e));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _loadMore() async {
    if (_loadingMore || _currentPage >= _lastPage) return;
    setState(() => _loadingMore = true);
    try {
      final nextPage = _currentPage + 1;
      final result = await CustomerRepository.myOrdersPaginated(page: nextPage);
      if (!mounted) return;
      setState(() {
        _orders.addAll((result['orders'] as List).cast<Order>());
        _currentPage = result['currentPage'] as int;
        _lastPage = result['lastPage'] as int;
      });
    } catch (_) {
    } finally {
      if (mounted) setState(() => _loadingMore = false);
    }
  }

  bool _matchesFilter(Order o) {
    final s = o.orderStatus ?? '';
    switch (_filter) {
      case 'Active':
        return s != 'delivered' && s != 'completed' && s != 'cancelled';
      case 'Completed':
        return s == 'delivered' || s == 'completed';
      case 'Cancelled':
        return s == 'cancelled';
      default:
        return true;
    }
  }

  @override
  Widget build(BuildContext context) {
    final L = AppLocalizations.of(context);
    final filtered = _orders.where(_matchesFilter).toList();
    return Scaffold(
      appBar: AppBar(
        title: Text(L.t('oh.myOrders')),
        backgroundColor: Colors.white,
        systemOverlayStyle: const SystemUiOverlayStyle(
          statusBarColor: Color(0xFF0F2A1E),
          statusBarIconBrightness: Brightness.light,
          statusBarBrightness: Brightness.dark,
        ),
      ),
      body: Column(
        children: [
          Container(
            width: double.infinity,
            color: Colors.white,
            padding: const EdgeInsets.fromLTRB(24, 0, 24, 16),
            child: Row(
              children: List.generate(_filters.length, (i) {
                final active = _filter == _filters[i];
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: ChoiceChip(
                    label: Text(L.t(_filterLabelKey(_filters[i]))),
                    selected: active,
                    onSelected: (_) => setState(() => _filter = _filters[i]),
                    selectedColor: AppColors.brand600,
                    backgroundColor: Colors.white,
                    labelStyle: TextStyle(
                      color: active ? Colors.white : AppColors.muted,
                      fontWeight: FontWeight.w700,
                      fontSize: 13,
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(99),
                      side: BorderSide(color: active ? AppColors.brand600 : AppColors.line),
                    ),
                  ),
                );
              }),
            ),
          ),
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator(color: AppColors.brand600))
                : _error != null
                    ? _ErrorBox(message: _error!, onRetry: _load)
                    : filtered.isEmpty
                              ? RefreshIndicator(
                                  onRefresh: _load,
                                  child: ListView(
                                    physics: const AlwaysScrollableScrollPhysics(),
                                    children: [
                                      const SizedBox(height: 160),
                                      const Icon(Icons.receipt_long_rounded, size: 44, color: AppColors.line),
                                      const SizedBox(height: 12),
                                      Center(
                                        child: Text(L.t('oh.noOrdersYet'),
                                            style: const TextStyle(fontSize: 13, color: AppColors.muted)),
                                      ),
                                    ],
                                  ),
                                )
                              : RefreshIndicator(
                            onRefresh: _load,
                            child: ListView.separated(
                              controller: _scrollController,
                              padding: const EdgeInsets.all(24),
                              itemCount: filtered.length + (_loadingMore ? 1 : 0),
                              separatorBuilder: (_, __) => const SizedBox(height: 12),
                              itemBuilder: (context, i) {
                                if (i == filtered.length) {
                                  return const Padding(
                                    padding: EdgeInsets.symmetric(vertical: 16),
                                    child: Center(child: CircularProgressIndicator(strokeWidth: 2)),
                                  );
                                }
                                return _OrderCard(order: filtered[i]);
                              },
                            ),
                          ),
          ),
        ],
      ),
    );
  }
}

class _OrderCard extends StatelessWidget {
  final Order order;
  const _OrderCard({required this.order});

  @override
  Widget build(BuildContext context) {
    final L = AppLocalizations.of(context);
    return InkWell(
      onTap: () => _showOrderSheet(context, order),
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          border: Border.all(color: AppColors.line),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Row(
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: AppColors.mint50,
                border: Border.all(color: AppColors.line),
                borderRadius: BorderRadius.circular(14),
              ),
              child: const Icon(Icons.receipt_long_rounded,
                  color: AppColors.brand600, size: 19),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(order.pharmacyName ?? L.t('oh.pharmacy'),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppColors.ink)),
                  const SizedBox(height: 2),
                  Text('#${order.orderCode ?? order.id}',
                      style: const TextStyle(fontSize: 11, color: AppColors.muted)),
                ],
              ),
            ),
            Text(AppHelpers.formatTZS(order.total),
                style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: AppColors.ink)),
          ],
        ),
      ),
    );
  }

  void _showOrderSheet(BuildContext context, Order order) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _OrderDetailsSheet(order: order),
    );
  }
}

class _OrderDetailsSheet extends StatelessWidget {
  final Order order;
  const _OrderDetailsSheet({required this.order});

  @override
  Widget build(BuildContext context) {
    final L = AppLocalizations.of(context);
    final status = order.orderStatus ?? '';
    return Container(
      padding: const EdgeInsets.fromLTRB(22, 14, 22, 26),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(26)),
      ),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                margin: const EdgeInsets.only(bottom: 16),
                decoration:
                    BoxDecoration(color: AppColors.line, borderRadius: BorderRadius.circular(99)),
              ),
            ),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(order.pharmacyName ?? L.t('oh.pharmacy'),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: AppColors.ink)),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration:
                      BoxDecoration(color: AppColors.mint50, borderRadius: BorderRadius.circular(99)),
                  child: Text(_orderStatusText(L, status).toUpperCase(),
                      style: const TextStyle(
                          fontSize: 11, fontWeight: FontWeight.w700, color: AppColors.brand700)),
                ),
              ],
            ),
            const SizedBox(height: 4),
            Text('#${order.orderCode ?? order.id} · ${AppHelpers.formatDate(order.createdAt)}',
                style: const TextStyle(fontSize: 11.5, color: AppColors.muted)),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                border: Border.all(color: AppColors.line),
                borderRadius: BorderRadius.circular(16),
              ),
child: Column(
                  children: [
                    if (order.items.isEmpty)
                      Text(L.t('oh.noItems'),
                          style: const TextStyle(fontSize: 12, color: AppColors.muted))
                    else
                      ...order.items.map((item) => Padding(
                            padding: const EdgeInsets.only(bottom: 10),
                            child: Row(
                              children: [
                                Expanded(
                                  child: Text(item.drugName ?? L.t('oh.drug'),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                      style: const TextStyle(fontSize: 13, color: AppColors.ink)),
                                ),
                                Text('x${item.quantity}',
                                    style: const TextStyle(fontSize: 12, color: AppColors.muted)),
                                const SizedBox(width: 12),
                                Text(AppHelpers.formatTZS(item.totalPrice),
                                    style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.ink)),
                              ],
                            ),
                          )),
                  const Divider(height: 24, color: AppColors.line),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(L.t('oh.payment'), style: const TextStyle(fontSize: 12.5, color: AppColors.muted)),
                      Text(
                          '${_orderStatusText(L, order.paymentStatus ?? '')} · ${order.paymentMethod ?? L.t('oh.cash')}',
                          style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w700, color: AppColors.ink)),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(L.t('oh.total'), style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.ink)),
                      Text(AppHelpers.formatTZS(order.total),
                          style: const TextStyle(
                              fontSize: 15, fontWeight: FontWeight.w800, color: AppColors.brand600)),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            if (status == 'processing' || status == 'shipped') ...[
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: () {
                    Navigator.of(context).pop();
                    Navigator.of(context).push(
                      MaterialPageRoute(
                          builder: (_) => DeliveryTrackingScreen(orderId: order.id)),
                    );
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.brand600,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 15),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                  icon: const Icon(Icons.navigation_rounded, size: 16),
                  label: Text(L.t('trackLiveOrder'),
                      style: const TextStyle(fontWeight: FontWeight.w700)),
                ),
              ),
              const SizedBox(height: 12),
            ],
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: () {
                  Navigator.of(context).pop();
                  Navigator.of(context).push(
                    MaterialPageRoute(builder: (_) => OrderDetailScreen(orderId: order.id)),
                  );
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.brand600,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 15),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                ),
                icon: const Icon(Icons.description_outlined, size: 16),
                label: Text(L.t('oh.openFullDetails'),
                    style: const TextStyle(fontWeight: FontWeight.w700)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ErrorBox extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;
  const _ErrorBox({required this.message, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    final L = AppLocalizations.of(context);
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(message, textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 13, color: Color(0xFFDC2626))),
            const SizedBox(height: 12),
            OutlinedButton(onPressed: onRetry, child: Text(L.t('oh.retry'))),
          ],
        ),
      ),
    );
  }
}