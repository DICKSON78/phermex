import 'package:flutter/material.dart';

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

class AppTheme {
  // Backward-compatible aliases mapping to the design token palette.
  static const Color primary = AppColors.brand600;
  static const Color primaryDark = AppColors.brand700;
  static const Color dark = AppColors.brand900;
  static const Color darkSurface = AppColors.brand800;
  static const Color bgLight = AppColors.sand;
  static const Color textDark = AppColors.ink;
  static const Color textMuted = AppColors.muted;
  static const Color border = AppColors.line;

  static ThemeData light() {
    return ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(
        seedColor: primary,
        primary: primary,
        secondary: primaryDark,
        surface: Colors.white,
        onPrimary: Colors.white,
      ),
      scaffoldBackgroundColor: bgLight,
      fontFamily: 'Poppins',
      textTheme: const TextTheme(
        bodySmall: TextStyle(fontSize: 12, color: AppColors.ink),
        bodyMedium: TextStyle(fontSize: 14, color: AppColors.ink),
        bodyLarge: TextStyle(fontSize: 16, color: AppColors.ink),
        titleMedium: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.ink),
        titleLarge: TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: AppColors.ink),
        headlineSmall: TextStyle(fontSize: 24, fontWeight: FontWeight.w700, color: AppColors.ink),
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: Colors.white,
        foregroundColor: AppColors.ink,
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: false,
        titleTextStyle: TextStyle(
          color: AppColors.ink,
          fontSize: 18,
          fontWeight: FontWeight.w700,
          fontFamily: 'Poppins',
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primary,
          foregroundColor: Colors.white,
          elevation: 0,
          minimumSize: const Size(0, 48),
          padding: const EdgeInsets.symmetric(horizontal: 20),
          textStyle: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, fontFamily: 'Poppins'),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.ink,
          minimumSize: const Size(0, 48),
          side: const BorderSide(color: AppColors.line),
          textStyle: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, fontFamily: 'Poppins'),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Colors.white,
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 16),
        labelStyle: const TextStyle(fontSize: 14, fontFamily: 'Poppins'),
        hintStyle: const TextStyle(fontSize: 14, color: AppColors.muted, fontFamily: 'Poppins'),
        prefixIconColor: AppColors.muted,
        suffixIconColor: AppColors.muted,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: AppColors.line),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: AppColors.line),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: primary, width: 1.5),
        ),
      ),
      dividerTheme: const DividerThemeData(color: AppColors.line, thickness: 1),
      chipTheme: ChipThemeData(
        backgroundColor: Colors.white,
        selectedColor: primary,
        labelStyle: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.ink, fontFamily: 'Poppins'),
        side: const BorderSide(color: AppColors.line),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(99)),
      ),
      cardTheme: CardThemeData(
        color: Colors.white,
        elevation: 0,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: AppColors.line),
        ),
      ),
    );
  }
}