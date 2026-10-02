import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

class AppNotification {
  final String title;
  final String body;
  final String timestamp;
  final bool unread;

  const AppNotification({
    required this.title,
    required this.body,
    required this.timestamp,
    this.unread = false,
  });
}

class NotificationsScreen extends StatelessWidget {
  final List<AppNotification> notifications;
  final VoidCallback? onMarkAllRead;

  const NotificationsScreen({
    super.key,
    this.notifications = const [
      AppNotification(
        title: 'Video Consult is Live',
        body: 'The pharmacist has joined. Tap to start / join the video call.',
        timestamp: 'Sep 9, 2026 · 2:04 PM',
        unread: true,
      ),
      AppNotification(
        title: 'Video Consult is Live',
        body: 'The pharmacist has joined. Tap to start / join the video call.',
        timestamp: 'Sep 9, 2026 · 2:03 PM',
        unread: true,
      ),
      AppNotification(
        title: 'Order Delivered',
        body: 'Your order #ORD-2026-YTVFW is now Delivered',
        timestamp: 'Sep 4, 2026 · 10:57 AM',
      ),
      AppNotification(
        title: 'Order Out for Delivery',
        body: 'Your order #ORD-2026-YTVFW is now Out for Delivery',
        timestamp: 'Sep 4, 2026 · 10:57 AM',
      ),
      AppNotification(
        title: 'Order Ready for Pickup',
        body: 'Your order #ORD-2026-YTVFW is now Ready for Pickup',
        timestamp: 'Sep 4, 2026 · 10:40 AM',
      ),
    ],
    this.onMarkAllRead,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leading: const BackButton(color: AppColors.ink),
        title: const Text('Notifications'),
        actions: [
          TextButton(
            onPressed: onMarkAllRead,
            child: const Text('Mark all read',
                style: TextStyle(
                    color: AppColors.brand600, fontSize: 12.5, fontWeight: FontWeight.w700)),
          ),
        ],
      ),
      body: ListView.separated(
        padding: const EdgeInsets.all(24),
        itemCount: notifications.length,
        separatorBuilder: (_, __) => const SizedBox(height: 12),
        itemBuilder: (context, i) {
          final n = notifications[i];
          return Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: Colors.white,
              border: Border.all(
                color: n.unread ? AppColors.brand500 : AppColors.line,
                width: n.unread ? 1.5 : 1,
              ),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    color: n.unread ? AppColors.mint50 : AppColors.sand,
                    borderRadius: BorderRadius.circular(11),
                  ),
                  child: Icon(Icons.notifications_none_rounded,
                      size: 16, color: n.unread ? AppColors.brand600 : AppColors.muted),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(n.title,
                          style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w800)),
                      const SizedBox(height: 2),
                      Text(n.body,
                          style: const TextStyle(fontSize: 11.5, color: AppColors.muted, height: 1.35)),
                      const SizedBox(height: 4),
                      Text(n.timestamp,
                          style: const TextStyle(fontSize: 10.5, color: AppColors.muted)),
                    ],
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}
