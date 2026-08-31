import 'package:flutter/material.dart';
import '../../models/models.dart';
import '../../services/api_service.dart';
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
  List<BroadcastMessage> _broadcasts = [];
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
      final results = await Future.wait([
        CustomerRepository.notifications(),
        CustomerRepository.broadcasts(),
      ]);
      if (!mounted) return;
      setState(() {
        _notifications = results[0] as List<AppNotification>;
        _broadcasts = results[1] as List<BroadcastMessage>;
        _error = null;
      });
    } catch (e) {
      if (mounted) setState(() => _error = ApiService.friendlyError(e));
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
              : _notifications.isEmpty && _broadcasts.isEmpty
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
                      child: ListView(
                        padding: const EdgeInsets.all(20),
                        children: [
                          if (_broadcasts.isNotEmpty) ...[
                            const Text('Announcements',
                                style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: Color(0xFF6B7280))),
                            const SizedBox(height: 10),
                            ..._broadcasts.map((b) => Padding(
                                  padding: const EdgeInsets.only(bottom: 10),
                                  child: _BroadcastCard(broadcast: b),
                                )),
                            if (_notifications.isNotEmpty) ...[
                              const SizedBox(height: 6),
                              const Divider(height: 24),
                              const Text('Recent',
                                  style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: Color(0xFF6B7280))),
                              const SizedBox(height: 10),
                            ],
                          ],
                          ..._notifications.map((n) => Padding(
                                padding: const EdgeInsets.only(bottom: 10),
                                child: GestureDetector(
                                  onTap: () => _markRead(n),
                                  child: Container(
                                    padding: const EdgeInsets.all(16),
                                    decoration: BoxDecoration(
                                      color: Colors.white,
                                      borderRadius: BorderRadius.circular(16),
                                      border: Border.all(
                                        color: n.isRead
                                            ? const Color(0xFFEEF1F0)
                                            : AppTheme.primary.withOpacity(0.4),
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
                                ),
                              )),
                        ],
                      ),
                    ),
    );
  }
}

class _BroadcastCard extends StatelessWidget {
  final BroadcastMessage broadcast;
  const _BroadcastCard({required this.broadcast});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF0a1f14), Color(0xFF14532d)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: AppTheme.primary.withOpacity(0.15),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(Icons.campaign_outlined, size: 18, color: AppTheme.primary),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(broadcast.title ?? 'Announcement',
                    style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: Colors.white)),
                if (broadcast.message != null && broadcast.message!.isNotEmpty) ...[
                  const SizedBox(height: 4),
                  Text(broadcast.message!,
                      maxLines: 4,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontSize: 12, height: 1.4, color: Color(0xCCFFFFFF))),
                ],
                if (broadcast.createdAt != null) ...[
                  const SizedBox(height: 6),
                  Text(AppHelpers.formatDate(broadcast.createdAt),
                      style: const TextStyle(fontSize: 11, color: Color(0x99FFFFFF))),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}
