import 'package:flutter/material.dart';
import 'theme/app_theme.dart';
import 'screens/home_screen.dart';

/// Example entry point — wire this into your existing app's routing.
/// The pieces here (theme, colors, bottom nav, screens) are independent
/// and can be dropped into your current project folder by folder.
void main() {
  runApp(const PharmexApp());
}

class PharmexApp extends StatelessWidget {
  const PharmexApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Pharmex',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light(),
      home: const HomeScreen(),
    );
  }
}
