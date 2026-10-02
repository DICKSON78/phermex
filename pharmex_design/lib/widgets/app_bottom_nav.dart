import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

enum AppTab { home, orders, call, rx, me }

/// Bottom nav with a raised green Call button in the middle, matching the
/// pharmacy app screenshots. Pass [current] for the active tab and
/// [onTap] to handle navigation.
class AppBottomNav extends StatelessWidget {
  final AppTab current;
  final ValueChanged<AppTab> onTap;

  const AppBottomNav({super.key, required this.current, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: AppColors.line)),
      ),
      padding: const EdgeInsets.fromLTRB(16, 10, 16, 22),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          _NavItem(
            icon: Icons.home_rounded,
            label: 'Home',
            active: current == AppTab.home,
            onTap: () => onTap(AppTab.home),
          ),
          _NavItem(
            icon: Icons.receipt_long_rounded,
            label: 'Orders',
            active: current == AppTab.orders,
            onTap: () => onTap(AppTab.orders),
          ),
          Expanded(
            child: Column(
              children: [
                GestureDetector(
                  onTap: () => onTap(AppTab.call),
                  child: Container(
                    width: 60,
                    height: 60,
                    margin: const EdgeInsets.only(top: -32),
                    decoration: BoxDecoration(
                      color: AppColors.brand600,
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.brand600.withOpacity(0.45),
                          blurRadius: 24,
                          offset: const Offset(0, 10),
                        ),
                      ],
                    ),
                    child: const Icon(Icons.call_rounded, color: Colors.white, size: 24),
                  ),
                ),
                const SizedBox(height: 5),
                Text(
                  'Call',
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                    color: AppColors.brand700,
                  ),
                ),
              ],
            ),
          ),
          _NavItem(
            icon: Icons.description_outlined,
            label: 'Rx',
            active: current == AppTab.rx,
            onTap: () => onTap(AppTab.rx),
          ),
          _NavItem(
            icon: Icons.person_outline_rounded,
            label: 'Me',
            active: current == AppTab.me,
            onTap: () => onTap(AppTab.me),
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
              ),
            ),
          ],
        ),
      ),
    );
  }
}
