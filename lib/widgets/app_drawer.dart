import 'package:flutter/material.dart';
import '../l10n/app_localizations.dart';
import '../models/models.dart';
import '../services/api_service.dart';
import '../services/customer_repository.dart';
import '../screens/orders/delivery_tracking_screen.dart';
import '../screens/orders/orders_list_screen.dart';
import '../screens/profile/address_book_screen.dart';
import '../screens/insurance/insurance_screen.dart';
import '../screens/loyalty/loyalty_screen.dart';
import '../screens/support/support_screen.dart';
import '../screens/chatbot/chatbot_screen.dart';
import '../screens/auth/login_screen.dart';
import '../theme.dart';

class AppDrawer extends StatelessWidget {
  const AppDrawer({super.key});

  @override
  Widget build(BuildContext context) {
    final name = (ApiService.userName ?? '').trim();
    final email = (ApiService.userEmail ?? '').trim();
    final topPad = MediaQuery.of(context).padding.top;
    final L = AppLocalizations.of(context);

    return Drawer(
      width: MediaQuery.of(context).size.width * 0.8,
      backgroundColor: Colors.white,
      child: Column(
        children: [
          Container(
            width: double.infinity,
            padding: EdgeInsets.fromLTRB(20, topPad + 16, 20, 22),
            decoration: const BoxDecoration(gradient: AppColors.darkHeaderGradient),
            child: Row(
              children: [
                CircleAvatar(
                  radius: 26,
                  backgroundColor: Colors.white.withAlpha(31),
                  child: Text(
                    name.isNotEmpty ? name[0] : '?',
                    style: const TextStyle(
                        color: Colors.white, fontSize: 20, fontWeight: FontWeight.w800),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        name.isEmpty ? L.t('myAccount') : name,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                            color: Colors.white,
                            fontSize: 15.5,
                            fontWeight: FontWeight.w800),
                      ),
                      if (email.isNotEmpty) ...[
                        const SizedBox(height: 2),
                        Text(
                          email,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                              color: Colors.white.withAlpha(140), fontSize: 11.5),
                        ),
                      ],
                    ],
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: ListView(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
              children: [
                _DrawerTile(
                  icon: Icons.navigation_rounded,
                  label: L.t('trackLiveOrder'),
                  onTap: () => _trackLiveOrder(context),
                ),
                _DrawerTile(
                  icon: Icons.location_on_outlined,
                  label: L.t('savedAddresses'),
                  onTap: () => _push(context, const AddressBookScreen()),
                ),
                _DrawerTile(
                  icon: Icons.health_and_safety_outlined,
                  label: L.t('healthInsurance'),
                  onTap: () => _push(context, const InsuranceScreen()),
                ),
                _DrawerTile(
                  icon: Icons.stars_rounded,
                  label: L.t('loyaltyRewards'),
                  onTap: () => _push(context, const LoyaltyScreen()),
                ),
                const Padding(
                  padding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  child: Divider(height: 1, color: AppColors.line),
                ),
                _DrawerTile(
                  icon: Icons.smart_toy_outlined,
                  label: L.t('chatAssistant'),
                  onTap: () => _push(context, const ChatbotScreen()),
                ),
                _DrawerTile(
                  icon: Icons.help_outline_rounded,
                  label: L.t('helpSupport'),
                  onTap: () => _push(context, const SupportScreen()),
                ),
                const SizedBox(height: 8),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  child: InkWell(
                    onTap: () {
                      Navigator.pop(context);
                      _confirmLogout(context);
                    },
                    borderRadius: BorderRadius.circular(12),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                      child: Row(
                        children: [
                          const Icon(Icons.logout_rounded, size: 18, color: Color(0xFFC0392B)),
                          const SizedBox(width: 12),
                          Text(
                            L.t('logOut'),
                            style: const TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                                color: Color(0xFFC0392B)),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  void _push(BuildContext context, Widget screen) {
    Navigator.pop(context);
    Navigator.of(context).push(MaterialPageRoute(builder: (_) => screen));
  }

  Future<void> _trackLiveOrder(BuildContext context) async {
    Navigator.pop(context);
    try {
      final orders = await CustomerRepository.myOrders();
      Order? active;
      for (final o in orders) {
        final s = (o.orderStatus ?? '').toLowerCase();
        if (s == 'processing' || s == 'shipped' || s == 'in_transit') {
          active = o;
          break;
        }
      }
      if (active == null) {
        if (!context.mounted) return;
        Navigator.of(context).push(
          MaterialPageRoute(builder: (_) => const OrdersListScreen()),
        );
        return;
      }
      if (!context.mounted) return;
      Navigator.of(context).push(
        MaterialPageRoute(
          builder: (_) => DeliveryTrackingScreen(orderId: active!.id),
        ),
      );
    } catch (e) {
      if (!context.mounted) return;
      final L = AppLocalizations.of(context);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(L.t('couldNotLoadOrder'), style: const TextStyle(fontFamily: 'Poppins'))),
      );
      Navigator.of(context).push(
        MaterialPageRoute(builder: (_) => const OrdersListScreen()),
      );
    }
  }

  Future<void> _confirmLogout(BuildContext context) async {
    final L = AppLocalizations.of(context);
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(L.t('logOut'), style: const TextStyle(fontFamily: 'Poppins')),
        content: Text(L.t('logoutConfirm'),
            style: const TextStyle(fontFamily: 'Poppins')),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: Text(L.t('cancel'), style: const TextStyle(fontFamily: 'Poppins'))),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: Text(L.t('logOut'),
                style: const TextStyle(color: Color(0xFFDC2626), fontFamily: 'Poppins')),
          ),
        ],
      ),
    );
    if (confirmed != true) return;
    try {
      await ApiService.post('/logout', {});
    } catch (_) {}
    await ApiService.logout();
    if (!context.mounted) return;
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => const LoginScreen()),
      (route) => route.isFirst,
    );
  }
}

class _DrawerTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  const _DrawerTile({required this.icon, required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
        child: Row(
          children: [
            Icon(icon, size: 18, color: AppColors.ink),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                label,
                style: const TextStyle(
                    fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.ink),
              ),
            ),
            const Icon(Icons.chevron_right_rounded, size: 18, color: AppColors.muted),
          ],
        ),
      ),
    );
  }
}