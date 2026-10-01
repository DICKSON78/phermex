import 'package:flutter/material.dart';
import '../l10n/app_localizations.dart';
import '../theme.dart';

/// Horizontal ad-story bar. Currently fed with placeholder campaigns until the
/// backend exposes real promotional content.
class AdStoryBar extends StatelessWidget {
  final ValueChanged<int> onTapStory;
  const AdStoryBar({super.key, required this.onTapStory});

  static const _placeholderAds = [
    ('misc.adPharmacyBonanza', Icons.local_pharmacy_rounded),
    ('misc.adSeasonalSale', Icons.percent_rounded),
    ('misc.adHealthTips', Icons.health_and_safety_rounded),
    ('misc.adNewArrivals', Icons.new_releases_rounded),
  ];

  @override
  Widget build(BuildContext context) {
    final L = AppLocalizations.of(context);
    return Container(
      width: double.infinity,
      color: Colors.white,
      padding: const EdgeInsets.fromLTRB(24, 4, 24, 12),
      child: Row(
        children: [
          Expanded(
            child: Text(L.t('misc.todaysHighlights'),
                style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w800)),
          ),
          GestureDetector(
            onTap: () => onTapStory(0),
            child: Row(
              children: [
                Text(L.t('misc.viewAll'),
                    style: const TextStyle(
                        fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.brand600)),
                const Icon(Icons.chevron_right, size: 14, color: AppColors.brand600),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// The story "reel" row — circular avatars for the placeholder campaigns.
class AdStoryReel extends StatelessWidget {
  final ValueChanged<int> onTapStory;
  const AdStoryReel({super.key, required this.onTapStory});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 96,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 24),
        itemCount: AdStoryBar._placeholderAds.length,
        separatorBuilder: (_, __) => const SizedBox(width: 12),
        itemBuilder: (context, i) {
          final ad = AdStoryBar._placeholderAds[i];
          return _StoryBubble(ad: ad, onTap: () => onTapStory(i));
        },
      ),
    );
  }
}

class _StoryBubble extends StatelessWidget {
  final (String, IconData) ad;
  final VoidCallback onTap;
  const _StoryBubble({required this.ad, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final L = AppLocalizations.of(context);
    return GestureDetector(
      onTap: onTap,
      child: SizedBox(
        width: 64,
        child: Column(
          children: [
            Container(
              width: 56,
              height: 56,
              padding: const EdgeInsets.all(3),
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [Color(0xFF22C55E), Color(0xFF0E3324)],
                ),
              ),
              child: Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white, width: 2),
                ),
                alignment: Alignment.center,
                child: Icon(ad.$2, size: 20, color: AppColors.brand700),
              ),
            ),
            const SizedBox(height: 6),
            Text(L.t(ad.$1),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: AppColors.muted)),
          ],
        ),
      ),
    );
  }
}