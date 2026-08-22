import 'package:flutter/material.dart';
import '../theme.dart';
import 'home/home_screen.dart';
import 'orders/orders_list_screen.dart';
import 'chat/chat_list_screen.dart';
import 'profile/profile_screen.dart';

class HomeShell extends StatefulWidget {
  const HomeShell({super.key});

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int _index = 0;

  static const _tabs = [
    (icon: Icons.home_outlined, activeIcon: Icons.home, label: 'Home'),
    (icon: Icons.receipt_long_outlined, activeIcon: Icons.receipt_long, label: 'Orders'),
    (icon: Icons.chat_bubble_outline, activeIcon: Icons.chat_bubble, label: 'Chat'),
    (icon: Icons.person_outline, activeIcon: Icons.person, label: 'Me'),
  ];

  @override
  Widget build(BuildContext context) {
    final screens = [
      const HomeScreen(),
      const OrdersListScreen(),
      const ChatListScreen(),
      const ProfileScreen(),
    ];
    return Scaffold(
      body: IndexedStack(index: _index, children: screens),
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          border: Border(top: BorderSide(color: Color(0xFFF0F0F0))),
        ),
        child: SafeArea(
          top: false,
          child: Container(
            height: 68,
            padding: const EdgeInsets.symmetric(horizontal: 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: List.generate(_tabs.length, (i) {
                final tab = _tabs[i];
                final active = _index == i;
                return GestureDetector(
                  behavior: HitTestBehavior.opaque,
                  onTap: () => setState(() => _index = i),
                  child: AnimatedScale(
                    duration: const Duration(milliseconds: 150),
                    scale: active ? 1.05 : 1,
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
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
              }),
            ),
          ),
        ),
      ),
    );
  }
}
