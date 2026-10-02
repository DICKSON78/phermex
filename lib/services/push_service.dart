import 'dart:async';

import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:timezone/data/latest_all.dart' as tzdata;
import 'package:timezone/timezone.dart' as tz;

import '../l10n/app_localizations.dart';
import '../theme.dart';
import 'api_service.dart';

/// Handles push messages that arrive while the app is terminated or in the
/// background. Must be a top-level function for the Firebase plugin.
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  // Nothing to draw while backgrounded; the OS notification tray handles it.
}

/// Owns local notification setup, FCM token registration, and the call /
/// appointment alerts used by telemedicine.
///
/// All Firebase and plugin work is guarded so the app still runs when
/// `google-services.json` is missing or a plugin is unavailable.
class PushService {
  static final _plugin = FlutterLocalNotificationsPlugin();

  /// Android notification channels.
  static const ordersChannel = AndroidNotificationChannel(
    'orders_channel',
    'Order updates',
    description: 'Delivery and order status changes',
    importance: Importance.high,
  );

  static const consultsChannel = AndroidNotificationChannel(
    'consults_channel',
    'Video consultations',
    description: 'Incoming calls and scheduled consultation reminders',
    importance: Importance.high,
    audioAttributesUsage: AudioAttributesUsage.alarm,
  );

  static bool _initialised = false;
  static bool _tzReady = false;

  /// Payload of the notification that launched the app, if any.
  static Map<String, dynamic>? _pendingPayload;

  /// Requests POST_NOTIFICATIONS on Android 13+, creates the channels, and
  /// wires tap handling. Safe to call on every launch.
  static Future<void> initLocalNotifications() async {
    if (_initialised) return;
    try {
      const android = AndroidInitializationSettings('@mipmap/ic_launcher');
      await _plugin.initialize(
        settings: const InitializationSettings(android: android),
        onDidReceiveNotificationResponse: _onTap,
      );

      if (!_tzReady) {
        tzdata.initializeTimeZones();
        _tzReady = true;
      }

      final impl = _plugin.resolvePlatformSpecificImplementation<
          AndroidFlutterLocalNotificationsPlugin>();
      await impl?.createNotificationChannel(ordersChannel);
      await impl?.createNotificationChannel(consultsChannel);

      // Android 13+ needs an explicit runtime grant.
      await impl?.requestNotificationsPermission();
      _initialised = true;
    } catch (_) {
      // Plugin unavailable; push degrades to in-app toasts only.
    }
  }

  /// Tapping a call notification opens the consult; anything else falls
  /// through to the notification list.
  static void _onTap(NotificationResponse response) {
    final payload = response.payload;
    if (payload == null || payload.isEmpty) return;
    routePayload(_decode(payload));
  }

  static Map<String, dynamic> _decode(String payload) {
    final out = <String, dynamic>{};
    for (final pair in payload.split('&')) {
      final i = pair.indexOf('=');
      if (i <= 0) continue;
      out[Uri.decodeComponent(pair.substring(0, i))] =
          Uri.decodeComponent(pair.substring(i + 1));
    }
    return out;
  }

  static String _encode(Map<String, dynamic> payload) => payload.entries
      .map((e) =>
          '${Uri.encodeComponent(e.key)}=${Uri.encodeComponent('${e.value}')}')
      .join('&');

  /// Routes a decoded payload once the navigator is ready.
  static void routePayload(Map<String, dynamic> payload) {
    _pendingPayload = payload;
    unawaited(_routeWhenReady());
  }

  /// A push can arrive before login or before the first frame, so wait for the
  /// navigator instead of dropping the payload.
  static Future<void> _routeWhenReady() async {
    final payload = _pendingPayload;
    if (payload == null) return;
    for (var i = 0; i < 40; i++) {
      final ctx = ApiService.navigatorKey.currentContext;
      if (ctx != null && ctx.mounted) {
        _pendingPayload = null;
        _routePayload(payload);
        return;
      }
      await Future<void>.delayed(const Duration(milliseconds: 250));
    }
  }

  static void _routePayload(Map<String, dynamic> payload) {
    final ctx = ApiService.navigatorKey.currentContext;
    if (ctx == null || !ctx.mounted) return;
    final navigator = Navigator.of(ctx);
    final type = '${payload['type'] ?? ''}';

    if (type == 'consult_call' || type == 'telemedicine_call') {
      navigator.pushNamed('/consult', arguments: payload);
      return;
    }
    if (type == 'notification' || type == 'broadcast' || type == 'order') {
      navigator.pushNamed('/notifications');
    }
  }

  /// Registers the FCM token with the backend so order, payment, and call
  /// pushes reach this device. Never throws.
  static Future<void> initPushNotifications() async {
    try {
      await initLocalNotifications();
      if (!ApiService.isLoggedIn) {
        // Configure channels/permissions before login so the first incoming
        // call is not dropped; the token is synced right after signing in.
        return;
      }

      final messaging = FirebaseMessaging.instance;

      // Android 13+ requires the runtime grant even when Firebase is ready.
      await messaging.requestPermission(
          alert: true, badge: true, sound: true, provisional: false);

      final token = await messaging.getToken();
      if (token == null || token.isEmpty) return;

      await _registerToken(token);
      _setupHandlers(messaging);
    } catch (_) {
      // google-services.json missing or Firebase unavailable.
      debugPrint('PushService: FCM unavailable '
          '(is android/app/google-services.json present?)');
    }
  }

  /// Re-sends the current token. Call after login so the first session is
  /// registered even if startup happened while logged out.
  static Future<void> syncToken() async {
    try {
      final token = await FirebaseMessaging.instance.getToken();
      if (token == null || token.isEmpty) return;
      await _registerToken(token);
    } catch (_) {}
  }

  static Future<void> _registerToken(String token) async {
    try {
      await ApiService.post('/customer-app/notifications/device-token', {
        'device_token': token,
        'platform': 'android',
      });
    } catch (_) {
      // Registration failures are non-fatal.
    }
  }

  static void _setupHandlers(FirebaseMessaging messaging) {
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      showFromPush(message.data,
          title: message.notification?.title, body: message.notification?.body);
    });

    // Tapped from the system tray while the app was backgrounded.
    FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
      routePayload(message.data);
    });

    // A tap that cold-started the app: the payload is delivered here.
    messaging.getInitialMessage().then((initial) {
      if (initial != null) routePayload(initial.data);
    });
  }

  /// Renders a push payload as a real system notification.
  ///
  /// Consult calls get a high-priority full-screen alert so the call is
  /// visible immediately, matching how a phone call behaves.
  static Future<void> showFromPush(
    Map<String, dynamic> data, {
    String? title,
    String? body,
  }) async {
    try {
      if (!_initialised) await initLocalNotifications();

      final type = '${data['type'] ?? ''}';
      final isCall = type == 'consult_call' || type == 'telemedicine_call';
      final resolvedTitle =
          title ?? '${data['title'] ?? AppLocalizations.tr('misc.newNotification')}';
      final resolvedBody = body ?? '${data['body'] ?? data['message'] ?? ''}';

      await _plugin.show(
        id: isCall
            ? (data['id'] ?? 'consult_call').hashCode & 0x7fffffff
            : 1001,
        title: resolvedTitle,
        body: resolvedBody.isEmpty ? null : resolvedBody,
        notificationDetails: NotificationDetails(
          android: AndroidNotificationDetails(
            isCall ? consultsChannel.id : ordersChannel.id,
            isCall ? consultsChannel.name : ordersChannel.name,
            channelDescription: isCall
                ? consultsChannel.description
                : ordersChannel.description,
            importance: Importance.max,
            priority: Priority.high,
            category:
                isCall ? AndroidNotificationCategory.call : null,
            fullScreenIntent: isCall,
            playSound: true,
            ticker: resolvedTitle,
            color: AppColors.promo,
            styleInformation: BigTextStyleInformation(resolvedBody),
          ),
        ),
        payload: _encode(data),
      );
    } catch (_) {}
  }

  /// Fires an alert shortly before a scheduled consultation.
  ///
  /// [scheduledAt] is the appointment time; [lead] is how long before it the
  /// reminder should appear.
  static Future<void> scheduleConsultReminder({
    required int id,
    required DateTime scheduledAt,
    required String title,
    required String body,
    Duration lead = const Duration(minutes: 10),
    Map<String, dynamic> payload = const {},
  }) async {
    try {
      if (!_initialised) await initLocalNotifications();
      final when = scheduledAt.subtract(lead);
      final fireAt = when.isBefore(DateTime.now())
          ? DateTime.now().add(const Duration(seconds: 5))
          : when;

      await _plugin.zonedSchedule(
        id: id,
        title: title,
        body: body,
        scheduledDate: tz.TZDateTime.from(fireAt, tz.local),
        androidScheduleMode: AndroidScheduleMode.inexactAllowWhileIdle,
        notificationDetails: NotificationDetails(
          android: AndroidNotificationDetails(
            consultsChannel.id,
            consultsChannel.name,
            channelDescription: consultsChannel.description,
            importance: Importance.max,
            priority: Priority.high,
            category: AndroidNotificationCategory.reminder,
            playSound: true,
            color: AppColors.promo,
          ),
        ),
        payload: _encode(payload),
      );
    } catch (_) {}
  }

  static Future<void> cancelConsultReminder(int id) async {
    try {
      await _plugin.cancel(id: id);
    } catch (_) {}
  }

  /// Replaces any previously scheduled consult reminders so cancelled or moved
  /// appointments never leave a stale alert behind.
  static Future<void> syncConsultReminders(
      List<({DateTime at, String title, String body, Map<String, dynamic> payload})>
          upcoming) async {
    try {
      for (var i = 0; i < 20; i++) {
        await _plugin.cancel(id: i);
      }
      for (var i = 0; i < upcoming.length && i < 20; i++) {
        final u = upcoming[i];
        await scheduleConsultReminder(
          id: i,
          scheduledAt: u.at,
          title: u.title,
          body: u.body,
          payload: u.payload,
        );
      }
    } catch (_) {}
  }
}
