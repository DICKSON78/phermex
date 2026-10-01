import 'package:flutter/material.dart';
import '../../l10n/app_localizations.dart';
import '../../theme.dart';

/// Fullscreen ad "reel" — placeholder promotional slides until the backend
/// exposes real campaign content.
class AdReelScreen extends StatefulWidget {
  const AdReelScreen({super.key});

  @override
  State<AdReelScreen> createState() => _AdReelScreenState();
}

class _AdReelScreenState extends State<AdReelScreen> {
  List<(String, String)> get _slides {
    final L = AppLocalizations.of(context);
    return [
      (L.t('shop.adPharmacyBonanza'), L.t('shop.adPharmacyBonanzaBody')),
      (L.t('shop.adSeasonalSale'), L.t('shop.adSeasonalSaleBody')),
      (L.t('healthTips'), L.t('shop.adHealthTipsBody')),
      (L.t('shop.adNewArrivals'), L.t('shop.adNewArrivalsBody')),
    ];
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
              child: PageView.builder(
                itemCount: _slides.length,
                onPageChanged: (i) => setState(() => _index = i),
                itemBuilder: (context, i) => _ReelSlide(
                  data: _slides[i],
                  onOpen: () => _openPharmacy(i),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.only(bottom: 24),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(_slides.length, (i) {
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

class _ReelSlide extends StatelessWidget {
  final (String, String) data;
  final VoidCallback onOpen;
  const _ReelSlide({required this.data, required this.onOpen});

  @override
  Widget build(BuildContext context) {
    final L = AppLocalizations.of(context);
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 24),
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: AppColors.promo,
        borderRadius: BorderRadius.circular(24),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 72,
            height: 72,
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.15),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.percent_rounded, color: Colors.white, size: 30),
          ),
          const SizedBox(height: 20),
          Text(data.$1,
              textAlign: TextAlign.center,
              style: const TextStyle(
                  color: Colors.white, fontSize: 20, fontWeight: FontWeight.w800)),
          const SizedBox(height: 10),
          Text(data.$2,
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.white.withValues(alpha: 0.8), fontSize: 13.5)),
          const SizedBox(height: 24),
          SizedBox(
            height: 46,
            child: ElevatedButton(
              onPressed: onOpen,
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.white,
                foregroundColor: AppColors.brand800,
                padding: const EdgeInsets.symmetric(horizontal: 28),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(99)),
              ),
              child: Text(L.t('shop.explore'),
                  style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13.5)),
            ),
          ),
        ],
      ),
    );
  }
}