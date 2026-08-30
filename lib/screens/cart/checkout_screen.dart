import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/models.dart';
import '../../services/address_book_service.dart';
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
  final _paymentPhoneController = TextEditingController();
  bool _placing = false;
  String _paymentMethod = 'cash';

  @override
  void initState() {
    super.initState();
    final user = ApiService.cachedUser;
    _addressController.text = (user?['location'] ?? '').toString();
    _phoneController.text = (user?['phone'] ?? '').toString();
    _paymentPhoneController.text = (user?['phone'] ?? '').toString();
    _loadDefaultAddress();
  }

  Future<void> _loadDefaultAddress() async {
    final defaultAddress = await AddressBookService.getDefaultAddress();
    if (defaultAddress != null &&
        defaultAddress.isNotEmpty &&
        _addressController.text.trim().isEmpty) {
      if (!mounted) return;
      _addressController.text = defaultAddress;
    }
  }

  @override
  void dispose() {
    _addressController.dispose();
    _phoneController.dispose();
    _notesController.dispose();
    _paymentPhoneController.dispose();
    super.dispose();
  }

  String _normalizePhone(String phone) {
    return phone
        .replaceAll(' ', '')
        .replaceAll('+', '')
        .trim();
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

    if (_paymentMethod == 'mobile' && _paymentPhoneController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please enter your mobile money phone number'),
          backgroundColor: Color(0xFFDC2626),
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }

    final paymentPhone = _paymentMethod == 'mobile'
        ? _normalizePhone(_paymentPhoneController.text.trim())
        : null;

    setState(() => _placing = true);
    try {
      final data = await CustomerRepository.placeOrder(
        pharmacyId: pharmacyId,
        items: cart.items,
        deliveryAddress: _addressController.text.trim(),
        deliveryPhone: _phoneController.text.trim(),
        notes: _notesController.text.trim().isEmpty ? null : _notesController.text.trim(),
        paymentMethod: _paymentMethod,
        paymentPhone: paymentPhone,
      );
      final order = Order.fromJson(data);
      cart.clear();
      if (!mounted) return;

      if (_paymentMethod == 'mobile') {
        final payment = data['payment'];
        final pushInitiated = payment is Map && payment['push_initiated'] == true;
        if (pushInitiated) {
          await _showPushPaymentDialog(order);
          return;
        }
        // Push couldn't be initiated; pharmacy confirms manually.
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Pharmacy will confirm your payment manually'),
            backgroundColor: AppTheme.dark,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }

      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute(builder: (_) => OrderDetailScreen(orderId: order.id)),
        (route) => route.isFirst,
      );
    } catch (e) {
      if (!mounted) return;
      setState(() => _placing = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(ApiService.friendlyError(e)),
          backgroundColor: const Color(0xFFDC2626),
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  /// Shows a dialog while polling payment status every 5s until it reaches
  /// `paid` or `failed`.
  Future<void> _showPushPaymentDialog(Order order) async {
    final navigator = Navigator.of(context);
    var paid = false;

    Future<void> poll(BuildContext ctx) async {
      while (true) {
        try {
          final status = await CustomerRepository.paymentStatus(order.id);
          final paidStatus = status['status'] == 'paid';
          final failedStatus = status['status'] == 'failed';
          if (paidStatus || failedStatus) {
            paid = paidStatus;
            if (ctx.mounted) {
              navigator.pop();
            }
            return;
          }
        } catch (_) {
          // Ignore transient errors and keep polling.
        }
        await Future.delayed(const Duration(seconds: 5));
      }
    }

    await showDialog<void>(
      context: context,
      barrierDismissible: false,
      builder: (dialogContext) {
        // Kick off polling as soon as the dialog opens.
        poll(dialogContext);
        return AlertDialog(
          title: const Text('Complete Payment'),
          content: const Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text('Check your phone to complete the M-Pesa/USSD push payment'),
              SizedBox(height: 16),
              SizedBox(
                width: 22,
                height: 22,
                child: CircularProgressIndicator(strokeWidth: 2),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.of(dialogContext).pop();
              },
              child: const Text('Cancel'),
            ),
          ],
        );
      },
    );

    if (!mounted) return;
    if (paid) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Payment successful'),
          backgroundColor: AppTheme.dark,
          behavior: SnackBarBehavior.floating,
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Payment incomplete. The pharmacy will confirm your payment.'),
          backgroundColor: Color(0xFFD97706),
          behavior: SnackBarBehavior.floating,
        ),
      );
    }

    navigator.pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => OrderDetailScreen(orderId: order.id)),
      (route) => route.isFirst,
    );
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
                      _InfoRow(
                        icon: Icons.payments_outlined,
                        label: 'Payment',
                        value: _paymentMethod == 'cash'
                            ? 'Cash on Delivery'
                            : 'Mobile Money (M-Pesa)',
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 18),

                // Payment method selection
                const _SectionTitle(title: 'Payment Method'),
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFFEEF1F0)),
                  ),
                  child: Column(
                    children: [
                      _PaymentOption(
                        title: 'Cash on Delivery',
                        subtitle: 'Pay the pharmacy when your order arrives',
                        icon: Icons.payments_outlined,
                        selected: _paymentMethod == 'cash',
                        onTap: () => setState(() => _paymentMethod = 'cash'),
                      ),
                      const SizedBox(height: 10),
                      _PaymentOption(
                        title: 'Mobile Money (M-Pesa)',
                        subtitle: 'Pay instantly via mobile money push',
                        icon: Icons.phone_android,
                        selected: _paymentMethod == 'mobile',
                        onTap: () => setState(() => _paymentMethod = 'mobile'),
                      ),
                      if (_paymentMethod == 'mobile') ...[
                        const SizedBox(height: 14),
                        TextField(
                          controller: _paymentPhoneController,
                          keyboardType: TextInputType.phone,
                          maxLength: 20,
                          textInputAction: TextInputAction.done,
                          decoration: const InputDecoration(
                            hintText: '+255712345678',
                            labelText: 'Mobile money phone number *',
                            fillColor: Color(0xFFF9FAFB),
                            counterText: '',
                          ),
                        ),
                      ],
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
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
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
                              if ((item.drug.quantity ?? 0) <= 0)
                                const Padding(
                                  padding: EdgeInsets.only(top: 2),
                                  child: Text('May be out of stock',
                                      style: TextStyle(fontSize: 11, color: Colors.orange)),
                                ),
                            ],
                          ),
                        );
                      }),
                      const SizedBox(height: 20),
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
                        const Text('Calculated at confirmation',
                            style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFF9CA3AF))),
                      ],
                    ),
                    const SizedBox(height: 20),
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

class _PaymentOption extends StatelessWidget {
  final String title;
  final String subtitle;
  final IconData icon;
  final bool selected;
  final VoidCallback onTap;
  const _PaymentOption({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: const Color(0xFFF9FAFB),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: selected ? AppTheme.primary : const Color(0xFFEEF1F0),
            width: selected ? 1.5 : 1,
          ),
        ),
        child: Row(
          children: [
            Icon(icon, size: 20, color: AppTheme.primary),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title,
                      style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: Color(0xFF111827))),
                  const SizedBox(height: 2),
                  Text(subtitle,
                      style: const TextStyle(fontSize: 11, color: Color(0xFF6B7280))),
                ],
              ),
            ),
            Icon(
              selected ? Icons.radio_button_checked : Icons.radio_button_off,
              size: 20,
              color: selected ? AppTheme.primary : const Color(0xFF9CA3AF),
            ),
          ],
        ),
      ),
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
