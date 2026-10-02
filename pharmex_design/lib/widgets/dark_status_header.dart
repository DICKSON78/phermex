import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

/// Thin dark-gradient bar (matches the Home screen's hero banner colors)
/// that sits behind the OS status bar area on inner screens, so every
/// screen's status bar reads consistently against a dark green backdrop.
/// Wrap your Scaffold's body in a Column and put this first, or use it
/// as a SliverAppBar background if you prefer slivers.
class DarkStatusHeader extends StatelessWidget {
  final double height;
  const DarkStatusHeader({super.key, this.height = 36});

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).padding.top + height,
      decoration: const BoxDecoration(gradient: AppColors.darkHeaderGradient),
    );
  }
}
