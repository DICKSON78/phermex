import 'package:flutter/material.dart';

/// Color tokens matching the web design system (same values used in the
/// HTML mockups). Keep these as the single source of truth so every
/// screen stays visually consistent.
class AppColors {
  AppColors._();

  static const brand900 = Color(0xFF0A1F16);
  static const brand800 = Color(0xFF0E3324);
  static const brand700 = Color(0xFF13502F);
  static const brand600 = Color(0xFF16A34A);
  static const brand500 = Color(0xFF22C55E);

  static const mint50 = Color(0xFFE7F7EC);
  static const sand = Color(0xFFF6F5F0);
  static const ink = Color(0xFF0D211A);
  static const muted = Color(0xFF6D8579);
  static const line = Color(0xFFE7EBE6);
  static const gold = Color(0xFFE8B04B);

  static const amber50 = Color(0xFFFDF1E2);
  static const amber600 = Color(0xFFB9762A);

  static const violet50 = Color(0xFFF1ECFB);
  static const violet600 = Color(0xFF7C4FE0);

  /// Dark radial-style gradient used behind the status bar / hero header,
  /// matching the CSS `radial-gradient` used on the web mockups.
  static const darkHeaderGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF0F2A1E), brand900, Color(0xFF060F0B)],
  );

  static const doctorBannerGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [brand500, brand700],
  );

  static const pharmacyPhotoGradient = LinearGradient(
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
    colors: [Color(0xFF25B57E), Color(0xFF0C5C40)],
  );
}
