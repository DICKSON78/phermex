import 'dart:math';
import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

class LiveMapScreen extends StatefulWidget {
  final String pharmacyName;
  final String address;
  final String distance;
  final String etaText;
  final VoidCallback? onNavigate;

  const LiveMapScreen({
    super.key,
    this.pharmacyName = 'Viwandani Health Pharmacy',
    this.address = 'Iringa Road, Viwandani',
    this.distance = '0.3 km',
    this.etaText = '4 min',
    this.onNavigate,
  });

  @override
  State<LiveMapScreen> createState() => _LiveMapScreenState();
}

class _LiveMapScreenState extends State<LiveMapScreen> with TickerProviderStateMixin {
  late final AnimationController _dashController;
  late final AnimationController _pulseController;

  @override
  void initState() {
    super.initState();
    _dashController = AnimationController(vsync: this, duration: const Duration(seconds: 1))
      ..repeat();
    _pulseController = AnimationController(vsync: this, duration: const Duration(milliseconds: 1600))
      ..repeat();
  }

  @override
  void dispose() {
    _dashController.dispose();
    _pulseController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          // map background
          Positioned.fill(
            child: AnimatedBuilder(
              animation: _dashController,
              builder: (context, _) => CustomPaint(
                painter: _FakeMapPainter(dashPhase: _dashController.value),
              ),
            ),
          ),

          // destination pin
          const Positioned(
            left: 0.50 * 390 - 22,
            top: 0.19 * 812 - 52,
            child: _DestinationPin(),
          ),

          // live user pulsing dot
          Positioned(
            left: 0.50 * 390 - 20,
            top: 0.76 * 812 - 20,
            child: AnimatedBuilder(
              animation: _pulseController,
              builder: (context, _) => _PulseDot(progress: _pulseController.value),
            ),
          ),

          // top bar
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  _RoundIconButton(
                    icon: Icons.arrow_back_rounded,
                    onTap: () => Navigator.of(context).maybePop(),
                  ),
                  AnimatedBuilder(
                    animation: _pulseController,
                    builder: (context, _) => Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(99),
                        boxShadow: [
                          BoxShadow(color: Colors.black.withOpacity(0.08), blurRadius: 8),
                        ],
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Container(
                            width: 8,
                            height: 8,
                            decoration: const BoxDecoration(
                                color: AppColors.brand500, shape: BoxShape.circle),
                          ),
                          const SizedBox(width: 8),
                          Text('LIVE · ETA ${widget.etaText}',
                              style: const TextStyle(
                                  fontSize: 11.5,
                                  fontWeight: FontWeight.w800,
                                  color: AppColors.brand700)),
                        ],
                      ),
                    ),
                  ),
                  const _RoundIconButton(icon: Icons.my_location_rounded),
                ],
              ),
            ),
          ),

          // bottom bolt-style sheet
          Positioned(
            left: 0,
            right: 0,
            bottom: 0,
            child: Container(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 28),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(26)),
                boxShadow: [
                  BoxShadow(color: Colors.black.withOpacity(0.08), blurRadius: 30, offset: const Offset(0, -10)),
                ],
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 40,
                    height: 4,
                    margin: const EdgeInsets.only(bottom: 16),
                    decoration:
                        BoxDecoration(color: AppColors.line, borderRadius: BorderRadius.circular(99)),
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
                        child: const Icon(Icons.local_pharmacy_rounded,
                            color: AppColors.brand700, size: 20),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(widget.pharmacyName,
                                style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w800)),
                            Text('${widget.distance} · ${widget.address}',
                                style: const TextStyle(fontSize: 11.5, color: AppColors.muted)),
                          ],
                        ),
                      ),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(widget.etaText,
                              style: const TextStyle(
                                  fontSize: 16, fontWeight: FontWeight.w800, color: AppColors.brand600)),
                          const Text('arriving',
                              style: TextStyle(fontSize: 10, color: AppColors.muted)),
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
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      ),
                      icon: const Icon(Icons.navigation_rounded, size: 16),
                      label: Text('Navigate (${widget.distance})',
                          style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
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
          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.08), blurRadius: 8)],
        ),
        child: Icon(icon, size: 18, color: AppColors.ink),
      ),
    );
  }
}

class _DestinationPin extends StatelessWidget {
  const _DestinationPin();

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 44,
          height: 44,
          decoration: BoxDecoration(
            color: Colors.white,
            shape: BoxShape.circle,
            border: Border.all(color: AppColors.brand600, width: 2),
            boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.15), blurRadius: 10)],
          ),
          child: const Icon(Icons.local_pharmacy_rounded, color: AppColors.brand700, size: 18),
        ),
        CustomPaint(size: const Size(12, 8), painter: _TrianglePainter()),
      ],
    );
  }
}

class _TrianglePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()..color = Colors.white;
    final path = Path()
      ..moveTo(0, 0)
      ..lineTo(size.width, 0)
      ..lineTo(size.width / 2, size.height)
      ..close();
    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

/// Pulsing "live location" dot — a solid center dot with an expanding,
/// fading ring animated by [progress] (0..1, looped by the caller).
class _PulseDot extends StatelessWidget {
  final double progress;
  const _PulseDot({required this.progress});

  @override
  Widget build(BuildContext context) {
    final ringSize = 16 + progress * 32;
    final ringOpacity = (1 - progress).clamp(0.0, 1.0) * 0.45;

    return SizedBox(
      width: 48,
      height: 48,
      child: Stack(
        alignment: Alignment.center,
        children: [
          Container(
            width: ringSize,
            height: ringSize,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: AppColors.brand500.withOpacity(ringOpacity),
            ),
          ),
          Container(
            width: 16,
            height: 16,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: AppColors.brand600,
              border: Border.all(color: Colors.white, width: 2),
            ),
          ),
        ],
      ),
    );
  }
}

/// Draws a simplified, stylized street map (no real tiles) with an
/// animated dashed route, matching the Bolt-style mockup. Swap this out
/// for google_maps_flutter / flutter_map + a real polyline once you wire
/// up live driver coordinates.
class _FakeMapPainter extends CustomPainter {
  final double dashPhase;
  _FakeMapPainter({required this.dashPhase});

  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;

    canvas.drawRect(Rect.fromLTWH(0, 0, w, h), Paint()..color = const Color(0xFFE7ECE4));

    final mainRoad = Paint()
      ..color = const Color(0xFFF7C948)
      ..strokeWidth = 14
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;
    final mainRoadPath = Path()
      ..moveTo(0, h * 0.76)
      ..cubicTo(w * 0.23, h * 0.69, w * 0.36, h * 0.66, w * 0.5, h * 0.59)
      ..cubicTo(w * 0.64, h * 0.52, w * 0.67, h * 0.37, w * 0.54, h * 0.18);
    canvas.drawPath(mainRoadPath, mainRoad);

    final minorRoad = Paint()
      ..color = const Color(0xFFD7DDD3)
      ..strokeWidth = 9;
    canvas.drawLine(Offset(-20, h * 0.31), Offset(w + 20, h * 0.37), minorRoad);
    canvas.drawLine(Offset(-20, h * 0.52), Offset(w + 20, h * 0.47), minorRoad);
    canvas.drawLine(Offset(w * 0.15, -20), Offset(w * 0.31, h + 20), minorRoad..strokeWidth = 8);
    canvas.drawLine(Offset(w * 0.82, -20), Offset(w * 0.72, h + 20), minorRoad..strokeWidth = 7);

    final blockPaint = Paint()..color = const Color(0xFFCFD6CA);
    final blocks = [
      Rect.fromLTWH(w * 0.08, h * 0.15, 26, 26),
      Rect.fromLTWH(w * 0.20, h * 0.25, 34, 22),
      Rect.fromLTWH(w * 0.64, h * 0.11, 30, 30),
      Rect.fromLTWH(w * 0.77, h * 0.22, 22, 34),
      Rect.fromLTWH(w * 0.10, h * 0.59, 30, 24),
      Rect.fromLTWH(w * 0.36, h * 0.74, 26, 26),
      Rect.fromLTWH(w * 0.67, h * 0.64, 28, 28),
    ];
    for (final b in blocks) {
      canvas.drawRect(b, blockPaint..color = const Color(0xFFCFD6CA).withOpacity(0.5));
    }

    // animated dashed route from user (bottom) to destination (top)
    final routePaint = Paint()
      ..color = AppColors.brand600
      ..strokeWidth = 5
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;
    final routePath = Path()
      ..moveTo(w * 0.5, h * 0.76)
      ..cubicTo(w * 0.56, h * 0.66, w * 0.51, h * 0.59, w * 0.525, h * 0.49)
      ..cubicTo(w * 0.54, h * 0.39, w * 0.5, h * 0.28, w * 0.525, h * 0.20);

    _drawDashedPath(canvas, routePath, routePaint, dashWidth: 10, gapWidth: 10, phase: dashPhase * 20);
  }

  void _drawDashedPath(Canvas canvas, Path path, Paint paint,
      {required double dashWidth, required double gapWidth, required double phase}) {
    for (final metric in path.computeMetrics()) {
      double distance = -phase % (dashWidth + gapWidth);
      while (distance < metric.length) {
        final start = max(0.0, distance);
        final end = min(metric.length, distance + dashWidth);
        if (end > start) {
          canvas.drawPath(metric.extractPath(start, end), paint);
        }
        distance += dashWidth + gapWidth;
      }
    }
  }

  @override
  bool shouldRepaint(covariant _FakeMapPainter oldDelegate) => oldDelegate.dashPhase != dashPhase;
}
