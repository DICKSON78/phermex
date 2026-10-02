import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import 'orders_screen.dart';

class OrderDetailSheet extends StatelessWidget {
  final OrderItem order;
  const OrderDetailSheet({super.key, required this.order});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(22, 14, 22, 26),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(26)),
      ),
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
                child: Text(order.pharmacy,
                    style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration:
                    BoxDecoration(color: AppColors.mint50, borderRadius: BorderRadius.circular(99)),
                child: Text(order.status.toUpperCase(),
                    style: const TextStyle(
                        fontSize: 11, fontWeight: FontWeight.w700, color: AppColors.brand700)),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text('${order.orderId} · Sep 2, 2026 · 5:25 PM',
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
                const Text('No items recorded',
                    style: TextStyle(fontSize: 12, color: AppColors.muted)),
                const Divider(height: 24, color: AppColors.line),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: const [
                    Text('Payment', style: TextStyle(fontSize: 12.5, color: AppColors.muted)),
                    Text('Paid · cash',
                        style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w700)),
                  ],
                ),
                const SizedBox(height: 8),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Total', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700)),
                    Text(order.total,
                        style: const TextStyle(
                            fontSize: 15, fontWeight: FontWeight.w800, color: AppColors.brand600)),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: () {},
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.brand600,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 15),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              ),
              icon: const Icon(Icons.description_outlined, size: 16),
              label: const Text('Open Full Details',
                  style: TextStyle(fontWeight: FontWeight.w700)),
            ),
          ),
        ],
      ),
    );
  }
}
