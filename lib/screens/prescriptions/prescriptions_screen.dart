import 'dart:io';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:geolocator/geolocator.dart';
import 'package:image_picker/image_picker.dart';
import '../../l10n/app_localizations.dart';
import '../../models/models.dart';
import '../../services/api_service.dart';
import '../../services/customer_repository.dart';
import '../../theme.dart';
import '../../utils/helpers.dart';

String _rxStatusKey(String status) {
  switch (status.toLowerCase()) {
    case 'pending':
      return 'oh.statusPending';
    case 'processing':
      return 'oh.statusProcessing';
    case 'approved':
      return 'oh.statusApproved';
    case 'rejected':
      return 'oh.statusRejected';
    case 'cancelled':
      return 'oh.statusCancelled';
    default:
      return 'oh.statusPending';
  }
}

class PrescriptionsScreen extends StatefulWidget {
  const PrescriptionsScreen({super.key});

  @override
  State<PrescriptionsScreen> createState() => _PrescriptionsScreenState();
}

class _PrescriptionsScreenState extends State<PrescriptionsScreen> {
  List<Prescription> _prescriptions = [];
  bool _loading = true;
  bool _loadedOnce = false;
  final _autoRefresh = AutoRefresh();
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
    _autoRefresh.start(const Duration(seconds: 45), () {
      if (mounted) _load(silent: true);
    });
  }

  Future<void> _load({bool silent = false}) async {
    setState(() => _loading = silent ? false : !_loadedOnce);
    try {
      final list = await CustomerRepository.myPrescriptions();
      if (!mounted) return;
      setState(() {
        _prescriptions = list;
        _error = null;
        _loadedOnce = true;
      });
    } catch (e) {
      if (mounted) setState(() => _error = ApiService.friendlyError(e));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _openUpload() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => const _UploadPrescriptionSheet(),
    ).then((_) => _load());
  }

  @override
  Widget build(BuildContext context) {
    final L = AppLocalizations.of(context);
    return Scaffold(
      appBar: AppBar(
        title: Text(L.t('oh.myPrescriptions')),
        backgroundColor: Colors.white,
        systemOverlayStyle: AppUi.statusBar,
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _openUpload,
        backgroundColor: AppColors.brand600,
        foregroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
        child: const Icon(Icons.upload_file_rounded, color: Colors.white),
      ),
      body: Stack(
        children: [
          _loading
              ? const Center(child: CircularProgressIndicator(color: AppColors.brand600))
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
                            OutlinedButton(onPressed: _load, child: Text(L.t('oh.retry'))),
                          ],
                        ),
                      ),
                    )
                  : _prescriptions.isEmpty
                      ? RefreshIndicator(
                          onRefresh: _load,
                          child: ListView(
                            physics: const AlwaysScrollableScrollPhysics(),
                            children: [
                              const SizedBox(height: 140),
                              const Icon(Icons.upload_file_rounded, size: 44, color: AppColors.line),
                              const SizedBox(height: 12),
                              Center(
                                child: Text(L.t('oh.noPrescriptionsYet'),
                                    style: const TextStyle(fontSize: 13, color: AppColors.muted)),
                              ),
                            ],
                          ),
                        )
                      : RefreshIndicator(
                          onRefresh: _load,
                          child: ListView.separated(
                            padding: const EdgeInsets.all(24),
                            itemCount: _prescriptions.length,
                            separatorBuilder: (_, __) => const SizedBox(height: 12),
                            itemBuilder: (context, i) {
                              final p = _prescriptions[i];
                              return InkWell(
                                onTap: () => showModalBottomSheet(
                                  context: context,
                                  isScrollControlled: true,
                                  backgroundColor: Colors.transparent,
                                  builder: (_) => _PrescriptionDetailSheet(prescription: p),
                                ),
                                borderRadius: BorderRadius.circular(16),
                                child: _PrescriptionCard(prescription: p),
                              );
                            },
                          ),
                        ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    _autoRefresh.stop();
    super.dispose();
  }
}

class _PrescriptionCard extends StatelessWidget {
  final Prescription prescription;
  const _PrescriptionCard({required this.prescription});

  @override
  Widget build(BuildContext context) {
    final L = AppLocalizations.of(context);
    final rawStatus = prescription.status ?? '';
    final pending = rawStatus.toLowerCase() == 'pending';
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(color: AppColors.line),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: AppColors.violet50,
              borderRadius: BorderRadius.circular(14),
            ),
            child: const Icon(Icons.description_rounded,
                color: AppColors.violet600, size: 18),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('#${prescription.prescriptionCode ?? prescription.id}',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: AppColors.ink)),
                const SizedBox(height: 2),
                Text(prescription.pharmacyName ?? L.t('oh.pharmacy'),
                    style: const TextStyle(fontSize: 12, color: AppColors.muted)),
                if (prescription.doctorName != null && prescription.doctorName!.isNotEmpty)
                  Text('Dr. ${prescription.doctorName}',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.w700, color: AppColors.ink)),
                const SizedBox(height: 2),
                Text(AppHelpers.formatDate(prescription.createdAt),
                    style: const TextStyle(fontSize: 10.5, color: AppColors.muted)),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
                color: pending ? AppColors.amber50 : AppColors.mint50,
                borderRadius: BorderRadius.circular(99)),
            child: Text(L.t(_rxStatusKey(rawStatus)).toUpperCase(),
                style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                    color: pending ? AppColors.amber600 : AppColors.brand700)),
          ),
        ],
      ),
    );
  }
}

class _PrescriptionDetailSheet extends StatelessWidget {
  final Prescription prescription;
  const _PrescriptionDetailSheet({required this.prescription});

  @override
  Widget build(BuildContext context) {
    final L = AppLocalizations.of(context);
    final rx = prescription;
    final rawStatus = rx.status ?? '';
    final pending = rawStatus.toLowerCase() == 'pending';
    final photo = rx.photo;
    final notes = rx.notes;
    return Container(
      padding: const EdgeInsets.fromLTRB(22, 14, 22, 26),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(26)),
      ),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                margin: const EdgeInsets.only(bottom: 16),
                decoration:
                    BoxDecoration(color: AppColors.line, borderRadius: BorderRadius.circular(99)),
              ),
            ),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text('#${rx.prescriptionCode ?? rx.id}',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: AppColors.ink)),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                      color: pending ? AppColors.amber50 : AppColors.mint50,
                      borderRadius: BorderRadius.circular(99)),
                  child: Text(L.t(_rxStatusKey(rawStatus)).toUpperCase(),
                      style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                          color: pending ? AppColors.amber600 : AppColors.brand700)),
                ),
              ],
            ),
            const SizedBox(height: 4),
            Text(rx.pharmacyName ?? L.t('oh.pharmacy'),
                style: const TextStyle(fontSize: 12.5, color: AppColors.muted)),
            const SizedBox(height: 16),
            Container(
              height: 128,
              width: double.infinity,
              decoration: BoxDecoration(
                color: Colors.white,
                border: Border.all(color: AppColors.line),
                borderRadius: BorderRadius.circular(16),
              ),
              clipBehavior: Clip.antiAlias,
              child: photo != null && photo.isNotEmpty
                  ? CachedNetworkImage(
                      imageUrl: photo,
                      width: double.infinity,
                      fit: BoxFit.cover,
                      placeholder: (context, url) => Container(
                        color: AppColors.line.withOpacity(0.4),
                        child: const Center(child: CircularProgressIndicator(strokeWidth: 2)),
                      ),
                      errorWidget: (context, url, error) => const Center(
                        child: Icon(Icons.description_outlined, color: AppColors.muted, size: 26),
                      ),
                    )
                  : const Center(
                      child: Icon(Icons.description_outlined, color: AppColors.muted, size: 26)),
            ),
            const SizedBox(height: 16),
            _DetailRow(
                icon: Icons.medical_services_outlined,
                label: L.t('oh.doctor'),
                value: rx.doctorName != null && rx.doctorName!.isNotEmpty
                    ? 'Dr. ${rx.doctorName}'
                    : '—'),
            const SizedBox(height: 12),
            _DetailRow(
                icon: Icons.local_hospital_outlined,
                label: L.t('oh.hospital'),
                value: rx.hospitalName ?? '—'),
            const SizedBox(height: 12),
            _DetailRow(
                icon: Icons.calendar_month_rounded,
                label: L.t('oh.submitted'),
                value: AppHelpers.formatDate(rx.createdAt)),
            if (notes != null && notes.isNotEmpty) ...[
              const SizedBox(height: 16),
              Text(L.t('oh.notes'), style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.ink)),
              const SizedBox(height: 4),
              Text(notes, style: const TextStyle(fontSize: 12.5, color: AppColors.muted)),
            ],
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton(
                onPressed: () => Navigator.of(context).pop(),
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppColors.ink,
                  side: const BorderSide(color: AppColors.line),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                ),
                child: Text(L.t('oh.close'), style: const TextStyle(fontWeight: FontWeight.w700)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  const _DetailRow({required this.icon, required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 34,
          height: 34,
          decoration: BoxDecoration(
            color: AppColors.mint50,
            border: Border.all(color: AppColors.line),
            borderRadius: BorderRadius.circular(11),
          ),
          child: Icon(icon, size: 15, color: AppColors.brand600),
        ),
        const SizedBox(width: 12),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: const TextStyle(fontSize: 10.5, color: AppColors.muted)),
            Text(value, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.ink)),
          ],
        ),
      ],
    );
  }
}

class _UploadPrescriptionSheet extends StatefulWidget {
  const _UploadPrescriptionSheet();

  @override
  State<_UploadPrescriptionSheet> createState() => _UploadPrescriptionSheetState();
}

class _UploadPrescriptionSheetState extends State<_UploadPrescriptionSheet> {
  final _doctorController = TextEditingController();
  final _notesController = TextEditingController();
  List<Pharmacy> _pharmacies = [];
  int? _pharmacyId;
  String? _photoPath;
  String? _photoUrl;
  bool _loadingPharmacies = true;
  bool _submitting = false;

  @override
  void initState() {
    super.initState();
    _loadPharmacies();
  }

  @override
  void dispose() {
    _doctorController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _loadPharmacies() async {
    setState(() => _loadingPharmacies = true);
    try {
      Position? pos;
      try {
        var enabled = await Geolocator.isLocationServiceEnabled();
        if (enabled) {
          var perm = await Geolocator.checkPermission();
          if (perm == LocationPermission.denied) perm = await Geolocator.requestPermission();
          if (perm == LocationPermission.whileInUse || perm == LocationPermission.always) {
            pos = await Geolocator.getCurrentPosition();
          }
        }
      } catch (_) {}
      final lat = pos?.latitude ?? -6.7924;
      final lng = pos?.longitude ?? 39.2083;
      final list = await CustomerRepository.nearby(latitude: lat, longitude: lng, radiusKm: 100);
      if (!mounted) return;
      setState(() {
        _pharmacies = list;
        _loadingPharmacies = false;
      });
    } catch (e) {
      if (mounted) {
        setState(() {
          _loadingPharmacies = false;
          _pharmacies = [];
        });
      }
    }
  }

  Future<void> _pickPhoto() async {
    final picker = ImagePicker();
    final file = await picker.pickImage(source: ImageSource.gallery, maxWidth: 1600, imageQuality: 70);
    if (file == null) return;
    if (!mounted) return;
    setState(() => _photoPath = file.path);
  }

  Future<void> _submit() async {
    final L = AppLocalizations.of(context);
    if (_pharmacyId == null) {
      _showError(L.t('oh.selectPharmacyError'));
      return;
    }
    if (_doctorController.text.trim().isEmpty) {
      _showError(L.t('oh.doctorNameError'));
      return;
    }
    setState(() => _submitting = true);
    try {
      String? photoUrl = _photoUrl;
      if (_photoPath != null && _photoUrl == null) {
        photoUrl = await CustomerRepository.uploadFile(_photoPath!, folder: 'prescriptions');
      }
      await CustomerRepository.uploadPrescription(
        pharmacyId: _pharmacyId!,
        doctorName: _doctorController.text.trim(),
        notes: _notesController.text.trim().isEmpty ? null : _notesController.text.trim(),
        photo: photoUrl,
      );
      if (!mounted) return;
      Navigator.of(context).pop();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(L.t('oh.prescriptionUploaded')),
          backgroundColor: AppTheme.dark,
          behavior: SnackBarBehavior.floating,
        ),
      );
    } catch (e) {
      if (!mounted) return;
      setState(() => _submitting = false);
      _showError(ApiService.friendlyError(e));
    }
  }

  void _showError(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(msg), backgroundColor: const Color(0xFFDC2626), behavior: SnackBarBehavior.floating),
    );
  }

  @override
  Widget build(BuildContext context) {
    final L = AppLocalizations.of(context);
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;
    return Container(
      padding: EdgeInsets.fromLTRB(20, 12, 20, 20),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      child: SingleChildScrollView(
        padding: EdgeInsets.only(bottom: bottomInset),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 42,
                height: 5,
                decoration: BoxDecoration(
                  color: AppColors.line,
                  borderRadius: BorderRadius.circular(6),
                ),
              ),
            ),
            const SizedBox(height: 18),
            Row(
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: AppColors.mint50,
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: const Icon(Icons.description_rounded,
                      color: AppColors.brand600, size: 22),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(L.t('oh.uploadPrescription'),
                          style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w800,
                              color: AppColors.ink)),
                      const SizedBox(height: 2),
                      Text(L.t('oh.pharmacyWillReview'),
                          style: const TextStyle(
                              fontSize: 12, color: AppColors.muted)),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),

            // Photo picker
            GestureDetector(
              onTap: _pickPhoto,
              child: Container(
                width: double.infinity,
                height: 148,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: AppColors.sand,
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(
                    color: _photoPath != null
                        ? AppColors.brand600
                        : AppColors.line,
                    width: 1.4,
                  ),
                ),
                child: _photoPath != null
                    ? ClipRRect(
                        borderRadius: BorderRadius.circular(18),
                        child: Stack(
                          fit: StackFit.expand,
                          children: [
                            Image.file(File(_photoPath!), fit: BoxFit.cover),
                            Positioned(
                              right: 10,
                              top: 10,
                              child: CircleAvatar(
                                radius: 16,
                                backgroundColor: AppColors.brand600,
                                child: const Icon(Icons.check,
                                    size: 18, color: Colors.white),
                              ),
                            ),
                          ],
                        ),
                      )
                    : Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Container(
                            width: 52,
                            height: 52,
                            decoration: BoxDecoration(
                              color: AppColors.mint50,
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(Icons.add_a_photo_outlined,
                                size: 24, color: AppColors.brand600),
                          ),
                          const SizedBox(height: 10),
                          Text(L.t('oh.tapAddPhoto'),
                              style: const TextStyle(
                                  fontSize: 12.5,
                                  fontWeight: FontWeight.w500,
                                  color: AppColors.muted)),
                        ],
                      ),
              ),
            ),
            const SizedBox(height: 16),

            TextField(
              controller: _doctorController,
              decoration: InputDecoration(
                labelText: L.t('oh.doctorName'),
                hintText: 'Dr. John Doe',
                prefixIcon: const Icon(Icons.person_outline,
                    size: 20, color: AppColors.muted),
                filled: true,
                fillColor: AppColors.sand,
                contentPadding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: const BorderSide(color: AppColors.line),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: const BorderSide(color: AppColors.line),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: const BorderSide(
                      color: AppColors.brand600, width: 1.8),
                ),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _notesController,
              maxLines: 3,
              decoration: InputDecoration(
                labelText: L.t('oh.notesOptional'),
                hintText: L.t('oh.medicinesHint'),
                prefixIcon: const Icon(Icons.edit_note,
                    size: 20, color: AppColors.muted),
                filled: true,
                fillColor: AppColors.sand,
                contentPadding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: const BorderSide(color: AppColors.line),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: const BorderSide(color: AppColors.line),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: const BorderSide(
                      color: AppColors.brand600, width: 1.8),
                ),
              ),
            ),
            const SizedBox(height: 16),

            Text(L.t('oh.selectPharmacy'),
                style:
                    const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.ink)),
            const SizedBox(height: 8),
            _loadingPharmacies
                ? const SizedBox(height: 40, child: Center(child: CircularProgressIndicator(strokeWidth: 2)))
                : _pharmacies.isEmpty
                    ? Padding(
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        child: Text(L.t('oh.noPharmacies'),
                            style: const TextStyle(fontSize: 12, color: Color(0xFFDC2626))),
                      )
                    : Container(
                        height: 112,
                        child: ListView.builder(
                          scrollDirection: Axis.horizontal,
                          itemCount: _pharmacies.length,
                          itemBuilder: (context, i) {
                            final p = _pharmacies[i];
                            final selected = _pharmacyId == p.id;
                            return GestureDetector(
                              onTap: () => setState(() => _pharmacyId = p.id),
                              child: Container(
                                width: 146,
                                margin: const EdgeInsets.only(right: 10),
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: selected
                                      ? AppColors.mint50
                                      : AppColors.sand,
                                  borderRadius: BorderRadius.circular(16),
                                  border: Border.all(
                                    color: selected
                                        ? AppColors.brand600
                                        : AppColors.line,
                                    width: selected ? 1.6 : 1,
                                  ),
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Container(
                                      width: 34,
                                      height: 34,
                                      decoration: BoxDecoration(
                                        color: selected
                                            ? AppColors.brand600
                                            : AppColors.mint50,
                                        borderRadius: BorderRadius.circular(10),
                                      ),
                                      child: const Icon(Icons.local_pharmacy,
                                          size: 18,
                                          color: AppColors.brand700),
                                    ),
                                    const SizedBox(height: 8),
                                    Expanded(
                                      child: Text(p.name ?? L.t('oh.pharmacy'),
                                          maxLines: 2,
                                          overflow: TextOverflow.ellipsis,
                                          style: const TextStyle(
                                              fontSize: 12.5,
                                              fontWeight: FontWeight.w600,
                                              color: AppColors.ink)),
                                    ),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
                      ),

            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              height: 52,
              child: ElevatedButton(
                onPressed: _submitting ? null : _submit,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.brand600,
                  disabledBackgroundColor: AppColors.brand600.withOpacity(0.5),
                  elevation: 0,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                ),
                child: _submitting
                    ? const SizedBox(
                        width: 22,
                        height: 22,
                        child: CircularProgressIndicator(
                            strokeWidth: 2, color: Colors.white),
                      )
                    : Text(L.t('oh.submitPrescription'),
                        style: const TextStyle(
                            color: Colors.white,
                            fontSize: 15,
                            fontWeight: FontWeight.w700)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}