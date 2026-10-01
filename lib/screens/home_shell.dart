import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../services/api_service.dart';
import '../theme.dart';
import '../widgets/app_bottom_nav.dart';
import '../widgets/offline_banner.dart';
import '../widgets/app_drawer.dart';
import 'home/home_screen.dart';
import 'orders/orders_list_screen.dart';
import 'prescriptions/prescriptions_screen.dart';
import 'telemedicine/telemedicine_screen.dart';
import 'profile/settings_screen.dart' as profile;

class HomeShell extends StatefulWidget {
  const HomeShell({super.key});

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  AppTab _tab = AppTab.home;
  int _unreadNotifications = 0;
  int _homeRefreshTick = 0;
  int _ordersRefreshTick = 0;
  int _telemedicineRefreshTick = 0;

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
      TelemedicineScreen(refreshTick: _telemedicineRefreshTick),
      const PrescriptionsScreen(),
      const profile.SettingsScreen(),
    ];
    final index = switch (_tab) {
      AppTab.home => 0,
      AppTab.orders => 1,
      AppTab.call => 2,
      AppTab.rx => 3,
      AppTab.settings => 4,
    };
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: AppUi.statusBar,
      child: Scaffold(
        drawer: const AppDrawer(),
        body: Column(
          children: [
            OfflineBanner(),
            Expanded(
              child: IndexedStack(index: index, children: screens),
            ),
          ],
        ),
        bottomNavigationBar: AppBottomNav(
          current: _tab,
          onTap: (tab) {
            setState(() {
              _tab = tab;
              if (tab == AppTab.home) _homeRefreshTick++;
              if (tab == AppTab.orders) _ordersRefreshTick++;
              if (tab == AppTab.call) _telemedicineRefreshTick++;
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