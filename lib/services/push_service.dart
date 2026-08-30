import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'api_service.dart';

/// Wraps Firebase Cloud Messaging token registration and push handlers.
///
/// All Firebase usage is wrapped in try/catch so the app keeps working even if
/// the plugin or a valid FCM setup isn't available.
class PushService {
  /// Registers the FCM push token with the backend so push payments and order
  /// updates reach this device. Never throws.
  static Future<void> initPushNotifications() async {
    try {
      if (!ApiService.isLoggedIn) return;

      final messaging = FirebaseMessaging.instance;
      final token = await messaging.getToken();

      if (token == null || token.isEmpty) return;

      try {
        await ApiService.post(
          '/customer-app/payments/device-token',
          {
            'device_token': token,
            'platform': 'android',
          },
        );
      } catch (_) {
        // Registration failures are non-fatal.
      }

      _setupHandlers(messaging);
    } catch (_) {
      // Firebase unavailable or broken; gracefully skip push setup.
    }
  }

  static void _setupHandlers(FirebaseMessaging messaging) {
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      final title = message.notification?.title ?? 'New notification';
      final messenger = ApiService.navigatorKey.currentContext;
      if (messenger == null || !messenger.mounted) return;
      final snack = ScaffoldMessenger.of(messenger);
      snack
        ..hideCurrentSnackBar()
        ..showSnackBar(
          SnackBar(
            content: Text(title),
            behavior: SnackBarBehavior.floating,
          ),
        );
    });
  }
}
