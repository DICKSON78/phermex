import 'package:flutter/material.dart';
import '../l10n/app_localizations.dart';
import '../models/models.dart';
import '../services/reel_service.dart';
import '../theme.dart';

/// Horizontal ad-story bar. Shows real pharmacy reels when the backend has any,
/// otherwise the placeholder campaigns.
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

/// The story "reel" row — one bubble per pharmacy. The backend allows a
/// pharmacy only one reel, so a pharmacy never appears twice in this row.
class AdStoryReel extends StatefulWidget {
  final ValueChanged<int> onTapStory;
  const AdStoryReel({super.key, required this.onTapStory});

  /// Outer ring diameter of a story bubble.
  static const double _kBubbleSize = 48;

  /// Fixed slot width so captions of different lengths stay aligned.
  static const double _kBubbleSlot = 66;

  @override
  State<AdStoryReel> createState() => _AdStoryReelState();
}

class _AdStoryReelState extends State<AdStoryReel> {
  List<PharmacyReel> _reels = const [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final reels = await ReelService.fetchReels();
    if (!mounted) return;
    setState(() => _reels = reels);
  }

  @override
  Widget build(BuildContext context) {
    final useReels = _reels.isNotEmpty;
    final count = useReels ? _reels.length : AdStoryBar._placeholderAds.length;

    return Container(
      width: double.infinity,
      color: Colors.white,
      padding: const EdgeInsets.only(top: 14, bottom: 18),
      child: SizedBox(
        height: 100,
        child: ListView.separated(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: 24),
          itemCount: count,
          separatorBuilder: (_, _) => const SizedBox(width: 8),
          itemBuilder: (context, i) {
            if (useReels) {
              return _ReelStoryBubble(
                reel: _reels[i],
                slotWidth: AdStoryReel._kBubbleSlot,
                bubbleSize: AdStoryReel._kBubbleSize,
                onTap: () => widget.onTapStory(i),
              );
            }
            return _StoryBubble(
              ad: AdStoryBar._placeholderAds[i],
              slotWidth: AdStoryReel._kBubbleSlot,
              onTap: () => widget.onTapStory(i),
            );
          },
        ),
      ),
    );
  }
}

class _ReelStoryBubble extends StatelessWidget {
  final PharmacyReel reel;
  final double slotWidth;
  final double bubbleSize;
  final VoidCallback onTap;

  const _ReelStoryBubble({
    required this.reel,
    required this.slotWidth,
    required this.bubbleSize,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final caption = reel.pharmacyName ?? reel.title;

    return GestureDetector(
      onTap: onTap,
      child: SizedBox(
        width: slotWidth,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: bubbleSize,
              height: bubbleSize,
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
                clipBehavior: Clip.antiAlias,
                child: Image.network(
                  reel.thumbnailUrl ?? reel.mediaUrl,
                  width: bubbleSize - 12,
                  height: bubbleSize - 12,
                  fit: BoxFit.cover,
                  errorBuilder: (context, error, stack) => Container(
                    width: bubbleSize - 12,
                    height: bubbleSize - 12,
                    color: AppColors.mint50,
                    alignment: Alignment.center,
                    child: Icon(
                      reel.isVideo ? Icons.play_circle_outline_rounded : Icons.storefront_rounded,
                      size: 18,
                      color: AppColors.brand600,
                    ),
                  ),
                  loadingBuilder: (context, child, progress) => progress == null
                      ? child
                      : Container(
                          width: bubbleSize - 12,
                          height: bubbleSize - 12,
                          color: AppColors.mint50,
                        ),
                ),
              ),
            ),
            const SizedBox(height: 6),
            SizedBox(
              width: slotWidth - 6,
              child: Text(
                caption,
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
