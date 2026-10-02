import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../widgets/app_bottom_nav.dart';
import 'order_detail_sheet.dart';

class OrderItem {
  final String pharmacy;
  final String orderId;
  final String total;
  final String status; // Delivered / Out for delivery / etc.
  const OrderItem({
    required this.pharmacy,
    required this.orderId,
    required this.total,
    required this.status,
  });
}

class OrdersScreen extends StatefulWidget {
  const OrdersScreen({super.key});

  @override
  State<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends State<OrdersScreen> {
  int _filter = 0;
  final _filters = const ['All', 'Active', 'Completed', 'Cancelled'];

  final _orders = const [
    OrderItem(
      pharmacy: 'Mwalimu Pharmacy',
      orderId: '#ORD-2026-YTVFW',
      total: 'TZS 14',
      status: 'Delivered',
    ),
    OrderItem(
      pharmacy: 'Mwalimu Pharmacy',
      orderId: '#ORD-2026-KFXWU',
      total: 'TZS 6',
      status: 'Active',
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('My Orders')),
      body: Column(
        children: [
          Container(
            width: double.infinity,
            color: Colors.white,
            padding: const EdgeInsets.fromLTRB(24, 0, 24, 16),
            child: Row(
              children: List.generate(_filters.length, (i) {
                final active = i == _filter;
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: ChoiceChip(
                    label: Text(_filters[i]),
                    selected: active,
                    onSelected: (_) => setState(() => _filter = i),
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
            child: ListView.separated(
              padding: const EdgeInsets.all(24),
              itemCount: _orders.length,
              separatorBuilder: (_, __) => const SizedBox(height: 12),
              itemBuilder: (context, i) {
                final order = _orders[i];
                return InkWell(
                  onTap: () => showModalBottomSheet(
                    context: context,
                    isScrollControlled: true,
                    backgroundColor: Colors.transparent,
                    builder: (_) => OrderDetailSheet(order: order),
                  ),
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
                              Text(order.pharmacy,
                                  style:
                                      const TextStyle(fontSize: 14, fontWeight: FontWeight.w700)),
                              const SizedBox(height: 2),
                              Text(order.orderId,
                                  style: const TextStyle(fontSize: 11, color: AppColors.muted)),
                            ],
                          ),
                        ),
                        Text(order.total,
                            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w800)),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
      bottomNavigationBar: AppBottomNav(current: AppTab.orders, onTap: (_) {}),
    );
  }
}
