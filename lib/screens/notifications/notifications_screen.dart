import 'package:flutter/material.dart';
import '../../models/models.dart';
import '../../services/customer_repository.dart';
import '../../theme.dart';
import '../../utils/helpers.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  List<AppNotification> _notifications = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final list = await CustomerRepository.notifications();
      if (!mounted) return;
      setState(() {
        _notifications = list;
        _error = null;
      });
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _markAllRead() async {
    await CustomerRepository.markAllNotificationsRead();
    setState(() {
      for (var n in _notifications) {
        _notifications[_notifications.indexOf(n)] = AppNotification(
          id: n.id,
          title: n.title,
          message: n.message,
          isRead: true,
          createdAt: n.createdAt,
        );
      }
    });
  }

  Future<void> _markRead(AppNotification n) async {
    if (n.isRead) return;
    await CustomerRepository.markNotificationRead(n.id);
    setState(() {
      _notifications[_notifications.indexOf(n)] = AppNotification(
        id: n.id,
        title: n.title,
        message: n.message,
        isRead: true,
        createdAt: n.createdAt,
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    final hasUnread = _notifications.any((n) => !n.isRead);
    return Scaffold(
      backgroundColor: AppTheme.bgLight,
      appBar: AppBar(
        title: const Text('Notifications'),
        backgroundColor: Colors.white,
        actions: [
          if (hasUnread)
            TextButton(onPressed: _markAllRead, child: const Text('Mark all read')),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(_error!, textAlign: TextAlign.center,
                            style: const TextStyle(fontSize: 13, color: Color(0xFFDC2626))),
                        const SizedBox(height: 12),
                        OutlinedButton(onPressed: _load, child: const Text('Retry')),
                      ],
                    ),
                  ),
                )
              : _notifications.isEmpty
                  ? RefreshIndicator(
                      onRefresh: _load,
                      child: ListView(
                        physics: const AlwaysScrollableScrollPhysics(),
                        children: const [
                          SizedBox(height: 120),
                          Icon(Icons.notifications_none, size: 48, color: Color(0xFFD1D5DB)),
                          SizedBox(height: 12),
                          Center(
                            child: Text('No notifications yet',
                                style: TextStyle(fontSize: 14, color: Color(0xFF6B7280))),
                          ),
                        ],
                      ),
                    )
                  : RefreshIndicator(
                      onRefresh: _load,
                      child: ListView.separated(
                        padding: const EdgeInsets.all(20),
                        itemCount: _notifications.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 10),
                        itemBuilder: (context, i) {
                          final n = _notifications[i];
                          return GestureDetector(
                            onTap: () => _markRead(n),
                            child: Container(
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(
                                  color: n.isRead ? const Color(0xFFEEF1F0) : AppTheme.primary.withOpacity(0.4),
                                ),
                              ),
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Container(
                                    width: 40,
                                    height: 40,
                                    decoration: BoxDecoration(
                                      color: n.isRead
                                          ? const Color(0xFFF3F4F6)
                                          : AppTheme.primary.withOpacity(0.1),
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    child: Icon(Icons.notifications_none,
                                        size: 18,
                                        color: n.isRead ? const Color(0xFF9CA3AF) : AppTheme.primary),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(n.title ?? '',
                                            style: TextStyle(
                                              fontSize: 14,
                                              fontWeight: n.isRead ? FontWeight.w600 : FontWeight.w700,
                                              color: const Color(0xFF111827),
                                            )),
                                        if (n.message != null && n.message!.isNotEmpty) ...[
                                          const SizedBox(height: 4),
                                          Text(n.message!,
                                              maxLines: 3,
                                              overflow: TextOverflow.ellipsis,
                                              style: const TextStyle(fontSize: 12, color: Color(0xFF6B7280))),
                                        ],
                                        const SizedBox(height: 6),
                                        Text(AppHelpers.formatDate(n.createdAt),
                                            style: const TextStyle(fontSize: 11, color: Color(0xFF9CA3AF))),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
                    ),
    );
  }
}
