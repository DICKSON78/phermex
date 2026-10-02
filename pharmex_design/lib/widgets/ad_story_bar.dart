import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

class AdStory {
  final String label;
  final IconData icon;
  final List<Color> gradient;
  final bool seen;

  const AdStory({
    required this.label,
    required this.icon,
    required this.gradient,
    this.seen = false,
  });
}

/// Horizontal row of "status" style circles above the search bar.
/// Tap a story to open [AdReelScreen] (or push whatever full-screen
/// reel viewer you use) for that ad.
class AdStoryBar extends StatelessWidget {
  final List<AdStory> stories;
  final ValueChanged<int>? onTapStory;

  const AdStoryBar({
    super.key,
    this.stories = const [
      AdStory(
        label: '30% Off\nSkincare',
        icon: Icons.local_pharmacy_rounded,
        gradient: [AppColors.brand500, AppColors.brand800],
      ),
      AdStory(
        label: 'New\nPharmacy',
        icon: Icons.stars_rounded,
        gradient: [Color(0xFFE8B04B), Color(0xFFB9762A)],
      ),
      AdStory(
        label: 'Rx\nDelivery',
        icon: Icons.description_rounded,
        gradient: [Color(0xFF7C4FE0), Color(0xFF4B2E94)],
        seen: true,
      ),
      AdStory(
        label: 'Ask a\nDoctor',
        icon: Icons.medical_information_rounded,
        gradient: [Color(0xFF22C55E), Color(0xFF0C5C40)],
      ),
    ],
    this.onTapStory,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.fromLTRB(24, 14, 24, 10),
      child: SizedBox(
        height: 92,
        child: ListView.separated(
          scrollDirection: Axis.horizontal,
          itemCount: stories.length,
          separatorBuilder: (_, __) => const SizedBox(width: 16),
          itemBuilder: (context, i) {
            final s = stories[i];
            return GestureDetector(
              onTap: () => onTapStory?.call(i),
              child: Column(
                children: [
                  Container(
                    width: 64,
                    height: 64,
                    padding: const EdgeInsets.all(2.5),
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: s.seen
                          ? null
                          : SweepGradient(
                              colors: [
                                AppColors.gold,
                                const Color(0xFFFF7A59),
                                AppColors.brand500,
                                AppColors.gold,
                              ],
                            ),
                      color: s.seen ? AppColors.line : null,
                    ),
                    child: Container(
                      padding: const EdgeInsets.all(2),
                      decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle),
                      child: Container(
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          gradient: LinearGradient(
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                            colors: s.gradient,
                          ),
                        ),
                        child: Icon(s.icon, color: Colors.white, size: 22),
                      ),
                    ),
                  ),
                  const SizedBox(height: 5),
                  Text(
                    s.label,
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 9.5,
                      fontWeight: FontWeight.w700,
                      color: s.seen ? AppColors.muted : AppColors.ink,
                      height: 1.15,
                    ),
                  ),
                ],
              ),
            );
          },
        ),
      ),
    );
  }
}
