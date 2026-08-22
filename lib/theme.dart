import 'package:flutter/material.dart';

class AppTheme {
  static const Color primary = Color(0xFF0FD452);
  static const Color primaryDark = Color(0xFF0cb843);
  static const Color dark = Color(0xFF000F14);
  static const Color darkSurface = Color(0xFF0a1f14);
  static const Color bgLight = Color(0xFFf5f7f5);
  static const Color textDark = Color(0xFF000F14);
  static const Color textMuted = Color(0xFF6B7280);
  static const Color border = Color(0xFFEEF1F0);

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
        bodySmall: TextStyle(fontSize: 12, color: Colors.black87),
        bodyMedium: TextStyle(fontSize: 14, color: Colors.black87),
        bodyLarge: TextStyle(fontSize: 16, color: Colors.black87),
        titleMedium: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: textDark),
        titleLarge: TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: textDark),
        headlineSmall: TextStyle(fontSize: 24, fontWeight: FontWeight.w700, color: textDark),
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: Colors.white,
        foregroundColor: textDark,
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: false,
        titleTextStyle: TextStyle(
          color: textDark,
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
          minimumSize: const Size(0, 52),
          padding: const EdgeInsets.symmetric(horizontal: 20),
          textStyle: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, fontFamily: 'Poppins'),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: textDark,
          minimumSize: const Size(0, 48),
          side: const BorderSide(color: Color(0xFFE5E7EB)),
          textStyle: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, fontFamily: 'Poppins'),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: const Color(0xFFF9FAFB),
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 16),
        labelStyle: const TextStyle(fontSize: 14, fontFamily: 'Poppins'),
        hintStyle: const TextStyle(fontSize: 14, color: Colors.grey, fontFamily: 'Poppins'),
        prefixIconColor: Colors.grey,
        suffixIconColor: Colors.grey,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: primary, width: 1.5),
        ),
      ),
      dividerTheme: const DividerThemeData(color: border, thickness: 1),
      cardTheme: CardThemeData(
        color: Colors.white,
        elevation: 0,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      ),
    );
  }
}
