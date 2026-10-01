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
            child: Text(
              L.t('misc.todaysHighlights'),
              style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w800),
            ),
          ),
          GestureDetector(
            onTap: () => onTapStory(0),
            child: Row(
              children: [
                Text(
                  L.t('misc.viewAll'),
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: AppColors.brand600,
                  ),
                ),
                const Icon(
                  Icons.chevron_right,
                  size: 14,
                  color: AppColors.brand600,
                ),
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

  /// Outer ring diameter of a story bubble.
  static const double _kBubbleSize = 48;

  /// Fixed slot width so captions of different lengths stay aligned.
  static const double _kBubbleSlot = 66;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      color: Colors.white,
      padding: const EdgeInsets.only(top: 14, bottom: 18),
      child: SizedBox(
        height: 100,
        child: ListView.separated(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: 24),
          itemCount: AdStoryBar._placeholderAds.length,
          separatorBuilder: (_, __) => const SizedBox(width: 8),
          itemBuilder: (context, i) {
            final ad = AdStoryBar._placeholderAds[i];
            return _StoryBubble(
              ad: ad,
              slotWidth: _kBubbleSlot,
              onTap: () => onTapStory(i),
            );
          },
        ),
      ),
    );
  }
}

class _StoryBubble extends StatelessWidget {
  final (String, IconData) ad;
  final double slotWidth;
  final VoidCallback onTap;
  const _StoryBubble({
    required this.ad,
    required this.slotWidth,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final L = AppLocalizations.of(context);
    return GestureDetector(
      onTap: onTap,
      child: SizedBox(
        width: slotWidth,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Instagram-style story ring: gradient circle wrapping a light
            // inner disc that holds the campaign icon.
            Container(
              width: AdStoryReel._kBubbleSize,
              height: AdStoryReel._kBubbleSize,
              padding: const EdgeInsets.all(2.5),
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [Color(0xFF22C55E), Color(0xFF0E3324)],
                ),
              ),
              child: Container(
                decoration: const BoxDecoration(
                  color: Colors.white,
                  shape: BoxShape.circle,
                ),
                alignment: Alignment.center,
                child: Container(
                  width: AdStoryReel._kBubbleSize - 12,
                  height: AdStoryReel._kBubbleSize - 12,
                  decoration: const BoxDecoration(
                    color: AppColors.mint50,
                    shape: BoxShape.circle,
                  ),
                  alignment: Alignment.center,
                  child: Icon(ad.$2, size: 18, color: AppColors.brand600),
                ),
              ),
            ),
            const SizedBox(height: 6),
            // Single line with a trailing ellipsis keeps every caption on the
            // same baseline instead of wrapping and breaking alignment.
            SizedBox(
              width: slotWidth - 6,
              child: Text(
                L.t(ad.$1),
                textAlign: TextAlign.center,
                maxLines: 1,
                softWrap: false,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w700,
                  color: AppColors.ink,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
