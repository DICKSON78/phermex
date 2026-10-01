import 'package:flutter/material.dart';
import '../l10n/app_localizations.dart';
import '../theme.dart';

enum AppTab { home, orders, call, rx, settings }

/// Bottom nav with a raised green Call button in the middle, matching the
/// pharmacy app screenshots. Pass [current] for the active tab and
/// [onTap] to handle navigation.
class AppBottomNav extends StatelessWidget {
  final AppTab current;
  final ValueChanged<AppTab> onTap;

  const AppBottomNav({super.key, required this.current, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final L = AppLocalizations.of(context);
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Color(0x14000000),
            blurRadius: 12,
            offset: Offset(0, -2),
          ),
        ],
        borderRadius: BorderRadius.only(
          topLeft: Radius.circular(24),
          topRight: Radius.circular(24),
        ),
      ),
      padding: const EdgeInsets.fromLTRB(16, 10, 16, 22),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          _NavItem(
            icon: Icons.home_rounded,
            label: L.t('home'),
            active: current == AppTab.home,
            onTap: () => onTap(AppTab.home),
          ),
          _NavItem(
            icon: Icons.receipt_long_rounded,
            label: L.t('orders'),
            active: current == AppTab.orders,
            onTap: () => onTap(AppTab.orders),
          ),
          Expanded(
            child: SizedBox(
              height: 40,
              child: Stack(
                clipBehavior: Clip.none,
                alignment: Alignment.bottomCenter,
                children: [
                  Positioned(
                    top: -28,
                    child: GestureDetector(
                      onTap: () => onTap(AppTab.call),
                      child: Container(
                        width: 44,
                        height: 44,
                        decoration: BoxDecoration(
                          color: AppColors.brand600,
                          shape: BoxShape.circle,
                          border: Border.all(color: Colors.white, width: 3),
                          boxShadow: [
                            BoxShadow(
                              color: AppColors.brand600.withValues(alpha: 0.4),
                              blurRadius: 16,
                              offset: const Offset(0, 8),
                            ),
                          ],
                        ),
                        child: const Icon(Icons.call_rounded, color: Colors.white, size: 18),
                      ),
                    ),
                  ),
                  Text(
                    L.t('call'),
                    style: const TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w700,
                      color: AppColors.brand700,
                      fontFamily: 'Poppins',
                    ),
                  ),
                ],
              ),
            ),
          ),
          _NavItem(
            icon: Icons.description_outlined,
            label: L.t('rx'),
            active: current == AppTab.rx,
            onTap: () => onTap(AppTab.rx),
          ),
          _NavItem(
            icon: Icons.settings_outlined,
            label: L.t('settings'),
            active: current == AppTab.settings,
            onTap: () => onTap(AppTab.settings),
          ),
        ],
      ),
    );
  }
}

class _NavItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool active;
  final VoidCallback onTap;

  const _NavItem({
    required this.icon,
    required this.label,
    required this.active,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final color = active ? AppColors.brand700 : AppColors.muted;
    return Expanded(
      child: InkWell(
        onTap: onTap,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 19, color: color),
            const SizedBox(height: 5),
            Text(
              label,
              style: TextStyle(
                fontSize: 10,
                fontWeight: active ? FontWeight.w700 : FontWeight.w500,
                color: color,
                fontFamily: 'Poppins',
              ),
            ),
          ],
        ),
      ),
    );
  }
}