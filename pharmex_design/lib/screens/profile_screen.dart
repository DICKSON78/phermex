import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../widgets/app_bottom_nav.dart';

class ProfileScreen extends StatelessWidget {
  final String name;
  final String role;
  final String email;
  final String phone;
  final String customerId;
  final bool verified;

  const ProfileScreen({
    super.key,
    this.name = 'Test Customer',
    this.role = 'Customer',
    this.email = 'customer@pharmex.com',
    this.phone = '+255700000020',
    this.customerId = 'CUS-TEST01',
    this.verified = true,
  });

  static const _menu = [
    (Icons.person_outline_rounded, 'Edit Profile', 'Update your personal details'),
    (Icons.description_outlined, 'My Prescriptions', 'Your uploaded prescriptions'),
    (Icons.notifications_none_rounded, 'Notifications', 'Order updates & alerts'),
    (Icons.stars_rounded, 'Loyalty & Rewards', 'Points earned & redemption history'),
    (Icons.health_and_safety_outlined, 'Health Insurance', 'NHIF & private insurance policies'),
    (Icons.location_on_outlined, 'Saved Addresses', 'Delivery addresses'),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Profile')),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              border: Border.all(color: AppColors.line),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Row(
              children: [
                Container(
                  width: 64,
                  height: 64,
                  decoration: const BoxDecoration(color: AppColors.mint50, shape: BoxShape.circle),
                  alignment: Alignment.center,
                  child: Text(name.isNotEmpty ? name[0] : '?',
                      style: const TextStyle(
                          fontSize: 22, fontWeight: FontWeight.w800, color: AppColors.brand700)),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Flexible(
                            child: Text(name,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w800)),
                          ),
                          if (verified) ...[
                            const SizedBox(width: 6),
                            const Icon(Icons.verified_rounded, size: 15, color: Color(0xFF2B8FE0)),
                          ],
                        ],
                      ),
                      Text(role,
                          style: const TextStyle(
                              fontSize: 12.5, fontWeight: FontWeight.w700, color: AppColors.brand600)),
                      Text(email,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(fontSize: 11.5, color: AppColors.muted)),
                      Text(phone, style: const TextStyle(fontSize: 11.5, color: AppColors.muted)),
                      const SizedBox(height: 4),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                            color: AppColors.mint50, borderRadius: BorderRadius.circular(99)),
                        child: Text('ID: $customerId',
                            style: const TextStyle(
                                fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.brand700)),
                      ),
                    ],
                  ),
                ),
                Container(
                  width: 36,
                  height: 36,
                  decoration:
                      BoxDecoration(color: AppColors.brand600, borderRadius: BorderRadius.circular(12)),
                  child: const Icon(Icons.edit_outlined, color: Colors.white, size: 16),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          const Text('MENU',
              style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppColors.muted)),
          const SizedBox(height: 8),
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              border: Border.all(color: AppColors.line),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Column(
              children: List.generate(_menu.length, (i) {
                final item = _menu[i];
                return Column(
                  children: [
                    ListTile(
                      leading: Container(
                        width: 36,
                        height: 36,
                        decoration: BoxDecoration(
                          color: AppColors.mint50,
                          border: Border.all(color: AppColors.line),
                          borderRadius: BorderRadius.circular(11),
                        ),
                        child: Icon(item.$1, size: 16, color: AppColors.brand600),
                      ),
                      title: Text(item.$2,
                          style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700)),
                      subtitle:
                          Text(item.$3, style: const TextStyle(fontSize: 11, color: AppColors.muted)),
                      trailing: const Icon(Icons.chevron_right, size: 16, color: AppColors.muted),
                      onTap: () {},
                    ),
                    if (i != _menu.length - 1) const Divider(height: 1, color: AppColors.line),
                  ],
                );
              }),
            ),
          ),
        ],
      ),
      bottomNavigationBar: AppBottomNav(current: AppTab.me, onTap: (_) {}),
    );
  }
}
