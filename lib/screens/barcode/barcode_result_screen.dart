import 'package:flutter/material.dart';
import '../../l10n/app_localizations.dart';
import '../../models/models.dart';
import '../../services/api_service.dart';
import '../../services/customer_repository.dart';
import '../../theme.dart';
import '../../utils/helpers.dart';
import '../pharmacy/drug_detail_screen.dart';

/// Shows what a scanned barcode refers to, plus the pharmacies that stock it.
///
/// The scan used to only pre-fill a search box; this resolves the code to real
/// product information so the customer sees the medicine and its price.
class BarcodeResultScreen extends StatefulWidget {
  final String barcode;

  const BarcodeResultScreen({super.key, required this.barcode});

  @override
  State<BarcodeResultScreen> createState() => _BarcodeResultScreenState();
}

class _BarcodeResultScreenState extends State<BarcodeResultScreen> {
  late Future<List<Drug>> _future;

  @override
  void initState() {
    super.initState();
    _future = CustomerRepository.drugsByBarcode(widget.barcode);
  }

  void _retry() {
    setState(() => _future = CustomerRepository.drugsByBarcode(widget.barcode));
  }

  @override
  Widget build(BuildContext context) {
    final L = AppLocalizations.of(context);
    return Scaffold(
      backgroundColor: AppTheme.bgLight,
      appBar: AppBar(title: Text(L.t('auth.barcodeResult'))),
      body: FutureBuilder<List<Drug>>(
        future: _future,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const CircularProgressIndicator(color: AppTheme.primary),
                  const SizedBox(height: 16),
                  Text(
                    L.t('auth.barcodeSearching'),
                    style: const TextStyle(color: Color(0xFF6B7280)),
                  ),
                ],
              ),
            );
          }

          if (snapshot.hasError) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.cloud_off, size: 48, color: Color(0xFF9CA3AF)),
                    const SizedBox(height: 12),
                    Text(
                      ApiService.friendlyError(snapshot.error!),
                      textAlign: TextAlign.center,
                      style: const TextStyle(color: Color(0xFF6B7280)),
                    ),
                    const SizedBox(height: 16),
                    FilledButton(onPressed: _retry, child: const Text('Retry')),
                  ],
                ),
              ),
            );
          }

          final drugs = snapshot.data ?? const <Drug>[];

          if (drugs.isEmpty) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.qr_code_scanner, size: 56, color: Color(0xFF9CA3AF)),
                    const SizedBox(height: 16),
                    Text(
                      L.t('auth.barcodeNotFound'),
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        fontSize: 17,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF111827),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      '${L.t('auth.barcodeNotFoundHint')}\n\n${widget.barcode}',
                      textAlign: TextAlign.center,
                      style: const TextStyle(color: Color(0xFF6B7280), fontSize: 13),
                    ),
                    const SizedBox(height: 20),
                    OutlinedButton.icon(
                      onPressed: () => Navigator.of(context).pop(),
                      icon: const Icon(Icons.qr_code_scanner, size: 18),
                      label: const Text('Scan again'),
                    ),
                  ],
                ),
              ),
            );
          }

          // Every listing shares the same product; show its details once, then
          // list the pharmacies that had it in stock.
          final primary = drugs.first;
          final stores = <String, Drug>{};
          for (final d in drugs) {
            if (d.pharmacyName != null) stores[d.pharmacyName!] = d;
          }

          return ListView(
            padding: const EdgeInsets.fromLTRB(20, 20, 20, 40),
            children: [
              _Header(drug: primary),
              const SizedBox(height: 16),
              _DetailCard(drug: primary),
              if (stores.isNotEmpty) ...[
                const SizedBox(height: 20),
                Text(
                  L.t('auth.barcodeAvailableAt'),
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFF111827),
                  ),
                ),
                const SizedBox(height: 10),
                ...stores.values.map((d) => _StoreTile(drug: d)),
              ],
            ],
          );
        },
      ),
    );
  }
}

class _Header extends StatelessWidget {
  final Drug drug;
  const _Header({required this.drug});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: drug.image != null
                ? Image.network(
                    drug.image!,
                    width: 72,
                    height: 72,
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => const _ImageFallback(),
                  )
                : const _ImageFallback(),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  drug.name ?? '',
                  style: const TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFF111827),
                  ),
                ),
                if (drug.genericName != null && drug.genericName!.isNotEmpty) ...[
                  const SizedBox(height: 2),
                  Text(
                    drug.genericName!,
                    style: const TextStyle(fontSize: 13, color: Color(0xFF6B7280)),
                  ),
                ],
                const SizedBox(height: 8),
                Text(
                  AppHelpers.formatTZS(drug.price),
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w800,
                    color: AppTheme.primary,
                  ),
                ),
                if (drug.requiresPrescription == true) ...[
                  const SizedBox(height: 6),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFEF3C7),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: const Text(
                      'Prescription required',
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF92400E),
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _ImageFallback extends StatelessWidget {
  const _ImageFallback();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 72,
      height: 72,
      color: const Color(0xFFF3F4F6),
      child: const Icon(Icons.medication, size: 32, color: Color(0xFF9CA3AF)),
    );
  }
}

class _DetailCard extends StatelessWidget {
  final Drug drug;
  const _DetailCard({required this.drug});

  @override
  Widget build(BuildContext context) {
    final L = AppLocalizations.of(context);
    final rows = <String, String?>{
      L.t('shop.category'): drug.categoryName,
      'Manufacturer': drug.manufacturer,
      'Unit': drug.unit,
    };
    final present = rows.entries.where((e) => e.value != null && e.value!.isNotEmpty).toList();
    if (present.isEmpty) return const SizedBox.shrink();

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        children: present
            .map(
              (e) => Padding(
                padding: const EdgeInsets.symmetric(vertical: 5),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    SizedBox(
                      width: 110,
                      child: Text(
                        e.key,
                        style: const TextStyle(fontSize: 12, color: Color(0xFF9CA3AF)),
                      ),
                    ),
                    Expanded(
                      child: Text(
                        e.value!,
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFF111827),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            )
            .toList(),
      ),
    );
  }
}

class _StoreTile extends StatelessWidget {
  final Drug drug;
  const _StoreTile({required this.drug});

  @override
  Widget build(BuildContext context) {
    final L = AppLocalizations.of(context);
    final inStock = (drug.quantity ?? 0) > 0;
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
      ),
      child: Row(
        children: [
          const Icon(Icons.storefront, color: AppTheme.primary, size: 20),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  drug.pharmacyName ?? '',
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF111827),
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  inStock
                      ? AppHelpers.formatTZS(drug.price)
                      : L.t('auth.barcodeOutOfStock'),
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: inStock ? AppTheme.primary : const Color(0xFF9CA3AF),
                  ),
                ),
              ],
            ),
          ),
          IconButton(
            onPressed: drug.pharmacyId == null
                ? null
                : () async {
                    final pharmacy = await CustomerRepository.pharmacyDetail(drug.pharmacyId!);
                    if (!context.mounted) return;
                    Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (_) => DrugDetailScreen(drug: drug, pharmacy: pharmacy),
                      ),
                    );
                  },
            icon: const Icon(Icons.chevron_right, color: Color(0xFF9CA3AF)),
          ),
        ],
      ),
    );
  }
}
