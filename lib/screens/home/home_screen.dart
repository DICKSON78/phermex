import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import '../../models/models.dart';
import '../../services/api_service.dart';
import '../../services/customer_repository.dart';
import '../../theme.dart';
import '../../utils/helpers.dart';
import '../notifications/notifications_screen.dart';
import '../pharmacy/pharmacy_detail_screen.dart';
import '../telemedicine/telemedicine_screen.dart';
import 'all_pharmacies_screen.dart';

// M-TAI / Vantage design language adapted to Pharmex.
// Light surface, white rounded cards with subtle shadow, tinted status pills,
// rounded icon tiles, section headers with counts.

class HomeScreen extends StatefulWidget {
  final int unreadNotifications;
  final int refreshTick;
  const HomeScreen({super.key, this.unreadNotifications = 0, this.refreshTick = 0});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  List<Pharmacy> _pharmacies = [];
  bool _loading = true;
  String? _error;
  String? _search;
  final _searchController = TextEditingController();
  String _userName = '';

  @override
  void initState() {
    super.initState();
    _userName = ApiService.userName ?? '';
    _load();
  }

  @override
  void didUpdateWidget(covariant HomeScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.refreshTick != oldWidget.refreshTick) _load();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _clearSearch() {
    _searchController.clear();
    setState(() => _search = null);
    _load();
  }

  void _openCategory(String category) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => AllPharmaciesScreen(initialCategory: category),
      ),
    );
  }

  void _openAllPharmacies() {
    Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => const AllPharmaciesScreen()),
    );
  }

  String _greeting() {
    final h = DateTime.now().hour;
    final name = _userName.isNotEmpty ? ' ${_userName.split(' ').first}' : '';
    if (h < 12) return 'Good morning$name';
    if (h < 17) return 'Good afternoon$name';
    return 'Good evening$name';
  }

  String get _avatarInitial {
    final first = _userName.trim().split(RegExp(r'\s+')).first;
    return first.isNotEmpty ? first[0].toUpperCase() : 'H';
  }

  Future<void> _load() async {
    setState(() => _loading = true);
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
          if (perm == LocationPermission.whileInUse || perm == LocationPermission.always) {
            pos = await Geolocator.getCurrentPosition();
          }
        }
      } catch (_) {}
      usedFallbackLocation = pos == null;
      final lat = pos?.latitude ?? -6.7924;
      final lng = pos?.longitude ?? 39.2083;
      // Fetch pharmacies. Use a wide radius so pharmacies always show.
      List<Pharmacy> pharmacies = const [];
      String? sectionError;
      try {
        pharmacies = await CustomerRepository.nearby(
            latitude: lat, longitude: lng, radiusKm: 100, search: _search);
      } catch (_) {
        sectionError = 'Could not load pharmacies. Pull to refresh.';
      }
      if (!mounted) return;
      setState(() {
        _pharmacies = pharmacies;
        _error = sectionError;
      });
      if (usedFallbackLocation) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('Location unavailable — showing pharmacies in Dar es Salaam. Enable location for results near you.'),
          behavior: SnackBarBehavior.floating,
          duration: Duration(seconds: 4),
        ));
      }
    } catch (e) {
      if (mounted) setState(() => _error = ApiService.friendlyError(e));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final topInset = MediaQuery.paddingOf(context).top;
    return Scaffold(
      backgroundColor: AppTheme.bgLight,
      body: Column(
        children: [
          _BannerHeader(
            topPadding: topInset,
            greeting: _greeting(),
            name: _userName.trim().isNotEmpty ? _userName.trim() : 'Shopper',
            tagline: AppStrings.tagline,
            initial: _avatarInitial,
            unreadNotifications: widget.unreadNotifications,
            onNotifications: () => Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => const NotificationsScreen()),
            ),
            searchController: _searchController,
            onSearchSubmitted: (v) {
              setState(() => _search = v.isEmpty ? null : v);
              _load();
            },
            onSearchClear: _clearSearch,
          ),

          _DoctorBanner(
            onTap: () => Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => const TelemedicineScreen()),
            ),
          ),

          _CategoryChips(
            onSelect: _openCategory,
          ),

          Expanded(
            child: RefreshIndicator(
              color: AppTheme.primary,
              onRefresh: _load,
              child: ListView(
                padding: EdgeInsets.zero,
                children: [
                  _NearbySection(
                    nearbyKey: _nearbyKey,
                    pharmacies: _pharmacies,
                    loading: _loading,
                    error: _error,
                    onRetry: _load,
                    onViewAll: _openAllPharmacies,
                  ),

                  const SizedBox(height: 28),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  final GlobalKey _nearbyKey = GlobalKey();
}

// ---- Banner header (movie-app style) --------------------------------------
// The greeting, avatar, name, notification, subtitle and search input all sit
// on a dark gradient hero banner with a big decorative doctor image peeking
// from the right — like a movie app's featured backdrop.
class _BannerHeader extends StatefulWidget {
  final double topPadding;
  final String greeting;
  final String name;
  final String tagline;
  final String initial;
  final int unreadNotifications;
  final VoidCallback onNotifications;
  final TextEditingController searchController;
  final ValueChanged<String> onSearchSubmitted;
  final VoidCallback onSearchClear;

  const _BannerHeader({
    required this.topPadding,
    required this.greeting,
    required this.name,
    required this.tagline,
    required this.initial,
    required this.unreadNotifications,
    required this.onNotifications,
    required this.searchController,
    required this.onSearchSubmitted,
    required this.onSearchClear,
  });

  @override
  State<_BannerHeader> createState() => _BannerHeaderState();
}

class _BannerHeaderState extends State<_BannerHeader> {
  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF0A2B1C), AppTheme.dark],
        ),
        borderRadius: BorderRadius.vertical(bottom: Radius.circular(32)),
      ),
      child: SafeArea(
        bottom: false,
        child: Padding(
          padding: EdgeInsets.fromLTRB(20, widget.topPadding + 10, 20, 0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Greeting / name / notification row + doctor art
              Stack(
                children: [
                  // Decorative doctor image on the right (like a movie backdrop)
                  Positioned(
                    right: -14,
                    top: -4,
                    width: 150,
                    height: 150,
                    child: Opacity(
                      opacity: 0.9,
                      child: Image.network(
                        'https://img.freepik.com/free-vector/doctor-character-background_1270-84.jpg',
                        fit: BoxFit.contain,
                        errorBuilder: (_, __, ___) => const SizedBox.shrink(),
                      ),
                    ),
                  ),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        width: 48,
                        height: 48,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(color: Colors.white, width: 1.6),
                          color: Colors.white24,
                        ),
                        alignment: Alignment.center,
                        child: Text(
                          widget.initial,
                          style: const TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.w700,
                            color: Colors.white,
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(widget.greeting,
                                style: const TextStyle(
                                    fontSize: 13,
                                    color: Colors.white70,
                                    fontWeight: FontWeight.w500)),
                            const SizedBox(height: 2),
                            Text(widget.name,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                    fontSize: 21,
                                    fontWeight: FontWeight.w800,
                                    color: Colors.white)),
                            const SizedBox(height: 2),
                            Text(widget.tagline,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                    fontSize: 12, color: Colors.white60)),
                          ],
                        ),
                      ),
                      const SizedBox(width: 8),
                      GestureDetector(
                        onTap: widget.onNotifications,
                        child: Container(
                          width: 44,
                          height: 44,
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.14),
                            shape: BoxShape.circle,
                          ),
                          alignment: Alignment.center,
                          child: Stack(
                            clipBehavior: Clip.none,
                            children: [
                              const Icon(Icons.notifications_none,
                                  size: 23, color: Colors.white),
                              if (widget.unreadNotifications > 0)
                                Positioned(
                                  right: 1,
                                  top: 1,
                                  child: Container(
                                    padding: const EdgeInsets.all(3),
                                    decoration: const BoxDecoration(
                                      color: Color(0xFFDC2626),
                                      shape: BoxShape.circle,
                                    ),
                                  ),
                                ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),

              const SizedBox(height: 18),

              // Search input on the banner (frosted style)
              Container(
                height: 46,
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.16),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: Colors.white24),
                ),
                child: Row(
                  children: [
                    const SizedBox(width: 14),
                    const Icon(Icons.search, size: 20, color: Colors.white70),
                    const SizedBox(width: 10),
                    Expanded(
                      child: TextField(
                        controller: widget.searchController,
                        onChanged: (_) => setState(() {}),
                        onSubmitted: widget.onSearchSubmitted,
                        decoration: const InputDecoration(
                          hintText: 'Search medicines or pharmacies...',
                          hintStyle:
                              TextStyle(fontSize: 14, color: Colors.white60),
                          border: InputBorder.none,
                          enabledBorder: InputBorder.none,
                          focusedBorder: InputBorder.none,
                          isDense: true,
                          contentPadding: EdgeInsets.symmetric(vertical: 12),
                        ),
                        style: const TextStyle(
                            fontSize: 14,
                            fontFamily: 'Poppins',
                            color: Colors.white),
                        textInputAction: TextInputAction.search,
                      ),
                    ),
                    if (widget.searchController.text.isNotEmpty)
                      IconButton(
                        icon: const Icon(Icons.clear,
                            size: 18, color: Colors.white70),
                        onPressed: widget.onSearchClear,
                      ),
                  ],
                ),
              ),

              // Soft fade into the light body content below
              const SizedBox(
                height: 22,
                child: DecoratedBox(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [Colors.transparent, AppTheme.bgLight],
                    ),
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

// ---- Category chips (replaces trust row) ----------------------------------
const kHomeCategories = <String>[
  'Pain Relief',
  'Antibiotics',
  'Vitamins',
  'Cough & Cold',
  'First Aid',
  'Skin Care',
  'Baby Care',
  'Digestive Health',
];

const kCategoryIcons = <String, IconData>{
  'Pain Relief': Icons.healing_outlined,
  'Antibiotics': Icons.medication_outlined,
  'Vitamins': Icons.health_and_safety_outlined,
  'Cough & Cold': Icons.face_outlined,
  'First Aid': Icons.medical_services_outlined,
  'Skin Care': Icons.spa_outlined,
  'Baby Care': Icons.child_care_outlined,
  'Digestive Health': Icons.lunch_dining_outlined,
};

class _CategoryChips extends StatelessWidget {
  final ValueChanged<String> onSelect;
  const _CategoryChips({required this.onSelect});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Padding(
          padding: EdgeInsets.fromLTRB(20, 16, 20, 8),
          child: Text('Shop by Category',
              style: TextStyle(
                  fontSize: 16, fontWeight: FontWeight.w700, color: AppTheme.textDark)),
        ),
        SizedBox(
          height: 96,
          child: ListView(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            scrollDirection: Axis.horizontal,
            children: kHomeCategories.map((name) {
              return Padding(
                padding: const EdgeInsets.only(right: 12),
                child: GestureDetector(
                  onTap: () => onSelect(name),
                  child: SizedBox(
                    width: 64,
                    child: Column(
                      children: [
                        Container(
                          width: 52,
                          height: 52,
                          decoration: BoxDecoration(
                            color: AppTheme.primary.withOpacity(0.12),
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: Icon(kCategoryIcons[name] ?? Icons.category_outlined,
                              size: 24, color: AppTheme.primaryDark),
                        ),
                        const SizedBox(height: 6),
                        Text(name,
                            textAlign: TextAlign.center,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                                fontSize: 10,
                                color: AppTheme.textMuted,
                                fontWeight: FontWeight.w500,
                                height: 1.1)),
                      ],
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
        ),
      ],
    );
  }
}

// ---- Doctor banner ---------------------------------------------------------
class _DoctorBanner extends StatelessWidget {
  final VoidCallback onTap;
  const _DoctorBanner({required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 4),
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          height: 128,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(20),
            gradient: const LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [Color(0xFF1A7F37), AppTheme.primaryDark],
            ),
            boxShadow: [
              BoxShadow(
                color: AppTheme.primaryDark.withOpacity(0.3),
                blurRadius: 14,
                offset: const Offset(0, 5),
              ),
            ],
          ),
          child: Stack(
            children: [
              // Text column
              Padding(
                padding: const EdgeInsets.fromLTRB(18, 16, 110, 14),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Talk to a Doctor',
                        style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w800,
                            color: Colors.white)),
                    const SizedBox(height: 5),
                    Text('Video consultation with\npharmacists & doctors',
                        style: TextStyle(
                            fontSize: 11.5,
                            color: Colors.white.withOpacity(0.85),
                            height: 1.4)),
                    const SizedBox(height: 9),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(999),
                      ),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.videocam, size: 13, color: AppTheme.primaryDark),
                          SizedBox(width: 5),
                          Text('Start call now',
                              style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w700,
                                  color: AppTheme.primaryDark)),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              // Decorative doctor illustration
              Positioned(
                right: 2,
                top: 14,
                width: 120,
                bottom: 0,
                child: Image.network(
                  'https://img.freepik.com/free-vector/doctor-character-background_1270-84.jpg',
                  fit: BoxFit.contain,
                  errorBuilder: (_, __, ___) => _doctorFallback(),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _doctorFallback() {
    return Container(
      width: 104,
      margin: const EdgeInsets.only(bottom: 8),
      decoration: const BoxDecoration(
        shape: BoxShape.circle,
        color: Colors.white24,
      ),
      child: const Icon(Icons.medical_services,
          size: 56, color: Colors.white),
    );
  }
}

// ---- Nearby pharmacies section -------------------------------------------
class _NearbySection extends StatelessWidget {
  final GlobalKey nearbyKey;
  final List<Pharmacy> pharmacies;
  final bool loading;
  final String? error;
  final VoidCallback onRetry;
  final VoidCallback onViewAll;
  const _NearbySection({
    required this.nearbyKey,
    required this.pharmacies,
    required this.loading,
    required this.error,
    required this.onRetry,
    required this.onViewAll,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      key: nearbyKey,
      padding: const EdgeInsets.fromLTRB(20, 22, 20, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Nearby Pharmacies',
                  style: TextStyle(
                      fontSize: 16, fontWeight: FontWeight.w700, color: AppTheme.textDark)),
              GestureDetector(
                onTap: onViewAll,
                child: Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: AppTheme.primary.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text('View all',
                          style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                              color: AppTheme.primaryDark)),
                      SizedBox(width: 4),
                      Icon(Icons.chevron_right,
                          size: 14, color: AppTheme.primaryDark),
                    ],
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          if (loading)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 28),
              child: Center(
                child: CircularProgressIndicator(color: AppTheme.primary),
              ),
            )
          else if (error != null) ...[
            _ErrorBox(message: error!, onRetry: onRetry),
            const SizedBox(height: 12),
          ] else if (pharmacies.isEmpty)
            _EmptyBox(
              icon: Icons.location_on_outlined,
              message: 'No pharmacies found nearby',
            )
          else
            SizedBox(
              height: _NearbyPharmacyCard.cardHeight,
              child: ListView(
                scrollDirection: Axis.horizontal,
                children: pharmacies
                    .map((p) => Padding(
                          padding: const EdgeInsets.only(right: 12),
                          child: _NearbyPharmacyCard(pharmacy: p),
                        ))
                    .toList(),
              ),
            ),
        ],
      ),
    );
  }
}

class _NearbyPharmacyCard extends StatelessWidget {
  final Pharmacy pharmacy;
  const _NearbyPharmacyCard({required this.pharmacy});

  // Fixed dimensions for the movie-style horizontal poster row.
  static const double cardHeight = 214;
  static const double cardWidth = 164;

  @override
  Widget build(BuildContext context) {
    final distance = pharmacy.distance != null
        ? '${pharmacy.distance!.toStringAsFixed(1)} km'
        : '';
    return GestureDetector(
      onTap: () => Navigator.of(context).push(
        MaterialPageRoute(
            builder: (_) => PharmacyDetailScreen(pharmacy: pharmacy)),
      ),
      child: SizedBox(
        width: cardWidth,
        height: cardHeight,
        child: ClipRRect(
          borderRadius: BorderRadius.circular(18),
          child: Container(
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: const [
                BoxShadow(
                    color: Color(0x12000000), blurRadius: 10, offset: Offset(0, 3)),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Cover image / placeholder
                SizedBox(
                  height: 116,
                  width: double.infinity,
                  child: Stack(
                    fit: StackFit.expand,
                    children: [
                      pharmacy.coverImage != null &&
                              pharmacy.coverImage!.isNotEmpty
                          ? Image.network(
                              pharmacy.coverImage!,
                              fit: BoxFit.cover,
                              errorBuilder: (_, __, ___) => _coverFallback(),
                            )
                          : _coverFallback(),
                      // Dark gradient overlay for legibility
                      const DecoratedBox(
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.topCenter,
                            end: Alignment.bottomCenter,
                            colors: [Colors.transparent, Color(0x77000000)],
                          ),
                        ),
                      ),
                      // Circular pharmacist profile / logo
                      Positioned(
                        left: 10,
                        bottom: 8,
                        child: _profileAvatar(),
                      ),
                      if (distance.isNotEmpty)
                        Positioned(
                          top: 8,
                          right: 8,
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 7, vertical: 3),
                            decoration: BoxDecoration(
                              color: Colors.black.withOpacity(0.5),
                              borderRadius: BorderRadius.circular(999),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(Icons.navigation,
                                    size: 11, color: Colors.white),
                                const SizedBox(width: 2),
                                Text(distance,
                                    style: const TextStyle(
                                        fontSize: 10,
                                        fontWeight: FontWeight.w700,
                                        color: Colors.white)),
                              ],
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.fromLTRB(10, 9, 10, 0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(pharmacy.name ?? 'Pharmacy',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w700,
                              color: AppTheme.textDark)),
                      const SizedBox(height: 3),
                      Row(
                        children: [
                          const Icon(Icons.place_outlined,
                              size: 12, color: Color(0xFF94A3B8)),
                          const SizedBox(width: 3),
                          Expanded(
                            child: Text(
                              pharmacy.locationLabel.isEmpty
                                  ? 'Pharmacy'
                                  : pharmacy.locationLabel,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                  fontSize: 11, color: Color(0xFF94A3B8)),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Row(
                        children: [
                          if (pharmacy.hasRating)
                            Row(
                              children: [
                                const Icon(Icons.star,
                                    size: 12, color: Color(0xFFFBBF24)),
                                const SizedBox(width: 3),
                                Text('${pharmacy.rating!.toStringAsFixed(1)}',
                                    style: const TextStyle(
                                        fontSize: 11,
                                        fontWeight: FontWeight.w700,
                                        color: Color(0xFFF59E0B))),
                              ],
                            )
                          else ...[
                            const Icon(Icons.schedule,
                                size: 12, color: AppTheme.primaryDark),
                            const SizedBox(width: 3),
                            Text(pharmacy.openLabel.isEmpty
                                ? 'Open'
                                : pharmacy.openLabel,
                                style: const TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w600,
                                    color: AppTheme.primaryDark)),
                          ],
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _profileAvatar() {
    final avatar = pharmacy.logo != null && pharmacy.logo!.isNotEmpty
        ? pharmacy.logo!
        : null;
    return Container(
      width: 44,
      height: 44,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        border: Border.all(color: Colors.white, width: 2),
        color: Colors.white,
      ),
      child: avatar != null
          ? ClipOval(
              child: Image.network(
                avatar,
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => _avatarFallback(),
              ),
            )
          : _avatarFallback(),
    );
  }

  Widget _avatarFallback() {
    return Container(
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [AppTheme.primary, AppTheme.primaryDark],
        ),
      ),
      child: const Center(
        child: Icon(Icons.local_pharmacy, size: 20, color: Colors.white),
      ),
    );
  }

  Widget _coverFallback() {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [AppTheme.primary, AppTheme.primaryDark],
        ),
      ),
      child: const Center(
        child: Icon(Icons.local_pharmacy, size: 42, color: Colors.white70),
      ),
    );
  }
}

// ---- Empty box ------------------------------------------------------------
class _EmptyBox extends StatelessWidget {
  final IconData icon;
  final String message;
  const _EmptyBox({required this.icon, required this.message});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 32),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFEEF1F0)),
      ),
      child: Column(
        children: [
          Icon(icon, size: 26, color: const Color(0xFFD1D5DB)),
          const SizedBox(height: 8),
          Text(message,
              style: const TextStyle(fontSize: 14, color: Color(0xFF6B7280))),
        ],
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
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.red.shade50,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.red.shade200),
      ),
      child: Column(
        children: [
          Text(message,
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.red.shade700, fontSize: 13)),
          const SizedBox(height: 10),
          OutlinedButton(onPressed: onRetry, child: const Text('Retry')),
        ],
      ),
    );
  }
}
