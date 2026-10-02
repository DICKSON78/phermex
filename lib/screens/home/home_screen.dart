import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import '../../models/models.dart';
import '../../services/api_service.dart';
import '../../services/customer_repository.dart';
import '../../services/pharmacy_cache.dart';
import '../../l10n/app_localizations.dart';
import '../../theme.dart';
import '../../utils/helpers.dart';
import '../notifications/notifications_screen.dart';
import '../pharmacy/pharmacy_detail_screen.dart';
import '../telemedicine/telemedicine_screen.dart';
import '../../widgets/app_drawer.dart';
import 'all_pharmacies_screen.dart';

class HomeScreen extends StatefulWidget {
  final int unreadNotifications;
  final int refreshTick;
  const HomeScreen({
    super.key,
    this.unreadNotifications = 0,
    this.refreshTick = 0,
  });

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  List<Pharmacy> _pharmacies = [];
  bool _loading = true;
  bool _loadedOnce = false;
  final _autoRefresh = AutoRefresh();
  String? _error;
  String? _search;
  final _searchController = TextEditingController();
  String _userName = '';

  @override
  void initState() {
    super.initState();
    _userName = ApiService.userName ?? '';
    _load();
    _autoRefresh.start(const Duration(seconds: 60), () {
      if (mounted) _load(silent: true);
    });
  }

  @override
  void didUpdateWidget(covariant HomeScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.refreshTick != oldWidget.refreshTick) _load(silent: true);
  }

  @override
  void dispose() {
    _searchController.dispose();
    _autoRefresh.stop();
    super.dispose();
  }

  void _clearSearch() {
    _searchController.clear();
    setState(() => _search = null);
    _load(silent: true);
  }

  void _openCategory(String category) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => AllPharmaciesScreen(initialCategory: category),
      ),
    );
  }

  void _openAllPharmacies() {
    Navigator.of(
      context,
    ).push(MaterialPageRoute(builder: (_) => const AllPharmaciesScreen()));
  }

  String _greeting() {
    final L = AppLocalizations.of(context);
    final h = DateTime.now().hour;
    if (h < 12) return L.t('shop.goodMorning');
    if (h < 17) return L.t('shop.goodAfternoon');
    return L.t('shop.goodEvening');
  }

  Future<void> _load({bool silent = false, bool skipCache = false}) async {
    final cacheKey = PharmacyCache.keyFor(scope: 'nearby', search: _search);
    // Nearby renders from cache immediately and refreshes quietly, so the
    // cards never disappear behind a spinner on repeated visits. The refresh
    // skips the cache branch, otherwise it would call itself forever.
    if (!skipCache) {
      final cached = PharmacyCache.has(cacheKey) ? PharmacyCache.cached : null;
      if (cached != null) {
        setState(() {
          _pharmacies = cached;
          _loadedOnce = true;
          _loading = false;
        });
        _load(silent: true, skipCache: true);
        return;
      }
    }
    setState(() => _loading = silent ? false : !_loadedOnce);
    var usedFallbackLocation = false;
    try {
      Position? pos;
      try {
        var enabled = await Geolocator.isLocationServiceEnabled();
        if (enabled) {
          var perm = await Geolocator.checkPermission();
          if (perm == LocationPermission.denied) {
            perm = await Geolocator.requestPermission();
          }
          if (perm == LocationPermission.whileInUse ||
              perm == LocationPermission.always) {
            pos = await Geolocator.getCurrentPosition();
          }
        }
      } catch (_) {}
      usedFallbackLocation = pos == null;
      final L = AppLocalizations.of(context);
      final lat = pos?.latitude ?? -6.7924;
      final lng = pos?.longitude ?? 39.2083;
      List<Pharmacy> pharmacies = const [];
      String? sectionError;
      try {
        pharmacies = await CustomerRepository.nearby(
          latitude: lat,
          longitude: lng,
          radiusKm: 100,
          search: _search,
        );
      } catch (_) {
        sectionError = L.t('shop.pharmaciesLoadError');
      }
      if (!mounted) return;
      PharmacyCache.store(cacheKey, pharmacies);
      setState(() {
        _pharmacies = pharmacies;
        _error = sectionError;
        _loadedOnce = true;
      });
      if (usedFallbackLocation) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(L.t('shop.locationUnavailableSnackbar')),
            behavior: SnackBarBehavior.floating,
            duration: const Duration(seconds: 4),
          ),
        );
      }
    } catch (e) {
      if (mounted) setState(() => _error = ApiService.friendlyError(e));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final L = AppLocalizations.of(context);
    return Scaffold(
      extendBodyBehindAppBar: true,
      backgroundColor: AppColors.sand,
      drawer: const AppDrawer(),
      body: Column(
        children: [
          _HeroHeader(
            customerName: _userName.trim().isNotEmpty
                ? _userName.trim()
                : L.t('shop.shopper'),
            greeting: _greeting(),
            unreadNotifications: widget.unreadNotifications,
            onNotifications: () => Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => const NotificationsScreen()),
            ),
            onMenu: () => Scaffold.of(context).openDrawer(),
            searchController: _searchController,
            onSearchSubmitted: (v) {
              setState(() => _search = v.isEmpty ? null : v);
              _load(silent: true);
            },
            onSearchClear: _clearSearch,
          ),
          Expanded(
            child: RefreshIndicator(
              color: AppColors.brand600,
              onRefresh: _load,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const SizedBox(height: 16),
                    _DoctorBanner(
                      onTap: () => Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (_) => const TelemedicineScreen(),
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),
                    Text(
                      L.t('shop.shopByCategory'),
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w800,
                        color: AppColors.ink,
                      ),
                    ),
                    const SizedBox(height: 12),
                    _CategoryRow(onSelect: _openCategory),
                    const SizedBox(height: 24),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          L.t('shop.nearbyPharmacies'),
                          style: const TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w800,
                            color: AppColors.ink,
                          ),
                        ),
                        GestureDetector(
                          onTap: _openAllPharmacies,
                          child: Row(
                            children: [
                              Text(
                                L.t('shop.viewAll'),
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
                    const SizedBox(height: 12),
                    if (_loading)
                      const Padding(
                        padding: EdgeInsets.symmetric(vertical: 40),
                        child: Center(
                          child: CircularProgressIndicator(
                            color: AppColors.brand600,
                          ),
                        ),
                      )
                    else if (_error != null) ...[
                      _ErrorBox(message: _error!, onRetry: _load),
                      const SizedBox(height: 12),
                    ] else if (_pharmacies.isEmpty)
                      Padding(
                        padding: const EdgeInsets.symmetric(vertical: 40),
                        child: Center(
                          child: Text(
                            L.t('shop.noPharmaciesFoundNearby'),
                            style: const TextStyle(
                              fontSize: 13,
                              color: AppColors.muted,
                            ),
                          ),
                        ),
                      )
                    else
                      _NearbyPharmacies(pharmacies: _pharmacies),
                    const SizedBox(height: 24),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ---- Hero header ----------------------------------------------------------
class _HeroHeader extends StatefulWidget {
  final String customerName;
  final String greeting;
  final int unreadNotifications;
  final VoidCallback onNotifications;
  final VoidCallback onMenu;
  final TextEditingController searchController;
  final ValueChanged<String> onSearchSubmitted;
  final VoidCallback onSearchClear;

  const _HeroHeader({
    required this.customerName,
    required this.greeting,
    required this.unreadNotifications,
    required this.onNotifications,
    required this.onMenu,
    required this.searchController,
    required this.onSearchSubmitted,
    required this.onSearchClear,
  });

  @override
  State<_HeroHeader> createState() => _HeroHeaderState();
}

class _HeroHeaderState extends State<_HeroHeader> {
  @override
  Widget build(BuildContext context) {
    final topPad = MediaQuery.paddingOf(context).top;
    final L = AppLocalizations.of(context);
    return Container(
      width: double.infinity,
      padding: EdgeInsets.fromLTRB(24, topPad + 12, 24, 22),
      decoration: const BoxDecoration(color: AppColors.header),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              GestureDetector(
                onTap: widget.onMenu,
                child: Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: AppColors.sand,
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.menu_rounded,
                    color: AppColors.brand600,
                    size: 18,
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      widget.greeting,
                      style: TextStyle(
                        color: Colors.white.withOpacity(0.6),
                        fontSize: 12.5,
                        fontFamily: 'Poppins',
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      widget.customerName,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 20,
                        fontWeight: FontWeight.w800,
                        fontFamily: 'Poppins',
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      L.t('shop.tagline'),
                      style: TextStyle(
                        color: Colors.white.withOpacity(0.55),
                        fontSize: 12.5,
                        fontFamily: 'Poppins',
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              GestureDetector(
                onTap: widget.onNotifications,
                child: Stack(
                  clipBehavior: Clip.none,
                  children: [
                    Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: AppColors.sand,
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.notifications_none_rounded,
                        color: AppColors.brand600,
                        size: 18,
                      ),
                    ),
                    if (widget.unreadNotifications > 0)
                      Positioned(
                        right: 0,
                        top: 0,
                        child: Container(
                          padding: const EdgeInsets.all(4),
                          decoration: const BoxDecoration(
                            color: Color(0xFFDC2626),
                            shape: BoxShape.circle,
                          ),
                          child: Text(
                            widget.unreadNotifications > 9
                                ? '9+'
                                : '${widget.unreadNotifications}',
                            style: const TextStyle(
                              fontSize: 8,
                              fontWeight: FontWeight.w700,
                              color: Colors.white,
                              height: 1,
                              fontFamily: 'Poppins',
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 18),
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
            ),
            child: Row(
              children: [
                const SizedBox(width: 16),
                const Icon(Icons.search, size: 18, color: AppColors.muted),
                const SizedBox(width: 10),
                Expanded(
                  child: TextField(
                    controller: widget.searchController,
                    onChanged: (_) => setState(() {}),
                    onSubmitted: widget.onSearchSubmitted,
                    decoration: InputDecoration(
                      hintText: L.t('shop.searchMedicinesOrPharmacies'),
                      hintStyle: TextStyle(
                        color: AppColors.muted,
                        fontSize: 13.5,
                      ),
                      border: InputBorder.none,
                      enabledBorder: InputBorder.none,
                      focusedBorder: InputBorder.none,
                      isDense: true,
                      contentPadding: EdgeInsets.symmetric(vertical: 14),
                      filled: false,
                    ),
                    style: const TextStyle(
                      fontSize: 13.5,
                      fontFamily: 'Poppins',
                      color: AppColors.ink,
                    ),
                    textInputAction: TextInputAction.search,
                  ),
                ),
                if (widget.searchController.text.isNotEmpty)
                  IconButton(
                    icon: const Icon(
                      Icons.clear,
                      size: 18,
                      color: AppColors.muted,
                    ),
                    onPressed: widget.onSearchClear,
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ---- Doctor banner --------------------------------------------------------
class _DoctorBanner extends StatelessWidget {
  final VoidCallback onTap;
  const _DoctorBanner({required this.onTap});

  @override
  Widget build(BuildContext context) {
    final L = AppLocalizations.of(context);
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: AppColors.promo,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    L.t('shop.talkToADoctor'),
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 15,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    L.t('shop.videoConsultsAnytime'),
                    style: TextStyle(
                      color: Colors.white.withOpacity(0.75),
                      fontSize: 11,
                    ),
                  ),
                  const SizedBox(height: 10),
                  ElevatedButton.icon(
                    onPressed: onTap,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.white,
                      foregroundColor: AppColors.brand800,
                      padding: const EdgeInsets.symmetric(
                        horizontal: 14,
                        vertical: 6,
                      ),
                      minimumSize: const Size(0, 0),
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(99),
                      ),
                    ),
                    icon: const Icon(Icons.videocam_rounded, size: 14),
                    label: Text(
                      L.t('shop.startCallNow'),
                      style: const TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            Container(
              width: 56,
              height: 56,
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.12),
                borderRadius: BorderRadius.circular(14),
              ),
              child: const Icon(
                Icons.local_hospital_rounded,
                color: Colors.white,
                size: 26,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ---- Category row ---------------------------------------------------------
const kHomeCategories = <String>[
  'Pain Relief',
  'Antibiotics',
  'Vitamins',
  'Cough',
  'First Aid',
];

const kCategoryIcons = <String, IconData>{
  'Pain Relief': Icons.healing_rounded,
  'Antibiotics': Icons.medication_rounded,
  'Vitamins': Icons.shield_rounded,
  'Cough': Icons.child_care_rounded,
  'First Aid': Icons.medical_services_rounded,
};

class _CategoryRow extends StatelessWidget {
  final ValueChanged<String> onSelect;
  const _CategoryRow({required this.onSelect});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: kHomeCategories
          .map(
            (c) => GestureDetector(
              onTap: () => onSelect(c),
              child: Column(
                children: [
                  Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: AppColors.mint50,
                      borderRadius: BorderRadius.circular(13),
                      border: Border.all(color: AppColors.line),
                    ),
                    child: Icon(
                      kCategoryIcons[c] ?? Icons.category_rounded,
                      size: 20,
                      color: AppColors.brand600,
                    ),
                  ),
                  const SizedBox(height: 6),
                  SizedBox(
                    width: 56,
                    child: Text(
                      c,
                      textAlign: TextAlign.center,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontSize: 9.5,
                        fontWeight: FontWeight.w700,
                        color: AppColors.ink,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          )
          .toList(),
    );
  }
}

// ---- Nearby pharmacies ----------------------------------------------------
class _NearbyPharmacies extends StatelessWidget {
  final List<Pharmacy> pharmacies;
  const _NearbyPharmacies({required this.pharmacies});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: pharmacies
          .take(2)
          .map(
            (p) => Expanded(
              child: Padding(
                padding: const EdgeInsets.only(right: 12),
                child: _NearbyPharmacyCard(pharmacy: p),
              ),
            ),
          )
          .toList(),
    );
  }
}

class _PharmacyFallbackArt extends StatelessWidget {
  const _PharmacyFallbackArt();

  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppColors.promo,
      alignment: Alignment.center,
      child: Container(
        width: 44,
        height: 44,
        decoration: const BoxDecoration(
          color: Colors.white,
          shape: BoxShape.circle,
        ),
        child: const Icon(
          Icons.local_pharmacy_rounded,
          color: AppColors.brand700,
          size: 20,
        ),
      ),
    );
  }
}

class _NearbyPharmacyCard extends StatelessWidget {
  final Pharmacy pharmacy;
  const _NearbyPharmacyCard({required this.pharmacy});

  @override
  Widget build(BuildContext context) {
    final L = AppLocalizations.of(context);
    final distance = pharmacy.distance != null
        ? '${pharmacy.distance!.toStringAsFixed(1)} km'
        : '0.0 km';
    // Prefer the uploaded cover image, then the logo, and only fall back to
    // the flat green tile when the pharmacy has neither.
    final imageUrl =
        AppHelpers.imageUrl(pharmacy.coverImage) ??
        AppHelpers.imageUrl(pharmacy.logo);
    return GestureDetector(
      onTap: () => Navigator.of(context).push(
        MaterialPageRoute(
          builder: (_) => PharmacyDetailScreen(pharmacy: pharmacy),
        ),
      ),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          border: Border.all(color: AppColors.line),
          borderRadius: BorderRadius.circular(16),
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              height: 112,
              decoration: const BoxDecoration(color: AppColors.promo),
              // Pharmacies that uploaded artwork show it; the rest keep the
              // flat green tile with the pharmacy glyph.
              child: Stack(
                fit: StackFit.expand,
                children: [
                  if (imageUrl != null)
                    CachedNetworkImage(
                      imageUrl: imageUrl,
                      fit: BoxFit.cover,
                      placeholder: (_, __) => const SizedBox.shrink(),
                      errorWidget: (_, __, ___) => _PharmacyFallbackArt(),
                    )
                  else
                    _PharmacyFallbackArt(),
                  Positioned(
                    top: 8,
                    right: 8,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.black.withOpacity(0.45),
                        borderRadius: BorderRadius.circular(99),
                      ),
                      child: Text(
                        distance,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(10),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    pharmacy.name ?? L.t('shop.pharmacy'),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 12.5,
                      fontWeight: FontWeight.w700,
                      color: AppColors.ink,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Row(
                    children: [
                      const Icon(
                        Icons.location_on,
                        size: 10,
                        color: AppColors.muted,
                      ),
                      const SizedBox(width: 3),
                      Expanded(
                        child: Text(
                          pharmacy.locationLabel.isEmpty
                              ? L.t('shop.pharmacy')
                              : pharmacy.locationLabel,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            fontSize: 10.5,
                            color: AppColors.muted,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ErrorBox extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;
  const _ErrorBox({required this.message, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    final L = AppLocalizations.of(context);
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.line),
      ),
      child: Column(
        children: [
          Text(
            message,
            textAlign: TextAlign.center,
            style: const TextStyle(color: AppColors.muted, fontSize: 13),
          ),
          const SizedBox(height: 10),
          OutlinedButton(onPressed: onRetry, child: Text(L.t('shop.retry'))),
        ],
      ),
    );
  }
}
