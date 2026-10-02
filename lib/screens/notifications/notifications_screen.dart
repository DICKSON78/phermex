import 'package:flutter/material.dart';
import '../../l10n/app_localizations.dart';
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
  bool _loadedOnce = false;
  final _autoRefresh = AutoRefresh();
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
    _autoRefresh.start(const Duration(seconds: 45), () {
      if (mounted) _load(silent: true);
    });
  }

  Future<void> _load({bool silent = false}) async {
    setState(() => _loading = silent ? false : !_loadedOnce);
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
        _loadedOnce = true;
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
      appBar: AppBar(
        leading: const BackButton(color: AppColors.ink),
        title: Text(AppLocalizations.of(context).t('notifications')),
        actions: [
          if (hasUnread)
            TextButton(
              onPressed: _markAllRead,
              child: Text(AppLocalizations.of(context).t('misc.markAllRead'),
                  style: const TextStyle(
                      color: AppColors.brand600,
                      fontSize: 12.5,
                      fontWeight: FontWeight.w700)),
            ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: AppColors.brand600))
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
                        OutlinedButton(
                            onPressed: _load,
                            child: Text(
                                AppLocalizations.of(context).t('misc.retry'))),
                      ],
                    ),
                  ),
                )
              : _notifications.isEmpty && _broadcasts.isEmpty
                  ? RefreshIndicator(
                      onRefresh: _load,
                      child: ListView(
                        physics: const AlwaysScrollableScrollPhysics(),
                        children: [
                          const SizedBox(height: 140),
                          const Icon(Icons.notifications_none,
                              size: 44, color: AppColors.line),
                          const SizedBox(height: 12),
                          Center(
                            child: Text(
                                AppLocalizations.of(context)
                                    .t('misc.noNotificationsYet'),
                                style:
                                    const TextStyle(fontSize: 13, color: AppColors.muted)),
                          ),
                        ],
                      ),
                    )
                  : RefreshIndicator(
                      onRefresh: _load,
                      child: ListView.separated(
                        padding: const EdgeInsets.all(24),
                        itemCount: _broadcasts.length + _notifications.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 12),
                        itemBuilder: (context, i) {
                          if (i < _broadcasts.length) {
                            return _BroadcastCard(broadcast: _broadcasts[i]);
                          }
                          final n = _notifications[i - _broadcasts.length];
                          return GestureDetector(
                            onTap: () => _markRead(n),
                            child: Container(
                              padding: const EdgeInsets.all(14),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                border: Border.all(
                                  color: n.isRead ? AppColors.line : AppColors.brand500,
                                  width: n.isRead ? 1 : 1.5,
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
                                      color: n.isRead ? AppColors.sand : AppColors.mint50,
                                      borderRadius: BorderRadius.circular(11),
                                    ),
                                    child: Icon(Icons.notifications_none_rounded,
                                        size: 16,
                                        color: n.isRead ? AppColors.muted : AppColors.brand600),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(n.title ?? '',
                                            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: AppColors.ink)),
                                        if (n.message != null && n.message!.isNotEmpty) ...[
                                          const SizedBox(height: 2),
                                          Text(n.message!,
                                              maxLines: 3,
                                              overflow: TextOverflow.ellipsis,
                                              style: const TextStyle(fontSize: 11.5, color: AppColors.muted, height: 1.35)),
                                        ],
                                        const SizedBox(height: 4),
                                        Text(AppHelpers.formatDate(n.createdAt),
                                            style: const TextStyle(fontSize: 10.5, color: AppColors.muted)),
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

  @override
  void dispose() {
    _autoRefresh.stop();
    super.dispose();
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
        color: AppColors.header,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: AppColors.brand600.withOpacity(0.15),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(Icons.campaign_outlined, size: 18, color: AppColors.brand600),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(broadcast.title ??
                        AppLocalizations.of(context).t('misc.announcement'),
                    style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: Colors.white)),
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