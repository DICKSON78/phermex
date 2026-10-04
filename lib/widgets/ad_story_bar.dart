import 'package:flutter/material.dart';
import '../l10n/app_localizations.dart';
import '../models/models.dart';
import '../services/reel_service.dart';
import '../theme.dart';

/// Header for the reel row. Loads the live reels itself and hides entirely when
/// no pharmacy currently has one — there are no placeholder campaigns.
class AdStoryBar extends StatefulWidget {
  final ValueChanged<int> onTapStory;
  const AdStoryBar({super.key, required this.onTapStory});

  @override
  State<AdStoryBar> createState() => _AdStoryBarState();
}

class _AdStoryBarState extends State<AdStoryBar> {
  int _count = 0;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final reels = await ReelService.fetchReels();
    if (!mounted) return;
    setState(() => _count = reels.length);
  }

  @override
  Widget build(BuildContext context) {
    if (_count == 0) return const SizedBox.shrink();
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
            onTap: () => widget.onTapStory(0),
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
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final reels = await ReelService.fetchReels();
    if (!mounted) return;
    setState(() {
      _reels = reels;
      _loading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    // Nothing live: render no row at all rather than inventing campaigns.
    if (_loading || _reels.isEmpty) return const SizedBox.shrink();
    final count = _reels.length;

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
            return _ReelStoryBubble(
              reel: _reels[i],
              slotWidth: AdStoryReel._kBubbleSlot,
              bubbleSize: AdStoryReel._kBubbleSize,
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
