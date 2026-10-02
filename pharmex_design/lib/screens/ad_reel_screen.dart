import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

class AdReel {
  final String pharmacyName;
  final String postedAgo;
  final IconData icon;
  final String headline;
  final String subtext;
  final String ctaLabel;

  const AdReel({
    required this.pharmacyName,
    required this.postedAgo,
    required this.icon,
    required this.headline,
    required this.subtext,
    this.ctaLabel = 'Shop Now',
  });
}

/// Full-screen story/reel viewer. Push this after tapping an [AdStoryBar]
/// item. Segments auto-advance; tap the left third to go back, the right
/// two-thirds to skip forward. Swipe down to dismiss.
class AdReelScreen extends StatefulWidget {
  final List<AdReel> reels;
  final int startIndex;
  final Duration segmentDuration;
  final VoidCallback? onCta;

  const AdReelScreen({
    super.key,
    this.reels = const [
      AdReel(
        pharmacyName: 'Faid Pharmacy',
        postedAgo: '2h',
        icon: Icons.local_pharmacy_rounded,
        headline: '30% OFF\nSkincare Week',
        subtext: 'Valid at all Faid Pharmacy branches until Sep 20',
      ),
    ],
    this.startIndex = 0,
    this.segmentDuration = const Duration(seconds: 5),
    this.onCta,
  });

  @override
  State<AdReelScreen> createState() => _AdReelScreenState();
}

class _AdReelScreenState extends State<AdReelScreen> with SingleTickerProviderStateMixin {
  late int _index = widget.startIndex;
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this, duration: widget.segmentDuration)
      ..addStatusListener((status) {
        if (status == AnimationStatus.completed) _next();
      })
      ..forward();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _next() {
    if (_index < widget.reels.length - 1) {
      setState(() => _index++);
      _controller
        ..reset()
        ..forward();
    } else {
      Navigator.of(context).pop();
    }
  }

  void _prev() {
    if (_index > 0) {
      setState(() => _index--);
      _controller
        ..reset()
        ..forward();
    }
  }

  @override
  Widget build(BuildContext context) {
    final reel = widget.reels[_index];

    return Scaffold(
      backgroundColor: const Color(0xFF0A1F16),
      body: GestureDetector(
        onVerticalDragEnd: (d) {
          if ((d.primaryVelocity ?? 0) > 200) Navigator.of(context).pop();
        },
        onTapUp: (details) {
          final w = MediaQuery.of(context).size.width;
          if (details.localPosition.dx < w / 3) {
            _prev();
          } else {
            _controller.stop();
            _next();
          }
        },
        child: SafeArea(
          child: Column(
            children: [
              // progress segments
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
                child: Row(
                  children: List.generate(widget.reels.length, (i) {
                    return Expanded(
                      child: Container(
                        height: 3,
                        margin: EdgeInsets.only(right: i == widget.reels.length - 1 ? 0 : 6),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.25),
                          borderRadius: BorderRadius.circular(99),
                        ),
                        child: Align(
                          alignment: Alignment.centerLeft,
                          child: AnimatedBuilder(
                            animation: _controller,
                            builder: (context, _) {
                              double value = 0;
                              if (i < _index) value = 1;
                              if (i == _index) value = _controller.value;
                              return FractionallySizedBox(
                                widthFactor: value,
                                child: Container(
                                  decoration: BoxDecoration(
                                    color: Colors.white,
                                    borderRadius: BorderRadius.circular(99),
                                  ),
                                ),
                              );
                            },
                          ),
                        ),
                      ),
                    );
                  }),
                ),
              ),
              // header
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
                child: Row(
                  children: [
                    Container(
                      width: 36,
                      height: 36,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: LinearGradient(
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                          colors: [AppColors.brand500, AppColors.brand800],
                        ),
                      ),
                      child: Icon(reel.icon, color: Colors.white, size: 16),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(reel.pharmacyName,
                              style: const TextStyle(
                                  color: Colors.white, fontSize: 13, fontWeight: FontWeight.w800)),
                          Text('Sponsored · ${reel.postedAgo}',
                              style: TextStyle(color: Colors.white.withOpacity(0.55), fontSize: 10.5)),
                        ],
                      ),
                    ),
                    IconButton(
                      onPressed: () => Navigator.of(context).pop(),
                      icon: const Icon(Icons.close_rounded, color: Colors.white),
                    ),
                  ],
                ),
              ),
              // content
              Expanded(
                child: Container(
                  width: double.infinity,
                  margin: const EdgeInsets.symmetric(horizontal: 0),
                  decoration: BoxDecoration(
                    gradient: RadialGradient(
                      center: Alignment.topCenter,
                      radius: 1.3,
                      colors: const [
                        Color(0xFF1A9C6A),
                        Color(0xFF0A3327),
                        Color(0xFF06140F),
                      ],
                      stops: const [0, 0.6, 1],
                    ),
                  ),
                  child: Center(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 32),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Container(
                            width: 96,
                            height: 96,
                            decoration: BoxDecoration(
                              color: Colors.white.withOpacity(0.95),
                              borderRadius: BorderRadius.circular(24),
                              boxShadow: [
                                BoxShadow(
                                    color: Colors.black.withOpacity(0.3),
                                    blurRadius: 24,
                                    offset: const Offset(0, 8)),
                              ],
                            ),
                            child: Icon(reel.icon, color: AppColors.brand700, size: 44),
                          ),
                          const SizedBox(height: 24),
                          Text(
                            reel.headline,
                            textAlign: TextAlign.center,
                            style: const TextStyle(
                                color: Colors.white,
                                fontSize: 26,
                                height: 1.15,
                                fontWeight: FontWeight.w800),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            reel.subtext,
                            textAlign: TextAlign.center,
                            style: TextStyle(color: Colors.white.withOpacity(0.75), fontSize: 13),
                          ),
                          const SizedBox(height: 32),
                          ElevatedButton(
                            onPressed: widget.onCta,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.white,
                              foregroundColor: AppColors.brand800,
                              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(99)),
                            ),
                            child: Text(reel.ctaLabel,
                                style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700)),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
              // reply bar
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 12, 20, 20),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(99),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.send_rounded, color: Colors.white, size: 15),
                      const SizedBox(width: 10),
                      Text('Send message',
                          style: TextStyle(color: Colors.white.withOpacity(0.7), fontSize: 12.5)),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
