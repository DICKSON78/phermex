import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../services/api_service.dart';
import '../../services/customer_repository.dart';
import '../../state/cart_state.dart';
import '../../theme.dart';
import '../../utils/helpers.dart';
import '../orders/order_detail_screen.dart';

class CheckoutScreen extends StatefulWidget {
  const CheckoutScreen({super.key});

  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  final _addressController = TextEditingController();
  final _phoneController = TextEditingController();
  final _notesController = TextEditingController();
  bool _placing = false;

  @override
  void initState() {
    super.initState();
    final user = ApiService.cachedUser;
    _addressController.text = (user?['location'] ?? '') as String;
    _phoneController.text = (user?['phone'] ?? '') as String;
  }

  @override
  void dispose() {
    _addressController.dispose();
    _phoneController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _placeOrder() async {
    final cart = context.read<CartState>();
    final pharmacyId = cart.pharmacyId;
    if (pharmacyId == null || cart.isEmpty) return;

    if (_addressController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please enter your delivery address'),
          backgroundColor: Color(0xFFDC2626),
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }

    setState(() => _placing = true);
    try {
      final order = await CustomerRepository.placeOrder(
        pharmacyId: pharmacyId,
        items: cart.items,
        deliveryAddress: _addressController.text.trim(),
        deliveryPhone: _phoneController.text.trim(),
        notes: _notesController.text.trim().isEmpty ? null : _notesController.text.trim(),
      );
      cart.clear();
      if (!mounted) return;
      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute(builder: (_) => OrderDetailScreen(orderId: order.id)),
        (route) => route.isFirst,
      );
    } catch (e) {
      if (!mounted) return;
      setState(() => _placing = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(e.toString()),
          backgroundColor: const Color(0xFFDC2626),
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final cart = context.watch<CartState>();
    final user = ApiService.cachedUser;
    final userName = user?['name'] ?? '';
    final userPhone = user?['phone'] ?? '';

    return Scaffold(
      backgroundColor: AppTheme.bgLight,
      appBar: AppBar(title: const Text('Checkout')),
      body: cart.isEmpty
          ? const Center(
              child: Text('Your cart is empty',
                  style: TextStyle(fontSize: 14, color: Color(0xFF6B7280))))
          : ListView(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 120),
              children: [
                // Delivery details
                const _SectionTitle(title: 'Delivery Details'),
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFFEEF1F0)),
                  ),
                  child: Column(
                    children: [
                      _InfoRow(icon: Icons.local_pharmacy, label: 'Pharmacy', value: cart.pharmacyName ?? ''),
                      const SizedBox(height: 10),
                      _InfoRow(icon: Icons.person_outline, label: 'Customer', value: userName),
                      const SizedBox(height: 10),
                      _InfoRow(icon: Icons.phone_outlined, label: 'Phone', value: userPhone),
                      const SizedBox(height: 10),
                      _InfoRow(icon: Icons.payments_outlined, label: 'Payment', value: 'Cash on delivery'),
                    ],
                  ),
                ),
                const SizedBox(height: 18),

                // Items
                const _SectionTitle(title: 'Delivery Address'),
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFFEEF1F0)),
                  ),
                  child: Column(
                    children: [
                      TextField(
                        controller: _addressController,
                        maxLines: 2,
                        maxLength: 500,
                        textInputAction: TextInputAction.next,
                        decoration: const InputDecoration(
                          hintText: 'Street, landmark, house/unit...',
                          labelText: 'Delivery address *',
                          fillColor: Color(0xFFF9FAFB),
                          counterText: '',
                        ),
                      ),
                      const SizedBox(height: 12),
                      TextField(
                        controller: _phoneController,
                        keyboardType: TextInputType.phone,
                        maxLength: 20,
                        textInputAction: TextInputAction.done,
                        decoration: const InputDecoration(
                          hintText: '+255 7xx xxx xxx',
                          labelText: 'Contact phone for delivery',
                          fillColor: Color(0xFFF9FAFB),
                          counterText: '',
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 18),

                // Items
                const _SectionTitle(title: 'Order Items'),
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFFEEF1F0)),
                  ),
                  child: Column(
                    children: [
                      ...cart.items.map((item) {
                        return Padding(
                          padding: const EdgeInsets.only(bottom: 10),
                          child: Row(
                            children: [
                              Expanded(
                                child: Text('${item.drug.name ?? 'Drug'} x${item.quantity}',
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(fontSize: 13, color: Color(0xFF111827))),
                              ),
                              Text(AppHelpers.formatTZS(item.total),
                                  style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: Color(0xFF111827))),
                            ],
                          ),
                        );
                      }),
                      SizedBox(height: 20),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Subtotal',
                            style: TextStyle(fontSize: 13, color: Color(0xFF6B7280))),
                        Text(AppHelpers.formatTZS(cart.subtotal),
                            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: Color(0xFF111827))),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Delivery',
                            style: TextStyle(fontSize: 13, color: Color(0xFF6B7280))),
                        const Text('To be agreed',
                            style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFF9CA3AF))),
                      ],
                    ),
                    SizedBox(height: 20),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Total',
                            style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: Color(0xFF111827))),
                        Text(AppHelpers.formatTZS(cart.subtotal),
                            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: AppTheme.primary)),
                      ],
                    ),
                  ],
                ),
                ),
                const SizedBox(height: 18),

                // Notes
                const _SectionTitle(title: 'Order Notes (optional)'),
                TextField(
                  controller: _notesController,
                  maxLines: 3,
                  maxLength: 1000,
                  decoration: const InputDecoration(
                    hintText: 'Add delivery instructions or notes for the pharmacy...',
                    fillColor: Colors.white,
                  ),
                ),
              ],
            ),
      bottomNavigationBar: cart.isEmpty
          ? null
          : Container(
              color: Colors.white,
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 16),
              child: SafeArea(
                top: false,
                child: SizedBox(
                  height: 52,
                  child: ElevatedButton(
                    onPressed: _placing ? null : _placeOrder,
                    style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primary),
                    child: _placing
                        ? const SizedBox(
                            width: 22,
                            height: 22,
                            child: CircularProgressIndicator(strokeWidth: 2, color: AppTheme.dark),
                          )
                        : const Text('Place Order',
                            style: TextStyle(color: AppTheme.dark, fontWeight: FontWeight.w700)),
                  ),
                ),
              ),
            ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  final String title;
  const _SectionTitle({required this.title});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Text(title,
          style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: Color(0xFF111827))),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  const _InfoRow({required this.icon, required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 16, color: AppTheme.primary),
        const SizedBox(width: 10),
        Text('$label:',
            style: const TextStyle(fontSize: 12, color: Color(0xFF9CA3AF))),
        const SizedBox(width: 8),
        Expanded(
          child: Text(value,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFF111827))),
        ),
      ],
    );
  }
}
