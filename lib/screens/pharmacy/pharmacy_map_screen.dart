import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:geolocator/geolocator.dart';
import 'package:latlong2/latlong.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../theme.dart';

/// In-app (Uber-style) map showing the pharmacy location with the user's
/// current position. Provides an external "Get Directions" action for actual
/// turn-by-turn navigation.
class PharmacyMapScreen extends StatefulWidget {
  final String name;
  final LatLng destination;
  final String address;

  const PharmacyMapScreen({
    super.key,
    required this.name,
    required this.destination,
    required this.address,
  });

  @override
  State<PharmacyMapScreen> createState() => _PharmacyMapScreenState();
}

class _PharmacyMapScreenState extends State<PharmacyMapScreen> {
  final MapController _mapController = MapController();
  Position? _userPos;

  @override
  void initState() {
    super.initState();
    _loadUserLocation();
  }

  Future<void> _loadUserLocation() async {
    try {
      var enabled = await Geolocator.isLocationServiceEnabled();
      if (!enabled) return;
      var perm = await Geolocator.checkPermission();
      if (perm == LocationPermission.denied) {
        perm = await Geolocator.requestPermission();
      }
      if (perm == LocationPermission.whileInUse || perm == LocationPermission.always) {
        final pos = await Geolocator.getCurrentPosition();
        if (mounted) setState(() => _userPos = pos);
      }
    } catch (_) {}
  }

  double? get _distance {
    final p = _userPos;
    if (p == null) return null;
    return Geolocator.distanceBetween(p.latitude, p.longitude,
            widget.destination.latitude, widget.destination.longitude) /
        1000;
  }

  /// Best point for the map camera: midpoint means both markers are visible.
  LatLng get _center {
    final p = _userPos;
    if (p == null) return widget.destination;
    return LatLng(
      (p.latitude + widget.destination.latitude) / 2,
      (p.longitude + widget.destination.longitude) / 2,
    );
  }

  void _openExternalNavigation() {
    final uri = Uri.parse(
      'https://www.google.com/maps/dir/?api=1&destination='
      '${widget.destination.latitude},${widget.destination.longitude}',
    );
    _launch(uri);
  }

  Future<void> _launch(Uri url) async {
    try {
      final ok = await launchUrl(url, mode: LaunchMode.externalApplication);
      if (!ok && context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Could not open maps'),
              behavior: SnackBarBehavior.floating),
        );
      }
    } catch (_) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Could not open maps'),
              behavior: SnackBarBehavior.floating),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final distance = _distance;
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: const Text('Map'),
        backgroundColor: Colors.white,
      ),
      body: Stack(
        children: [
          FlutterMap(
            mapController: _mapController,
            options: MapOptions(
              initialCenter: _center,
              initialZoom: 15,
              interactionOptions: const InteractionOptions(flags: InteractiveFlag.all & ~InteractiveFlag.rotate),
            ),
            children: [
              TileLayer(
                urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                userAgentPackageName: 'com.pharmex.pharmex_customer_app',
              ),
              if (_userPos != null)
                MarkerLayer(
                  markers: [
                    Marker(
                      point: LatLng(_userPos!.latitude, _userPos!.longitude),
                      width: 36,
                      height: 36,
                      child: Container(
                        decoration: BoxDecoration(
                          color: const Color(0xFF2563EB),
                          shape: BoxShape.circle,
                          border: Border.all(color: Colors.white, width: 3),
                        ),
                        child: const Icon(Icons.my_location, size: 18, color: Colors.white),
                      ),
                    ),
                  ],
                ),
              MarkerLayer(
                markers: [
                  Marker(
                    point: widget.destination,
                    width: 44,
                    height: 48,
                    child: Column(
                      children: [
                        Icon(Icons.location_pin, size: 40, color: AppTheme.primary),
                      ],
                    ),
                  ),
                ],
              ),
            ],
          ),
          // Bottom action card
          Positioned(
            left: 16,
            right: 16,
            bottom: 0,
            child: SafeArea(
              top: false,
              child: Container(
                padding: const EdgeInsets.fromLTRB(16, 14, 16, 12),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
                  boxShadow: const [
                    BoxShadow(color: Color(0x220F172A), blurRadius: 16, offset: Offset(0, -4)),
                  ],
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(Icons.local_pharmacy, color: AppTheme.primary, size: 22),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(widget.name,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: Color(0xFF111827))),
                        ),
                        if (distance != null)
                          Text('${distance.toStringAsFixed(1)} km',
                              style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppTheme.primary)),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        const SizedBox(width: 32),
                        Expanded(
                          child: Text(widget.address,
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(fontSize: 12, color: Color(0xFF6B7280))),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),
                    SizedBox(
                      width: double.infinity,
                      height: 48,
                      child: ElevatedButton.icon(
                        onPressed: _openExternalNavigation,
                        icon: const Icon(Icons.navigation, size: 18, color: Colors.white),
                        label: Text(
                          distance == null ? 'Get Directions' : 'Navigate (${distance.toStringAsFixed(1)} km)',
                          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}