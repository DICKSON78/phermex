import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../theme.dart';
import '../services/api_service.dart';
import '../widgets/offline_banner.dart';
import 'home/home_screen.dart';
import 'orders/orders_list_screen.dart';
import 'prescriptions/prescriptions_screen.dart';
import 'telemedicine/telemedicine_screen.dart';
import 'profile/profile_screen.dart';

class HomeShell extends StatefulWidget {
  const HomeShell({super.key});

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int _index = 0;
  int _unreadNotifications = 0;
  int _homeRefreshTick = 0;
  int _ordersRefreshTick = 0;

  static const _tabs = [
    (icon: Icons.home_outlined, activeIcon: Icons.home, label: 'Home'),
    (icon: Icons.receipt_long_outlined, activeIcon: Icons.receipt_long, label: 'Orders'),
    (icon: Icons.call, activeIcon: Icons.call, label: 'Call'),
    (icon: Icons.description_outlined, activeIcon: Icons.description, label: 'Rx'),
    (icon: Icons.person_outline, activeIcon: Icons.person, label: 'Me'),
  ];

  // The "Call" (telemedicine) button sits in the center, raised above the bar.
  static const _isCallTab = 2;

  @override
  void initState() {
    super.initState();
    _loadUnreadCount();
  }

  Future<void> _loadUnreadCount() async {
    try {
      final data = await ApiService.get('/customer-app/notifications/unread-count');
      if (!mounted) return;
      setState(() {
        _unreadNotifications = data is Map ? (data['unread_count'] ?? 0) : 0;
      });
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    final screens = [
      HomeScreen(unreadNotifications: _unreadNotifications, refreshTick: _homeRefreshTick),
      OrdersListScreen(refreshTick: _ordersRefreshTick),
      const TelemedicineScreen(),
      const PrescriptionsScreen(),
      const ProfileScreen(),
    ];
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: const SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: Brightness.dark,
        statusBarBrightness: Brightness.light,
        systemNavigationBarColor: Colors.white,
        systemNavigationBarIconBrightness: Brightness.dark,
      ),
      child: Scaffold(
        body: Column(
          children: [
            OfflineBanner(),
            Expanded(
              child: IndexedStack(index: _index, children: screens),
            ),
          ],
        ),
        bottomNavigationBar: _CurvedBottomNav(
          currentIndex: _index,
          unreadNotifications: _unreadNotifications,
          onTap: (i) {
            setState(() {
              _index = i;
              if (i == 0) _homeRefreshTick++;
              if (i == 1) _ordersRefreshTick++;
            });
            Future.delayed(const Duration(milliseconds: 200), () {
              if (mounted) _loadUnreadCount();
            });
          },
        ),
      ),
    );
  }
}

// ---- Curved bottom navigation ----------------------------------------------
// Classic curved bar: a floating white bar with a notch carved in the center
// where the raised "Call" button sits. The center tab is rendered separately.
class _CurvedBottomNav extends StatelessWidget {
  final int currentIndex;
  final int unreadNotifications;
  final ValueChanged<int> onTap;
  const _CurvedBottomNav({
    required this.currentIndex,
    required this.unreadNotifications,
    required this.onTap,
  });

  static const _notchRadius = 34.0;

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.paddingOf(context).bottom;
    // Indexes are: 0 Home | 1 Orders | [2 Call center] | 3 Rx | 4 Me
    final leftTabs = [0, 1];
    final rightTabs = [3, 4];
    final centerTab = _HomeShellState._isCallTab;
    final active = currentIndex == centerTab;

    return Container(
      height: 70 + bottomInset + 24,
      color: Colors.transparent,
      child: Stack(
        clipBehavior: Clip.none,
        alignment: Alignment.topCenter,
        children: [
          // Curved bar with notch
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            height: 70 + bottomInset,
            child: ClipPath(
              clipper: _CurvedBarClipper(notchRadius: _notchRadius),
              child: Container(
                color: Colors.white,
                child: SafeArea(
                  top: false,
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      ...leftTabs.map((i) =>
                          Expanded(child: _NavItem(
                            tab: _HomeShellState._tabs[i],
                            active: currentIndex == i,
                            unreadNotifications: i == 0 ? unreadNotifications : 0,
                            onTap: () => onTap(i),
                          ))),
                      const SizedBox(width: _notchRadius * 2 + 18),
                      ...rightTabs.map((i) =>
                          Expanded(child: _NavItem(
                            tab: _HomeShellState._tabs[i],
                            active: currentIndex == i,
                            unreadNotifications: 0,
                            onTap: () => onTap(i),
                          ))),
                    ],
                  ),
                ),
              ),
            ),
          ),
          // Raised center "Call" button
          Positioned(
            top: -2,
            child: GestureDetector(
              onTap: () => onTap(centerTab),
              child: AnimatedScale(
                duration: const Duration(milliseconds: 150),
                scale: active ? 1.05 : 1,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 58,
                      height: 58,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: const LinearGradient(
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                          colors: [AppTheme.primary, AppTheme.primaryDark],
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: AppTheme.primary.withValues(alpha: 0.35),
                            blurRadius: 14,
                            offset: const Offset(0, 6),
                          ),
                        ],
                      ),
                      child: const Icon(Icons.call, size: 26, color: Colors.white),
                    ),
                    const SizedBox(height: 2),
                    const Text('Call',
                        style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w700,
                            color: AppTheme.primaryDark)),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _NavItem extends StatelessWidget {
  final ({IconData icon, IconData activeIcon, String label}) tab;
  final bool active;
  final int unreadNotifications;
  final VoidCallback onTap;
  const _NavItem({
    required this.tab,
    required this.active,
    required this.unreadNotifications,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: onTap,
      child: AnimatedScale(
        duration: const Duration(milliseconds: 150),
        scale: active ? 1.05 : 1,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Stack(
              clipBehavior: Clip.none,
              children: [
                AnimatedContainer(
                  duration: const Duration(milliseconds: 150),
                  padding: const EdgeInsets.all(6),
                  decoration: BoxDecoration(
                    color: active ? AppTheme.primary : Colors.transparent,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(
                    active ? tab.activeIcon : tab.icon,
                    size: 20,
                    color: active ? Colors.white : const Color(0xFF9CA3AF),
                    weight: active ? 2.5 : 1.8,
                  ),
                ),
                if (unreadNotifications > 0)
                  Positioned(
                    top: 0,
                    right: 0,
                    child: Container(
                      padding: const EdgeInsets.all(4),
                      decoration: const BoxDecoration(
                        color: Color(0xFFDC2626),
                        shape: BoxShape.circle,
                      ),
                      child: Text(
                        unreadNotifications > 9 ? '9+' : '$unreadNotifications',
                        style: const TextStyle(
                          fontSize: 8,
                          fontWeight: FontWeight.w700,
                          color: Colors.white,
                          height: 1,
                        ),
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              tab.label,
              style: TextStyle(
                fontSize: 10,
                fontWeight: active ? FontWeight.w700 : FontWeight.w600,
                color: active ? AppTheme.primary : const Color(0xFF9CA3AF),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// Clips the bar's top edge so a semicircular notch is carved out of the
// center. The raised call button's lower half rests inside this curve.
class _CurvedBarClipper extends CustomClipper<Path> {
  final double notchRadius;
  _CurvedBarClipper({required this.notchRadius});

  @override
  Path getClip(Size size) {
    final center = size.width / 2;
    final r = notchRadius;
    final path = Path()
      ..moveTo(0, 0)
      // Left edge down to the notch
      ..lineTo(center - r, 0)
      // Notch curve (inverted arc)
      ..cubicTo(center - r * 0.4, r * 0.6, center + r * 0.4, r * 0.6, center + r, 0)
      ..lineTo(size.width, 0)
      ..lineTo(size.width, size.height)
      ..lineTo(0, size.height)
      ..close();
    return path;
  }

  @override
  bool shouldReclip(covariant _CurvedBarClipper oldClipper) =>
      oldClipper.notchRadius != notchRadius;
}
