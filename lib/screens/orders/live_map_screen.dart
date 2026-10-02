import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
// Hide latlong2's Path so dart:ui's Path (used by the pin painters) resolves.
import 'package:latlong2/latlong.dart' hide Path;

import '../../l10n/app_localizations.dart';
import '../../services/customer_repository.dart';
import '../../theme.dart';

/// Uber-style live delivery tracking.
///
/// Draws real OpenStreetMap tiles centred on the pharmacy → customer route,
/// with the rider marker travelling along it. When the API reports a live
/// courier position that is used directly; otherwise the rider advances
/// smoothly along the route so tracking still feels live.
class LiveMapScreen extends StatefulWidget {
  final int orderId;
  final String pharmacyName;
  final String address;
  final String distance;
  final String etaText;
  final VoidCallback? onNavigate;

  /// Pharmacy origin. When null the map falls back to the destination.
  final double? originLat;
  final double? originLng;

  /// Customer destination.
  final double? destLat;
  final double? destLng;

  const LiveMapScreen({
    super.key,
    required this.orderId,
    required this.pharmacyName,
    required this.address,
    required this.distance,
    required this.etaText,
    this.onNavigate,
    this.originLat,
    this.originLng,
    this.destLat,
    this.destLng,
  });

  @override
  State<LiveMapScreen> createState() => _LiveMapScreenState();
}

class _LiveMapScreenState extends State<LiveMapScreen>
    with SingleTickerProviderStateMixin {
  static const _pollEvery = Duration(seconds: 20);

  late final AnimationController _riderController;
  Timer? _poll;

  /// 0..1 progress of the rider along the route when the backend has no
  /// courier coordinates.
  double _progress = 0.0;

  /// Live courier position reported by the API, when available.
  ({double lat, double lng})? _rider;

  bool _hasCoordinates() =>
      widget.destLat != null &&
      widget.destLng != null &&
      (widget.originLat != null && widget.originLng != null);

  @override
  void initState() {
    super.initState();
    // Long loop so the animated fallback never visibly restarts.
    _riderController =
        AnimationController(vsync: this, duration: const Duration(seconds: 90))
          ..addListener(() {
            setState(() => _progress = _riderController.value);
          });
    _riderController.repeat();
    _startPolling();
  }

  void _startPolling() {
    _poll?.cancel();
    _poll = Timer.periodic(_pollEvery, (_) => _refresh());
    // Pull once immediately so a fresh position shows up on open.
    unawaited(_refresh());
  }

  Future<void> _refresh() async {
    if (!mounted) return;
    try {
      final order = await CustomerRepository.orderDetail(widget.orderId);
      final lat = order.riderLatitude;
      final lng = order.riderLongitude;
      if (!mounted || lat == null || lng == null) return;
      setState(() => _rider = (lat: lat, lng: lng));
    } catch (_) {
      // Keep the animated fallback running when a poll fails.
    }
  }

  @override
  void dispose() {
    _poll?.cancel();
    _riderController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final L = AppLocalizations.of(context);

    if (!_hasCoordinates()) {
      // No route geometry to draw, so offer the external maps hand-off.
      return Scaffold(
        backgroundColor: AppColors.sand,
        appBar: AppBar(
          title: Text(L.t('trackLiveOrder')),
          backgroundColor: Colors.white,
          systemOverlayStyle: AppUi.statusBar,
        ),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(28),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(
                  Icons.location_off_outlined,
                  size: 40,
                  color: AppColors.muted,
                ),
                const SizedBox(height: 14),
                Text(
                  L.t('oh.mapUnavailable'),
                  textAlign: TextAlign.center,
                  style: const TextStyle(fontSize: 13, color: AppColors.muted),
                ),
                const SizedBox(height: 20),
                if (widget.onNavigate != null)
                  ElevatedButton.icon(
                    onPressed: widget.onNavigate,
                    icon: const Icon(Icons.navigation_rounded, size: 16),
                    label: Text(L.t('oh.navigate')),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.brand600,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(
                        horizontal: 20,
                        vertical: 14,
                      ),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),
                      ),
                    ),
                  ),
              ],
            ),
          ),
        ),
      );
    }

    final origin = LatLng(widget.originLat!, widget.originLng!);
    final dest = LatLng(widget.destLat!, widget.destLng!);
    final center = LatLng(
      (origin.latitude + dest.latitude) / 2,
      (origin.longitude + dest.longitude) / 2,
    );

    final riderPoint = _rider != null
        ? LatLng(_rider!.lat, _rider!.lng)
        : LatLng(
            origin.latitude + (dest.latitude - origin.latitude) * _progress,
            origin.longitude + (dest.longitude - origin.longitude) * _progress,
          );

    return Scaffold(
      body: Stack(
        children: [
          Positioned.fill(
            child: FlutterMap(
              options: MapOptions(
                initialCenter: center,
                initialZoom: 14.5,
                interactionOptions: const InteractionOptions(
                  flags: InteractiveFlag.all & ~InteractiveFlag.rotate,
                ),
              ),
              children: [
                TileLayer(
                  urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                  userAgentPackageName: 'com.pharmex.pharmex_customer_app',
                ),
                PolylineLayer(
                  polylines: [
                    Polyline(
                      points: [origin, dest],
                      color: AppColors.brand600,
                      strokeWidth: 5,
                    ),
                  ],
                ),
                MarkerLayer(
                  markers: [
                    Marker(
                      point: origin,
                      width: 44,
                      height: 48,
                      child: const _MapPin(
                        icon: Icons.local_pharmacy_rounded,
                        color: AppColors.brand600,
                      ),
                    ),
                    Marker(
                      point: dest,
                      width: 44,
                      height: 48,
                      child: const _MapPin(
                        icon: Icons.home_rounded,
                        color: AppColors.brand900,
                      ),
                    ),
                    Marker(
                      point: riderPoint,
                      width: 44,
                      height: 44,
                      child: const _RiderMarker(),
                    ),
                  ],
                ),
              ],
            ),
          ),

          // Top bar
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  _RoundIconButton(
                    icon: Icons.arrow_back_rounded,
                    onTap: () => Navigator.of(context).maybePop(),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 14,
                      vertical: 8,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(99),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.08),
                          blurRadius: 8,
                        ),
                      ],
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          width: 8,
                          height: 8,
                          decoration: const BoxDecoration(
                            color: AppColors.brand500,
                            shape: BoxShape.circle,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          'LIVE · ETA ${widget.etaText}',
                          style: const TextStyle(
                            fontSize: 11.5,
                            fontWeight: FontWeight.w800,
                            color: AppColors.brand700,
                          ),
                        ),
                      ],
                    ),
                  ),
                  _RoundIconButton(
                    icon: Icons.refresh_rounded,
                    onTap: _refresh,
                  ),
                ],
              ),
            ),
          ),

          // Bottom sheet
          Positioned(
            left: 0,
            right: 0,
            bottom: 0,
            child: Container(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 28),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: const BorderRadius.vertical(
                  top: Radius.circular(26),
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.08),
                    blurRadius: 30,
                    offset: const Offset(0, -10),
                  ),
                ],
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 40,
                    height: 4,
                    margin: const EdgeInsets.only(bottom: 16),
                    decoration: BoxDecoration(
                      color: AppColors.line,
                      borderRadius: BorderRadius.circular(99),
                    ),
                  ),
                  Row(
                    children: [
                      Container(
                        width: 48,
                        height: 48,
                        decoration: BoxDecoration(
                          color: AppColors.mint50,
                          border: Border.all(color: AppColors.line),
                          borderRadius: BorderRadius.circular(99),
                        ),
                        child: const Icon(
                          Icons.delivery_dining_rounded,
                          color: AppColors.brand700,
                          size: 20,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              widget.pharmacyName,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                            Text(
                              '${widget.distance} · ${widget.address}',
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                fontSize: 11.5,
                                color: AppColors.muted,
                              ),
                            ),
                          ],
                        ),
                      ),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(
                            widget.etaText,
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w800,
                              color: AppColors.brand600,
                            ),
                          ),
                          Text(
                            L.t('oh.arriving'),
                            style: const TextStyle(
                              fontSize: 10,
                              color: AppColors.muted,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: widget.onNavigate,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.brand600,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                      ),
                      icon: const Icon(Icons.navigation_rounded, size: 16),
                      label: Text(
                        '${L.t('oh.navigate')} (${widget.distance})',
                        style: const TextStyle(
                          fontWeight: FontWeight.w700,
                          fontSize: 14,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _RoundIconButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback? onTap;
  const _RoundIconButton({required this.icon, this.onTap});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(99),
      child: Container(
        width: 40,
        height: 40,
        decoration: BoxDecoration(
          color: Colors.white,
          shape: BoxShape.circle,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.08),
              blurRadius: 8,
            ),
          ],
        ),
        child: Icon(icon, size: 18, color: AppColors.ink),
      ),
    );
  }
}

/// Teardrop map marker with a pointed tail.
class _MapPin extends StatelessWidget {
  final IconData icon;
  final Color color;
  const _MapPin({required this.icon, required this.color});

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: color,
            shape: BoxShape.circle,
            border: Border.all(color: Colors.white, width: 3),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.18),
                blurRadius: 8,
              ),
            ],
          ),
          child: Icon(icon, color: Colors.white, size: 18),
        ),
        CustomPaint(size: const Size(12, 8), painter: _TrianglePainter(color)),
      ],
    );
  }
}

class _TrianglePainter extends CustomPainter {
  final Color color;
  _TrianglePainter(this.color);

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()..color = color;
    final path = Path()
      ..moveTo(0, 0)
      ..lineTo(size.width, 0)
      ..lineTo(size.width / 2, size.height)
      ..close();
    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(covariant _TrianglePainter oldDelegate) =>
      oldDelegate.color != color;
}

/// Pulsing rider dot.
class _RiderMarker extends StatefulWidget {
  const _RiderMarker();

  @override
  State<_RiderMarker> createState() => _RiderMarkerState();
}

class _RiderMarkerState extends State<_RiderMarker>
    with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 1600),
  )..repeat();

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _c,
      builder: (context, _) {
        final ring = 18 + _c.value * 26;
        final opacity = (1 - _c.value).clamp(0.0, 1.0) * 0.45;
        return SizedBox(
          width: 44,
          height: 44,
          child: Stack(
            alignment: Alignment.center,
            children: [
              Container(
                width: ring,
                height: ring,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: AppColors.brand500.withValues(alpha: opacity),
                ),
              ),
              Container(
                width: 22,
                height: 22,
                decoration: BoxDecoration(
                  color: AppColors.brand600,
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white, width: 3),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.15),
                      blurRadius: 6,
                    ),
                  ],
                ),
                child: const Icon(
                  Icons.delivery_dining_rounded,
                  color: Colors.white,
                  size: 11,
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
