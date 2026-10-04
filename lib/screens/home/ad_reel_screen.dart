import 'package:flutter/material.dart';
import '../../l10n/app_localizations.dart';
import '../../models/models.dart';
import '../../services/reel_service.dart';
import '../../theme.dart';

/// Fullscreen ad "reel" — shows live reels posted by pharmacies. The backend
/// allows one reel per pharmacy and each reel expires after 24 hours, so every
/// slide here is a real, currently-live promotion. When nothing is live the
/// screen shows an empty state; there are no placeholder reels.
class AdReelScreen extends StatefulWidget {
  const AdReelScreen({super.key});

  @override
  State<AdReelScreen> createState() => _AdReelScreenState();
}

class _AdReelScreenState extends State<AdReelScreen> {
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

  int _index = 0;

  void _openPharmacy(int index) {
    Navigator.of(context).pop(_index);
  }

  @override
  Widget build(BuildContext context) {
    final L = AppLocalizations.of(context);
    return Scaffold(
      backgroundColor: AppColors.brand900,
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(8, 0, 16, 0),
              child: Row(
                children: [
                  IconButton(
                    onPressed: () => Navigator.of(context).maybePop(),
                    icon: const Icon(Icons.close_rounded, color: Colors.white, size: 22),
                  ),
                  Expanded(
                    child: Text(L.t('shop.todaysHighlights'),
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                            color: Colors.white, fontSize: 14, fontWeight: FontWeight.w700)),
                  ),
                  const SizedBox(width: 40),
                ],
              ),
            ),
            const SizedBox(height: 4),
            Expanded(
              child: _loading
                  ? const Center(child: CircularProgressIndicator(color: Colors.white))
                  : _reels.isEmpty
                      ? const _NoReels()
                      : PageView.builder(
                          itemCount: _reels.length,
                          onPageChanged: (i) => setState(() => _index = i),
                          itemBuilder: (context, i) => _PharmacyReelSlide(
                            reel: _reels[i],
                            onOpen: () => _openPharmacy(i),
                          ),
                        ),
            ),
            if (!_loading && _reels.isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(bottom: 24),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: List.generate(_reels.length, (i) {
                    final active = i == _index;
                    return AnimatedContainer(
                      duration: const Duration(milliseconds: 250),
                      width: active ? 18 : 6,
                      height: 6,
                      margin: const EdgeInsets.symmetric(horizontal: 3),
                      decoration: BoxDecoration(
                        color: active ? Colors.white : Colors.white.withValues(alpha: 0.35),
                        borderRadius: BorderRadius.circular(99),
                      ),
                    );
                  }),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

/// Shown when no pharmacy has a live reel. There are no placeholder reels —
/// an empty feed simply says so.
class _NoReels extends StatelessWidget {
  const _NoReels();

  @override
  Widget build(BuildContext context) {
    final L = AppLocalizations.of(context);
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 40),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.storefront_rounded, size: 56, color: Colors.white.withValues(alpha: 0.35)),
            const SizedBox(height: 16),
            Text(
              L.t('misc.noReelsRightNow'),
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 16,
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              L.t('misc.noReelsBody'),
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.white.withValues(alpha: 0.7), fontSize: 13),
            ),
          ],
        ),
      ),
    );
  }
}

class _PharmacyReelSlide extends StatelessWidget {
  final PharmacyReel reel;
  final VoidCallback onOpen;
  const _PharmacyReelSlide({required this.reel, required this.onOpen});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        color: AppColors.promo,
        borderRadius: BorderRadius.circular(24),
      ),
      clipBehavior: Clip.antiAlias,
      child: Stack(
        fit: StackFit.expand,
        children: [
          Image.network(
            reel.thumbnailUrl ?? reel.mediaUrl,
            fit: BoxFit.cover,
            errorBuilder: (context, error, stack) => Container(
              color: AppColors.promo,
              alignment: Alignment.center,
              child: Icon(
                reel.isVideo ? Icons.play_circle_outline_rounded : Icons.image_outlined,
                color: Colors.white70,
                size: 56,
              ),
            ),
            loadingBuilder: (context, child, progress) => progress == null
                ? child
                : const Center(child: CircularProgressIndicator(color: Colors.white)),
          ),
          Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  Colors.black.withValues(alpha: 0.15),
                  Colors.black.withValues(alpha: 0.55),
                ],
              ),
            ),
          ),
          if (reel.isVideo)
            Center(
              child: Container(
                width: 62,
                height: 62,
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.22),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.play_arrow_rounded, color: Colors.white, size: 34),
              ),
            ),
          Positioned(
            left: 20,
            right: 20,
            bottom: 20,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                if (reel.pharmacyName != null)
                  Text(
                    reel.pharmacyName!,
                    style: const TextStyle(
                        color: Colors.white, fontSize: 13, fontWeight: FontWeight.w800),
                  ),
                const SizedBox(height: 6),
                Text(
                  reel.title,
                  maxLines: 3,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                      color: Colors.white, fontSize: 20, fontWeight: FontWeight.w800),
                ),
                if (reel.description != null && reel.description!.trim().isNotEmpty) ...[
                  const SizedBox(height: 6),
                  Text(
                    reel.description!,
                    maxLines: 3,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.85), fontSize: 13),
                  ),
                ],
              ],
            ),
          ),
          Positioned(
            right: 16,
            top: 16,
            child: Material(
              color: Colors.white.withValues(alpha: 0.2),
              shape: const CircleBorder(),
              child: InkWell(
                customBorder: const CircleBorder(),
                onTap: onOpen,
                child: const Padding(
                  padding: EdgeInsets.all(10),
                  child: Icon(Icons.arrow_forward_rounded, color: Colors.white, size: 18),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
