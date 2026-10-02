import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

class DrawerMenuItem {
  final IconData icon;
  final String label;
  final String? badge;
  final bool destructive;

  const DrawerMenuItem({
    required this.icon,
    required this.label,
    this.badge,
    this.destructive = false,
  });
}

/// Sidebar navigation drawer — dark gradient profile header + grouped
/// menu (Menu / Support) + footer version label, matching the mockup.
///
/// Usage:
///   Scaffold(
///     drawer: AppNavDrawer(
///       name: 'Test Customer',
///       email: 'customer@pharmex.com',
///       customerId: 'CUS-TEST01',
///       activeIndex: 0,
///       onSelect: (i) { ... },
///     ),
///     ...
///   )
class AppNavDrawer extends StatelessWidget {
  final String name;
  final String email;
  final String customerId;
  final int notificationCount;
  final int activeIndex;
  final ValueChanged<int>? onSelect;
  final VoidCallback? onLogout;
  final String versionLabel;

  const AppNavDrawer({
    super.key,
    required this.name,
    required this.email,
    required this.customerId,
    this.notificationCount = 0,
    this.activeIndex = 0,
    this.onSelect,
    this.onLogout,
    this.versionLabel = 'Pharmex v2.4.0',
  });

  static const _menuItems = [
    DrawerMenuItem(icon: Icons.home_rounded, label: 'Home'),
    DrawerMenuItem(icon: Icons.receipt_long_rounded, label: 'My Orders'),
    DrawerMenuItem(icon: Icons.videocam_rounded, label: 'Telemedicine'),
    DrawerMenuItem(icon: Icons.description_rounded, label: 'My Prescriptions'),
    DrawerMenuItem(icon: Icons.notifications_none_rounded, label: 'Notifications'),
    DrawerMenuItem(icon: Icons.location_on_outlined, label: 'Saved Addresses'),
    DrawerMenuItem(icon: Icons.health_and_safety_outlined, label: 'Health Insurance'),
    DrawerMenuItem(icon: Icons.stars_rounded, label: 'Loyalty & Rewards'),
  ];

  static const _supportItems = [
    DrawerMenuItem(icon: Icons.help_outline_rounded, label: 'Help & Support'),
    DrawerMenuItem(icon: Icons.settings_outlined, label: 'Settings'),
  ];

  @override
  Widget build(BuildContext context) {
    return Drawer(
      width: MediaQuery.of(context).size.width * 0.8,
      backgroundColor: Colors.white,
      child: SafeArea(
        child: Column(
          children: [
            _ProfileHeader(name: name, email: email, customerId: customerId),
            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                children: [
                  const _SectionLabel('MENU'),
                  ...List.generate(_menuItems.length, (i) {
                    final item = _menuItems[i];
                    final badge = item.label == 'Notifications' && notificationCount > 0
                        ? '$notificationCount'
                        : item.badge;
                    return _DrawerTile(
                      item: item,
                      badge: badge,
                      active: i == activeIndex,
                      onTap: () {
                        Navigator.of(context).pop(); // close drawer
                        onSelect?.call(i);
                      },
                    );
                  }),
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 8),
                    child: Divider(height: 1, color: AppColors.line),
                  ),
                  const _SectionLabel('SUPPORT'),
                  ..._supportItems.map((item) => _DrawerTile(
                        item: item,
                        onTap: () => Navigator.of(context).pop(),
                      )),
                  _DrawerTile(
                    item: const DrawerMenuItem(
                      icon: Icons.logout_rounded,
                      label: 'Log Out',
                      destructive: true,
                    ),
                    onTap: () {
                      Navigator.of(context).pop();
                      onLogout?.call();
                    },
                  ),
                ],
              ),
            ),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 14),
              decoration: const BoxDecoration(
                border: Border(top: BorderSide(color: AppColors.line)),
              ),
              child: Text(
                versionLabel,
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 10, color: AppColors.muted),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ProfileHeader extends StatelessWidget {
  final String name;
  final String email;
  final String customerId;
  const _ProfileHeader({required this.name, required this.email, required this.customerId});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 22),
      decoration: const BoxDecoration(gradient: AppColors.darkHeaderGradient),
      child: Row(
        children: [
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: Colors.white.withOpacity(0.1),
              border: Border.all(color: Colors.white.withOpacity(0.3), width: 1.5),
            ),
            alignment: Alignment.center,
            child: Text(
              name.isNotEmpty ? name[0] : '?',
              style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w800),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(name,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.w800)),
                Text(email,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(color: Colors.white.withOpacity(0.55), fontSize: 11.5)),
                const SizedBox(height: 4),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(99),
                  ),
                  child: Text('ID: $customerId',
                      style: const TextStyle(
                          color: Colors.white, fontSize: 9.5, fontWeight: FontWeight.w700)),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _SectionLabel extends StatelessWidget {
  final String text;
  const _SectionLabel(this.text);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(12, 4, 12, 8),
      child: Text(
        text,
        style: const TextStyle(fontSize: 10.5, fontWeight: FontWeight.w700, color: AppColors.muted),
      ),
    );
  }
}

class _DrawerTile extends StatelessWidget {
  final DrawerMenuItem item;
  final String? badge;
  final bool active;
  final VoidCallback onTap;

  const _DrawerTile({
    required this.item,
    required this.onTap,
    this.badge,
    this.active = false,
  });

  @override
  Widget build(BuildContext context) {
    final color = item.destructive
        ? const Color(0xFFC0392B)
        : (active ? AppColors.brand700 : AppColors.ink);

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        margin: const EdgeInsets.only(bottom: 2),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
        decoration: BoxDecoration(
          color: active ? AppColors.mint50 : Colors.transparent,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          children: [
            Icon(item.icon, size: 18, color: color),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                item.label,
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: active ? FontWeight.w700 : FontWeight.w600,
                  color: color,
                ),
              ),
            ),
            if (badge != null)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: AppColors.brand600,
                  borderRadius: BorderRadius.circular(99),
                ),
                child: Text(badge!,
                    style: const TextStyle(
                        fontSize: 9.5, fontWeight: FontWeight.w700, color: Colors.white)),
              )
            else if (active)
              Container(
                width: 6,
                height: 6,
                decoration: const BoxDecoration(color: AppColors.brand600, shape: BoxShape.circle),
              ),
          ],
        ),
      ),
    );
  }
}
