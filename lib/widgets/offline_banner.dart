import 'package:flutter/material.dart';
import '../services/offline_service.dart';

/// A thin MaterialBanner shown at the top of the app whenever the device has
/// no connection. Disappears automatically when connectivity returns.
class OfflineBanner extends StatefulWidget {
  const OfflineBanner({super.key});

  @override
  State<OfflineBanner> createState() => _OfflineBannerState();
}

class _OfflineBannerState extends State<OfflineBanner> {
  @override
  void initState() {
    super.initState();
    OfflineService.isOffline.addListener(_onChange);
  }

  @override
  void dispose() {
    OfflineService.isOffline.removeListener(_onChange);
    super.dispose();
  }

  void _onChange() {
    if (mounted) setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    if (!OfflineService.isOffline.value) return const SizedBox.shrink();
    return Container(
      width: double.infinity,
      color: const Color(0xFFFFF4E5),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: const Row(
        children: [
          Icon(Icons.wifi_off_rounded, size: 16, color: Color(0xFFB45309)),
          SizedBox(width: 8),
          Expanded(
            child: Text(
              'You are offline. Showing the last saved data.',
              style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFFB45309)),
            ),
          ),
        ],
      ),
    );
  }
}

/// Wrapper widget that stacks an [OfflineBanner] above its child. Drop this
/// into scaffold bodies so content pushes down instead of overlapping.
class OfflineStack extends StatelessWidget {
  final Widget child;

  const OfflineStack({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        OfflineBanner(),
        Expanded(child: child),
      ],
    );
  }
}