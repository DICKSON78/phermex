import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../l10n/app_localizations.dart';
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
  bool _placing = false;
  String _paymentMethod = 'cash';

  @override
  void initState() {
    super.initState();
    final user = ApiService.cachedUser;
    _addressController.text = (user?['location'] ?? '').toString();
    _phoneController.text = (user?['phone'] ?? '').toString();
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
    super.dispose();
  }

  Future<void> _placeOrder() async {
    final cart = context.read<CartState>();
    final pharmacyId = cart.pharmacyId;
    if (pharmacyId == null || cart.isEmpty) return;

    if (_addressController.text.trim().isEmpty) {
      final L = AppLocalizations.of(context);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(L.t('shop.enterDeliveryAddress')),
          backgroundColor: const Color(0xFFDC2626),
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }


    setState(() => _placing = true);
    try {
      final data = await CustomerRepository.placeOrder(
        pharmacyId: pharmacyId,
        items: cart.items,
        deliveryAddress: _addressController.text.trim(),
        deliveryPhone: _phoneController.text.trim(),
        notes: _notesController.text.trim().isEmpty ? null : _notesController.text.trim(),
        paymentMethod: _paymentMethod,
      );
      final order = Order.fromJson(data);
      cart.clear();
      if (!mounted) return;

      final navigator = Navigator.of(context);

      if (_paymentMethod == 'mobile') {
        // The money went to the pharmacy, not to us, so there is nothing to
        // poll. Show the customer where to send it and hand them to the order.
        if (!mounted) return;
        await _showPayPharmacyModal(order, data['payment']);
        if (!mounted) return;
      }

      navigator.pushAndRemoveUntil(
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

  /// Shows the pharmacy's own account so the customer can pay it directly,
  /// then hands them to the order screen to follow the confirmation.
  Future<void> _showPayPharmacyModal(Order order, dynamic payment) async {
    final L = AppLocalizations.of(context);
    final number = payment is Map ? payment['pharmacy_payment_number'] as String? : null;
    final name = payment is Map ? payment['pharmacy_payment_name'] as String? : null;

    // The pharmacy can decline to publish a number, in which case there is
    // nothing to pay into and the customer must not think otherwise.
    if (number == null || number.trim().isEmpty) {
      await showDialog<void>(
        context: context,
        barrierDismissible: false,
        builder: (ctx) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          contentPadding: const EdgeInsets.fromLTRB(24, 26, 24, 8),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const _ResultBadge(
                icon: Icons.info_outline_rounded,
                color: Color(0xFFB9762A),
                background: Color(0xFFFDF1E2),
              ),
              const SizedBox(height: 16),
              Text(
                L.t('shop.paymentSentTitle'),
                style: const TextStyle(fontSize: 16.5, fontWeight: FontWeight.w700),
              ),
              const SizedBox(height: 8),
              Text(
                L.t('shop.noPaymentNumberOnFile'),
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 13.5, color: Color(0xFF6B7280), height: 1.45),
              ),
            ],
          ),
          actions: [
            SizedBox(
              width: double.infinity,
              child: FilledButton(
                onPressed: () => Navigator.of(ctx).pop(),
                style: FilledButton.styleFrom(
                  backgroundColor: AppTheme.primary,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: Text(L.t('shop.viewOrder')),
              ),
            ),
          ],
          actionsPadding: const EdgeInsets.fromLTRB(24, 8, 24, 20),
        ),
      );
      return;
    }

    await showDialog<void>(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        contentPadding: const EdgeInsets.fromLTRB(24, 26, 24, 8),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const _ResultBadge(
              icon: Icons.savings_outlined,
              color: Color(0xFF16A34A),
              background: Color(0xFFE7F7EC),
            ),
            const SizedBox(height: 16),
            Text(
              L.t('shop.paymentSentTitle'),
              style: const TextStyle(fontSize: 16.5, fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 8),
            Text(
              L.t('shop.payPharmacyDirectBody'),
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 13.5, color: Color(0xFF6B7280), height: 1.45),
            ),
            const SizedBox(height: 18),
            _PayToAccountPanel(number: number, name: name, total: order.total),
            const SizedBox(height: 14),
            _OrderSummaryStrip(order: order),
          ],
        ),
        actions: [
          SizedBox(
            width: double.infinity,
            child: FilledButton(
              onPressed: () => Navigator.of(ctx).pop(),
              style: FilledButton.styleFrom(
                backgroundColor: AppTheme.primary,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: Text(L.t('shop.viewOrder')),
            ),
          ),
        ],
        actionsPadding: const EdgeInsets.fromLTRB(24, 8, 24, 20),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final L = AppLocalizations.of(context);
    final cart = context.watch<CartState>();
    final user = ApiService.cachedUser;
    final userName = user?['name'] ?? '';
    final userPhone = user?['phone'] ?? '';

    return Scaffold(
      backgroundColor: AppTheme.bgLight,
      appBar: AppBar(title: Text(L.t('shop.checkout'))),
      body: cart.isEmpty
          ? Center(
              child: Text(L.t('shop.yourCartIsEmpty'),
                  style: const TextStyle(fontSize: 14, color: Color(0xFF6B7280))))
          : ListView(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 120),
              children: [
                // Delivery details
                _SectionTitle(title: L.t('shop.deliveryDetails')),
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFFEEF1F0)),
                  ),
                  child: Column(
                    children: [
                      _InfoRow(icon: Icons.local_pharmacy, label: L.t('shop.pharmacy'), value: cart.pharmacyName ?? ''),
                      const SizedBox(height: 10),
                      _InfoRow(icon: Icons.person_outline, label: L.t('shop.customer'), value: userName),
                      const SizedBox(height: 10),
                      _InfoRow(icon: Icons.phone_outlined, label: L.t('shop.phone'), value: userPhone),
                      const SizedBox(height: 10),
                      _InfoRow(
                        icon: Icons.payments_outlined,
                        label: L.t('shop.payment'),
                        value: _paymentMethod == 'cash'
                            ? L.t('shop.cashOnDelivery')
                            : L.t('shop.mobileMoney'),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 18),

                // Payment method selection
                _SectionTitle(title: L.t('shop.paymentMethod')),
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
                        title: L.t('shop.cashOnDelivery'),
                        subtitle: L.t('shop.payOnArrival'),
                        icon: Icons.payments_outlined,
                        selected: _paymentMethod == 'cash',
                        onTap: () => setState(() => _paymentMethod = 'cash'),
                      ),
                      const SizedBox(height: 10),
                      _PaymentOption(
                        title: L.t('shop.payPharmacyDirect'),
                        subtitle: L.t('shop.pharmacyWillConfirm'),
                        icon: Icons.phone_android,
                        selected: _paymentMethod == 'mobile',
                        onTap: () => setState(() => _paymentMethod = 'mobile'),
                      ),
                      if (_paymentMethod == 'mobile') ...[
                        const SizedBox(height: 12),
                        Container(
                          padding: const EdgeInsets.all(13),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF6F8F7),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: const Color(0xFFE7EBE6)),
                          ),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Icon(Icons.info_outline_rounded,
                                  size: 17, color: AppTheme.textMuted),
                              const SizedBox(width: 9),
                              Expanded(
                                child: Text(
                                  L.t('shop.payPharmacyDirectBody'),
                                  style: const TextStyle(
                                      fontSize: 12.5, color: AppTheme.textMuted, height: 1.4),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
                const SizedBox(height: 18),

                // Items
                _SectionTitle(title: L.t('shop.deliveryAddress')),
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
                        decoration: InputDecoration(
                          hintText: L.t('shop.streetLandmarkHint'),
                          labelText: L.t('shop.deliveryAddressRequired'),
                          fillColor: const Color(0xFFF9FAFB),
                          counterText: '',
                        ),
                      ),
                      const SizedBox(height: 12),
                      TextField(
                        controller: _phoneController,
                        keyboardType: TextInputType.phone,
                        maxLength: 20,
                        textInputAction: TextInputAction.done,
                        decoration: InputDecoration(
                          hintText: '+255 7xx xxx xxx',
                          labelText: L.t('shop.contactPhoneDelivery'),
                          fillColor: const Color(0xFFF9FAFB),
                          counterText: '',
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 18),

                // Items
                _SectionTitle(title: L.t('shop.orderItems')),
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
                                    child: Text('${item.drug.name ?? L.t('shop.drug')} x${item.quantity}',
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                        style: const TextStyle(fontSize: 13, color: Color(0xFF111827))),
                                  ),
                                  Text(AppHelpers.formatTZS(item.total),
                                      style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: Color(0xFF111827))),
                                ],
                              ),
                              if ((item.drug.quantity ?? 0) <= 0)
                                Padding(
                                  padding: const EdgeInsets.only(top: 2),
                                  child: Text(L.t('shop.mayBeOutOfStock'),
                                      style: const TextStyle(fontSize: 11, color: Colors.orange)),
                                ),
                            ],
                          ),
                        );
                      }),
                      const SizedBox(height: 20),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(L.t('shop.subtotal'),
                            style: const TextStyle(fontSize: 13, color: Color(0xFF6B7280))),
                        Text(AppHelpers.formatTZS(cart.subtotal),
                            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: Color(0xFF111827))),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(L.t('shop.delivery'),
                            style: const TextStyle(fontSize: 13, color: Color(0xFF6B7280))),
                        Text(L.t('shop.calculatedAtConfirmation'),
                            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFF9CA3AF))),
                      ],
                    ),
                    const SizedBox(height: 20),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(L.t('shop.total'),
                            style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: Color(0xFF111827))),
                        Text(AppHelpers.formatTZS(cart.subtotal),
                            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: AppTheme.primary)),
                      ],
                    ),
                  ],
                ),
                ),
                const SizedBox(height: 18),

                // Notes
                _SectionTitle(title: L.t('shop.orderNotesOptional')),
                TextField(
                  controller: _notesController,
                  maxLines: 3,
                  maxLength: 1000,
                  decoration: InputDecoration(
                    hintText: L.t('shop.notesHint'),
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
                            child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                          )
                        : Text(L.t('shop.placeOrder'),
                            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
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

/// Coloured circle behind the tick or cross in the result modal.
class _ResultBadge extends StatelessWidget {
  const _ResultBadge({required this.icon, required this.color, required this.background});

  final IconData icon;
  final Color color;
  final Color background;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 64,
      height: 64,
      decoration: BoxDecoration(color: background, shape: BoxShape.circle),
      child: Icon(icon, color: color, size: 34),
    );
  }
}

/// Order code and total, so the modal confirms which order it refers to.
class _OrderSummaryStrip extends StatelessWidget {
  const _OrderSummaryStrip({required this.order});

  final Order order;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: const Color(0xFFF6F8F7),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE7EBE6)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            order.orderCode ?? '#${order.id}',
            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFF0D211A)),
          ),
          Text(
            AppHelpers.formatTZS(order.total),
            style: const TextStyle(fontSize: 14.5, fontWeight: FontWeight.w700, color: Color(0xFF16A34A)),
          ),
        ],
      ),
    );
  }
}

/// The pharmacy's own account, with the number tappable so the customer can
/// copy or dial it straight from the modal.
class _PayToAccountPanel extends StatelessWidget {
  const _PayToAccountPanel({required this.number, required this.name, required this.total});

  final String number;
  final String? name;
  final double total;

  @override
  Widget build(BuildContext context) {
    final L = AppLocalizations.of(context);
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(16, 14, 10, 14),
      decoration: BoxDecoration(
        color: const Color(0xFFF6F8F7),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFE7EBE6)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            L.t('shop.pharmacyMobileMoney'),
            style: const TextStyle(
                fontSize: 11.5, fontWeight: FontWeight.w600, color: AppTheme.textMuted),
          ),
          const SizedBox(height: 7),
          Row(
            children: [
              Expanded(
                child: Text(
                  number,
                  style: const TextStyle(
                      fontSize: 19, fontWeight: FontWeight.w700, letterSpacing: 0.4),
                ),
              ),
              IconButton(
                onPressed: () async {
                  await Clipboard.setData(ClipboardData(text: number));
                  if (!context.mounted) return;
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text(L.t('shop.copied')),
                      behavior: SnackBarBehavior.floating,
                      duration: const Duration(seconds: 2),
                    ),
                  );
                },
                icon: const Icon(Icons.copy_rounded, size: 19),
                tooltip: L.t('shop.copyNumber'),
                visualDensity: VisualDensity.compact,
              ),
            ],
          ),
          if (name != null && name!.trim().isNotEmpty) ...[
            const SizedBox(height: 4),
            Text(
              name!,
              style: const TextStyle(fontSize: 12.5, color: AppTheme.textMuted),
            ),
          ],
          const SizedBox(height: 11),
          Divider(height: 1, color: const Color(0xFFE7EBE6)),
          const SizedBox(height: 11),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                L.t('shop.amountToSend'),
                style: const TextStyle(fontSize: 12.5, color: AppTheme.textMuted),
              ),
              Text(
                AppHelpers.formatTZS(total),
                style: const TextStyle(
                    fontSize: 15.5, fontWeight: FontWeight.w700, color: Color(0xFF16A34A)),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
