import 'package:flutter/material.dart';
import '../../models/models.dart';
import '../../services/api_service.dart';
import '../../services/customer_repository.dart';
import '../../theme.dart';
import '../../utils/helpers.dart';

class PharmacyReviewsScreen extends StatefulWidget {
  final Pharmacy pharmacy;
  const PharmacyReviewsScreen({super.key, required this.pharmacy});

  @override
  State<PharmacyReviewsScreen> createState() => _PharmacyReviewsScreenState();
}

class _PharmacyReviewsScreenState extends State<PharmacyReviewsScreen> {
  List<PharmacyReview> _reviews = [];
  bool _loading = true;
  String? _error;
  bool _hasReviewed = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final data = await CustomerRepository.pharmacyReviews(widget.pharmacy.id);
      if (!mounted) return;
      setState(() {
        _reviews = data['reviews'] as List<PharmacyReview>;
        _hasReviewed = data['hasReviewed'] ?? false;
        _error = null;
      });
    } catch (e) {
      if (mounted) setState(() => _error = ApiService.friendlyError(e));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _openWrite() async {
    final wrote = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _WriteReviewSheet(pharmacy: widget.pharmacy),
    );
    if (wrote == true) {
      await _load();
      if (mounted) {
        setState(() {}); // refresh rating badge if shown
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.bgLight,
      appBar: AppBar(title: const Text('Reviews')),
      body: _loading
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
              : RefreshIndicator(
                  onRefresh: _load,
                  child: ListView(
                    padding: const EdgeInsets.fromLTRB(20, 16, 20, 120),
                    children: [
                      _header(),
                      const SizedBox(height: 16),
                      SizedBox(
                        height: 48,
                        child: ElevatedButton.icon(
                          onPressed: _openWrite,
                          icon: const Icon(Icons.star_half, size: 18, color: AppTheme.dark),
                          label: Text(_hasReviewed ? 'Update your review' : 'Write a review',
                              style: const TextStyle(color: AppTheme.dark)),
                        ),
                      ),
                      const SizedBox(height: 20),
                      if (_reviews.isEmpty)
                        const Padding(
                          padding: EdgeInsets.symmetric(vertical: 40),
                          child: Center(
                            child: Text('No reviews yet. Be the first to rate this pharmacy.',
                                textAlign: TextAlign.center,
                                style: TextStyle(fontSize: 13, color: Color(0xFF9CA3AF))),
                          ),
                        )
                      else
                        ..._reviews.map((r) => Padding(
                              padding: const EdgeInsets.only(bottom: 12),
                              child: _ReviewTile(review: r),
                            )),
                    ],
                  ),
                ),
    );
  }

  Widget _header() {
    final rating = widget.pharmacy.rating;
    final count = widget.pharmacy.totalReviews ?? 0;
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFEEF1F0)),
      ),
      child: Row(
        children: [
          Column(
            children: [
              Text(rating != null ? rating.toStringAsFixed(1) : '—',
                  style: const TextStyle(fontSize: 36, fontWeight: FontWeight.w800, color: Color(0xFF111827))),
              const SizedBox(height: 2),
              Row(
                mainAxisSize: MainAxisSize.min,
                children: List.generate(5, (i) {
                  final filled = (rating ?? 0) >= i + 1;
                  return Icon(Icons.star,
                      size: 16, color: filled ? const Color(0xFFFBBF24) : const Color(0xFFD1D5DB));
                }),
              ),
              const SizedBox(height: 4),
              Text('$count reviews',
                  style: const TextStyle(fontSize: 12, color: Color(0xFF9CA3AF))),
            ],
          ),
          const SizedBox(width: 20),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(widget.pharmacy.name ?? 'Pharmacy',
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: Color(0xFF111827))),
              const SizedBox(height: 6),
              Text(AppHelpers.statusLabel((widget.pharmacy.status ?? '') == 'active' ? 'active' : ''),
                  style: const TextStyle(fontSize: 12, color: Color(0xFF6B7280))),
            ],
          ),
        ],
      ),
    );
  }
}

class _ReviewTile extends StatelessWidget {
  final PharmacyReview review;
  const _ReviewTile({required this.review});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFEEF1F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.person_outline, size: 20, color: Color(0xFF9CA3AF)),
              const SizedBox(width: 8),
              Expanded(
                child: Text(review.userName ?? 'Customer',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFF111827))),
              ),
              if (review.mine)
                const Text('You',
                    style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: AppTheme.primary)),
            ],
          ),
          if (review.rating != null) ...[
            const SizedBox(height: 8),
            Row(
              children: List.generate(5, (i) {
                final filled = (review.rating ?? 0) >= i + 1;
                return Icon(Icons.star,
                    size: 14, color: filled ? const Color(0xFFFBBF24) : const Color(0xFFD1D5DB));
              }),
            ),
          ],
          if (review.review != null && review.review!.isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(review.review!, style: const TextStyle(fontSize: 13, height: 1.5, color: Color(0xFF374151))),
          ],
          if (review.createdAt != null) ...[
            const SizedBox(height: 8),
            Text(AppHelpers.formatDate(review.createdAt),
                style: const TextStyle(fontSize: 11, color: Color(0xFF9CA3AF))),
          ],
        ],
      ),
    );
  }
}

class _WriteReviewSheet extends StatefulWidget {
  final Pharmacy pharmacy;
  const _WriteReviewSheet({required this.pharmacy});

  @override
  State<_WriteReviewSheet> createState() => _WriteReviewSheetState();
}

class _WriteReviewSheetState extends State<_WriteReviewSheet> {
  int _rating = 5;
  final _reviewController = TextEditingController();
  bool _submitting = false;

  @override
  void dispose() {
    _reviewController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() => _submitting = true);
    try {
      await CustomerRepository.submitPharmacyReview(
        widget.pharmacy.id,
        rating: _rating,
        review: _reviewController.text.trim(),
      );
      if (!mounted) return;
      Navigator.of(context).pop(true);
    } catch (e) {
      if (!mounted) return;
      setState(() => _submitting = false);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(ApiService.friendlyError(e)),
        backgroundColor: const Color(0xFFDC2626),
        behavior: SnackBarBehavior.floating,
      ));
    }
  }

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;
    return Container(
      padding: EdgeInsets.fromLTRB(20, 16, 20, 20),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: SingleChildScrollView(
        padding: EdgeInsets.only(bottom: bottomInset),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(color: const Color(0xFFE5E7EB), borderRadius: BorderRadius.circular(4)),
              ),
            ),
            const SizedBox(height: 16),
            const Text('Rate this Pharmacy',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: Color(0xFF111827))),
            const SizedBox(height: 4),
            Text(widget.pharmacy.name ?? 'Pharmacy',
                style: const TextStyle(fontSize: 12, color: Color(0xFF9CA3AF))),
            const SizedBox(height: 20),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(5, (i) {
                final n = i + 1;
                return GestureDetector(
                  onTap: () => setState(() => _rating = n),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 4),
                    child: Icon(Icons.star,
                        size: 36, color: n <= _rating ? const Color(0xFFFBBF24) : const Color(0xFFE5E7EB)),
                  ),
                );
              }),
            ),
            const SizedBox(height: 6),
            Center(
              child: Text(['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][_rating],
                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF6B7280))),
            ),
            const SizedBox(height: 20),
            TextField(
              controller: _reviewController,
              maxLines: 4,
              decoration: const InputDecoration(
                labelText: 'Your review (optional)',
                hintText: 'Share your experience with this pharmacy...',
                alignLabelWithHint: true,
              ),
            ),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              height: 52,
              child: ElevatedButton(
                onPressed: _submitting ? null : _submit,
                style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primary),
                child: _submitting
                    ? const SizedBox(
                        width: 22,
                        height: 22,
                        child: CircularProgressIndicator(strokeWidth: 2, color: AppTheme.dark),
                      )
                    : const Text('Submit Review', style: TextStyle(color: AppTheme.dark, fontWeight: FontWeight.w700)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
