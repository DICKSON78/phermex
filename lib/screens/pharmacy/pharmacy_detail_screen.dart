import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/models.dart';
import '../../services/api_service.dart';
import '../../services/customer_repository.dart';
import '../../state/cart_state.dart';
import '../../theme.dart';
import '../../utils/helpers.dart';
import '../cart/cart_screen.dart';
import 'drug_detail_screen.dart';
import 'pharmacy_reviews_screen.dart';

class PharmacyDetailScreen extends StatefulWidget {
  final Pharmacy pharmacy;
  const PharmacyDetailScreen({super.key, required this.pharmacy});

  @override
  State<PharmacyDetailScreen> createState() => _PharmacyDetailScreenState();
}

class _PharmacyDetailScreenState extends State<PharmacyDetailScreen> {
  List<Drug> _drugs = [];
  List<DrugCategory> _categories = [];
  bool _loading = true;
  String? _error;
  String? _search;
  int? _selectedCategory;
  final _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _load();
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

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final drugsFuture = CustomerRepository.pharmacyDrugs(widget.pharmacy.id, search: _search, categoryId: _selectedCategory);
      final catsFuture = CustomerRepository.pharmacyCategories(widget.pharmacy.id);
      final results = await Future.wait<Object>([drugsFuture, catsFuture]);
      if (!mounted) return;
      setState(() {
        _drugs = (results[0] as List).cast<Drug>();
        _categories = (results[1] as List).cast<DrugCategory>();
        _error = null;
      });
    } catch (e) {
      if (mounted) setState(() => _error = ApiService.friendlyError(e));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _addToCart(Drug drug) {
    context.read<CartState>().add(
          drug,
          pharmacyId: widget.pharmacy.id,
          pharmacyName: widget.pharmacy.name ?? 'Pharmacy',
        );
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('${drug.name ?? 'Item'} added to cart'),
        backgroundColor: AppTheme.dark,
        behavior: SnackBarBehavior.floating,
        duration: const Duration(milliseconds: 1200),
        action: SnackBarAction(
          label: 'View Cart',
          textColor: AppTheme.primary,
          onPressed: () => Navigator.of(context).push(
            MaterialPageRoute(builder: (_) => const CartScreen()),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final distance = widget.pharmacy.distance;
    return Scaffold(
      backgroundColor: AppTheme.bgLight,
      appBar: AppBar(
        title: Text(widget.pharmacy.name ?? 'Pharmacy'),
      ),
      body: Column(
        children: [
          // Info bar
          Container(
            color: Colors.white,
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
            child: Row(
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: AppTheme.primary.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(Icons.local_pharmacy, size: 20, color: AppTheme.primary),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        widget.pharmacy.locationLabel.isEmpty ? 'Location on request' : widget.pharmacy.locationLabel,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(fontSize: 12, color: Color(0xFF6B7280)),
                      ),
                      if (distance != null)
                        Text('${distance.toStringAsFixed(1)} km away',
                            style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppTheme.primary)),
                    ],
                  ),
                ),
                if (widget.pharmacy.hasRating)
                  GestureDetector(
                    onTap: () => Navigator.of(context).push(
                      MaterialPageRoute(
                          builder: (_) => PharmacyReviewsScreen(pharmacy: widget.pharmacy)),
                    ),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFEF3C7),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.star, size: 10, color: Color(0xFFFBBF24)),
                          const SizedBox(width: 3),
                          Text(widget.pharmacy.rating!.toStringAsFixed(1),
                              style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: Color(0xFFD97706))),
                        ],
                      ),
                    ),
                  ),
              ],
            ),
          ),

          // Store details & hours
          if (widget.pharmacy.openLabel.isNotEmpty ||
              widget.pharmacy.description != null ||
              widget.pharmacy.workingDays != null)
            Container(
              color: Colors.white,
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    widget.pharmacy.description ?? '',
                    style: const TextStyle(
                        fontSize: 13,
                        height: 1.4,
                        color: Color(0xFF6B7280)),
                  ),
                  if (widget.pharmacy.openLabel.isNotEmpty) ...[
                    const SizedBox(height: 12),
                    _DetailRow(
                      icon: Icons.schedule,
                      title: 'Opening Hours',
                      value: widget.pharmacy.openLabel,
                    ),
                  ],
                  if (widget.pharmacy.workingDays != null &&
                      widget.pharmacy.workingDays!.isNotEmpty)
                    _DetailRow(
                      icon: Icons.calendar_today_outlined,
                      title: 'Working Days',
                      value: widget.pharmacy.workingDays!.join(', '),
                    ),
                  if (widget.pharmacy.street != null &&
                      widget.pharmacy.street!.isNotEmpty)
                    _DetailRow(
                      icon: Icons.place_outlined,
                      title: 'Location',
                      value: [
                        widget.pharmacy.street,
                        if (widget.pharmacy.locationLabel.isNotEmpty)
                          widget.pharmacy.locationLabel,
                      ].whereType<String>().join(', '),
                    ),
                  if (widget.pharmacy.email != null &&
                      widget.pharmacy.email!.isNotEmpty)
                    _DetailRow(
                      icon: Icons.email_outlined,
                      title: 'Email',
                      value: widget.pharmacy.email!,
                    ),
                ],
              ),
            ),

          // Call / Directions actions
          Container(
            color: Colors.white,
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
            child: Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () {
                      final phone = widget.pharmacy.phone;
                      if (phone != null && phone.isNotEmpty) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text('Call $phone'), behavior: SnackBarBehavior.floating),
                        );
                      }
                    },
                    icon: const Icon(Icons.phone, size: 16),
                    label: const Text('Call'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () {
                      final lat = widget.pharmacy.latitude;
                      final lng = widget.pharmacy.longitude;
                      if (lat != null && lng != null) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                              content: Text('Opening maps...'), behavior: SnackBarBehavior.floating),
                        );
                      }
                    },
                    icon: const Icon(Icons.directions, size: 16),
                    label: const Text('Directions'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () => Navigator.of(context).push(
                      MaterialPageRoute(
                          builder: (_) => PharmacyReviewsScreen(pharmacy: widget.pharmacy)),
                    ),
                    icon: Icon(Icons.star_border,
                        size: 16,
                        color: widget.pharmacy.hasRating
                            ? const Color(0xFFFBBF24)
                            : Theme.of(context).colorScheme.primary),
                    label: const Text('Reviews'),
                  ),
                ),
              ],
            ),
          ),

          // Search + category chips
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 14, 20, 8),
            child: Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFEEF1F0)),
              ),
              child: TextField(
                controller: _searchController,
                onChanged: (_) => setState(() {}),
                onSubmitted: (v) {
                  setState(() => _search = v.isEmpty ? null : v);
                  _load();
                },
                style: const TextStyle(fontSize: 14, fontFamily: 'Poppins'),
                decoration: InputDecoration(
                  hintText: 'Search drugs...',
                  hintStyle: const TextStyle(fontSize: 14, color: Color(0xFF9CA3AF)),
                  prefixIcon: const Icon(Icons.search, size: 18, color: Color(0xFF9CA3AF)),
                  suffixIcon: _searchController.text.isNotEmpty
                      ? IconButton(
                          icon: const Icon(Icons.clear, size: 18, color: Color(0xFF9CA3AF)),
                          onPressed: _clearSearch,
                        )
                      : null,
                  border: InputBorder.none,
                  contentPadding: const EdgeInsets.symmetric(horizontal: 8, vertical: 12),
                ),
              ),
            ),
          ),

          if (_categories.isNotEmpty)
            SizedBox(
              height: 38,
              child: ListView(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                scrollDirection: Axis.horizontal,
                children: [
                  _CategoryChip(
                    label: 'All',
                    active: _selectedCategory == null,
                    onTap: () {
                      setState(() => _selectedCategory = null);
                      _load();
                    },
                  ),
                  ..._categories.map((c) => Padding(
                        padding: const EdgeInsets.only(left: 8),
                        child: _CategoryChip(
                          label: c.name ?? 'Category',
                          active: _selectedCategory == c.id,
                          onTap: () {
                            setState(() => _selectedCategory = c.id);
                            _load();
                          },
                        ),
                      )),
                ],
              ),
            ),

          const SizedBox(height: 4),

          // Drugs list
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : _error != null
                    ? Center(
                        child: Padding(
                          padding: const EdgeInsets.all(24),
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(_error!, textAlign: TextAlign.center,
                                  style: const TextStyle(fontSize: 13, color: Color(0xFFDC2626))),
                              const SizedBox(height: 12),
                              OutlinedButton(onPressed: _load, child: const Text('Retry')),
                            ],
                          ),
                        ),
                      )
                    : _drugs.isEmpty
                        ? const Center(
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(Icons.medication_outlined, size: 40, color: Color(0xFFD1D5DB)),
                                SizedBox(height: 8),
                                Text('No drugs found',
                                    style: TextStyle(fontSize: 14, color: Color(0xFF6B7280))),
                              ],
                            ),
                          )
                        : RefreshIndicator(
                            onRefresh: _load,
                            child: ListView.separated(
                              padding: const EdgeInsets.fromLTRB(20, 8, 20, 100),
                              itemCount: _drugs.length,
                              separatorBuilder: (_, __) => const SizedBox(height: 10),
                              itemBuilder: (context, i) {
                                final drug = _drugs[i];
                                return _DrugCard(drug: drug, onAdd: () => _addToCart(drug), pharmacy: widget.pharmacy);
                              },
                            ),
                          ),
          ),
        ],
      ),
      bottomNavigationBar: Consumer<CartState>(
        builder: (context, cart, _) {
          if (cart.isEmpty || cart.pharmacyId != widget.pharmacy.id) {
            return const SizedBox.shrink();
          }
          return Container(
            color: Colors.white,
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 16),
            child: SafeArea(
              top: false,
              child: SizedBox(
                height: 52,
                child: ElevatedButton(
                  onPressed: () => Navigator.of(context).push(
                    MaterialPageRoute(builder: (_) => const CartScreen()),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Text('View Cart', style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w700)),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: AppTheme.dark,
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text('${cart.count}',
                            style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w700)),
                      ),
                      const SizedBox(width: 8),
                      Text(AppHelpers.formatTZS(cart.subtotal),
                          style: const TextStyle(color: AppTheme.dark, fontSize: 13, fontWeight: FontWeight.w700)),
                    ],
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}

class _CategoryChip extends StatelessWidget {
  final String label;
  final bool active;
  final VoidCallback onTap;
  const _CategoryChip({required this.label, required this.active, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14),
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: active ? AppTheme.primary : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: active ? AppTheme.primary : const Color(0xFFE5E7EB)),
        ),
        child: Text(label,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: active ? AppTheme.dark : const Color(0xFF6B7280),
            )),
      ),
    );
  }
}

class _DrugCard extends StatelessWidget {
  final Drug drug;
  final VoidCallback onAdd;
  final Pharmacy pharmacy;
  const _DrugCard({required this.drug, required this.onAdd, required this.pharmacy});

  @override
  Widget build(BuildContext context) {
    final stock = drug.quantity ?? 0;
    final outOfStock = stock <= 0;
    return GestureDetector(
      onTap: () => Navigator.of(context).push(
        MaterialPageRoute(builder: (_) => DrugDetailScreen(drug: drug, pharmacy: pharmacy)),
      ),
      child: Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFEEF1F0)),
      ),
      child: Row(
        children: [
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              color: AppTheme.primary.withOpacity(0.08),
              borderRadius: BorderRadius.circular(14),
            ),
            child: drug.image != null && drug.image!.isNotEmpty
                ? ClipRRect(
                    borderRadius: BorderRadius.circular(14),
                    child: CachedNetworkImage(
                      imageUrl: drug.image!,
                      fit: BoxFit.cover,
                      placeholder: (context, url) => Container(color: const Color(0xFFF3F4F6)),
                      errorWidget: (context, url, error) => Container(
                        color: const Color(0xFFF3F4F6),
                        child: const Icon(Icons.medication, color: Color(0xFF9CA3AF)),
                      ),
                    ),
                  )
                : _pillIcon(),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(drug.name ?? 'Drug',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: Color(0xFF111827))),
                if (drug.genericName != null && drug.genericName!.isNotEmpty)
                  Text(drug.genericName!,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontSize: 11, color: Color(0xFF9CA3AF))),
                const SizedBox(height: 6),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(AppHelpers.formatTZS(drug.price),
                        style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: Color(0xFF111827))),
                    if (outOfStock)
                      const Text('Out of stock',
                          style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: Color(0xFFDC2626)))
                    else
                      GestureDetector(
                        onTap: onAdd,
                        child: Container(
                          width: 32,
                          height: 32,
                          decoration: BoxDecoration(
                            color: AppTheme.primary,
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Icon(Icons.add, size: 16, color: Colors.white),
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

  Widget _pillIcon() {
    return const Icon(Icons.medication, size: 24, color: AppTheme.primary);
  }
}

class _DetailRow extends StatelessWidget {
  final IconData icon;
  final String title;
  final String value;
  const _DetailRow({
    required this.icon,
    required this.title,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 16, color: AppTheme.primaryDark),
          const SizedBox(width: 8),
          Expanded(
            child: Text.rich(
              TextSpan(
                style: const TextStyle(fontSize: 13, color: Color(0xFF6B7280)),
                children: [
                  TextSpan(
                    text: '$title: ',
                    style: const TextStyle(
                        fontWeight: FontWeight.w600, color: AppTheme.textDark),
                  ),
                  TextSpan(text: value),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
