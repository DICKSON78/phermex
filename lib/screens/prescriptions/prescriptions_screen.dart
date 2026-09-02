import 'dart:io';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:image_picker/image_picker.dart';
import '../../models/models.dart';
import '../../services/api_service.dart';
import '../../services/customer_repository.dart';
import '../../theme.dart';
import '../../utils/helpers.dart';

class PrescriptionsScreen extends StatefulWidget {
  const PrescriptionsScreen({super.key});

  @override
  State<PrescriptionsScreen> createState() => _PrescriptionsScreenState();
}

class _PrescriptionsScreenState extends State<PrescriptionsScreen> {
  List<Prescription> _prescriptions = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final list = await CustomerRepository.myPrescriptions();
      if (!mounted) return;
      setState(() {
        _prescriptions = list;
        _error = null;
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
    return Scaffold(
      backgroundColor: AppTheme.bgLight,
      appBar: AppBar(
        title: const Text('My Prescriptions'),
        backgroundColor: Colors.white,
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _openUpload,
        backgroundColor: AppTheme.primary,
        foregroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        child: const Icon(Icons.upload_file, size: 22),
      ),
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
              : _prescriptions.isEmpty
                  ? RefreshIndicator(
                      onRefresh: _load,
                      child: ListView(
                        physics: const AlwaysScrollableScrollPhysics(),
                        children: const [
                          SizedBox(height: 120),
                          Icon(Icons.upload_file, size: 48, color: Color(0xFFD1D5DB)),
                          SizedBox(height: 12),
                          Center(
                            child: Text('No prescriptions yet',
                                style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: Color(0xFF6B7280))),
                          ),
                          SizedBox(height: 4),
                          Center(
                            child: Text('Upload your prescription to get started',
                                style: TextStyle(fontSize: 12, color: Color(0xFF9CA3AF))),
                          ),
                        ],
                      ),
                    )
                  : RefreshIndicator(
                      onRefresh: _load,
                      child: ListView.separated(
                        padding: const EdgeInsets.all(20),
                        itemCount: _prescriptions.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 10),
                        itemBuilder: (context, i) {
                          final p = _prescriptions[i];
                          return GestureDetector(
                            onTap: () => showDialog(
                              context: context,
                              builder: (_) => _PrescriptionDetailDialog(prescription: p),
                            ),
                            child: _PrescriptionCard(prescription: p),
                          );
                        },
                      ),
                    ),
    );
  }
}

class _PrescriptionCard extends StatelessWidget {
  final Prescription prescription;
  const _PrescriptionCard({required this.prescription});

  @override
  Widget build(BuildContext context) {
    final status = prescription.status ?? '';
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFEEF1F0)),
      ),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: const Color(0xFFF3E8FF),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(Icons.description_outlined, size: 20, color: Color(0xFFA855F7)),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Text('#${prescription.prescriptionCode ?? prescription.id}',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: Color(0xFF111827))),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: AppHelpers.statusColor(status).withOpacity(0.1),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(status.toUpperCase(),
                          style: TextStyle(fontSize: 9, fontWeight: FontWeight.w700, color: AppHelpers.statusColor(status))),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(prescription.pharmacyName ?? 'Pharmacy',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontSize: 12, color: Color(0xFF9CA3AF))),
                if (prescription.doctorName != null && prescription.doctorName!.isNotEmpty)
                  Text('Dr. ${prescription.doctorName}',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontSize: 12, color: Color(0xFF6B7280))),
                const SizedBox(height: 4),
                Text(AppHelpers.formatDate(prescription.createdAt),
                    style: const TextStyle(fontSize: 11, color: Color(0xFF9CA3AF))),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _PrescriptionDetailDialog extends StatelessWidget {
  final Prescription prescription;
  const _PrescriptionDetailDialog({required this.prescription});

  @override
  Widget build(BuildContext context) {
    final status = prescription.status ?? '';
    final photo = prescription.photo;
    final notes = prescription.notes;
    return Dialog(
      backgroundColor: Colors.white,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      child: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(20, 24, 20, 20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text('#${prescription.prescriptionCode ?? prescription.id}',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: Color(0xFF111827))),
                ),
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppHelpers.statusColor(status).withOpacity(0.1),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(status.toUpperCase(),
                      style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: AppHelpers.statusColor(status))),
                ),
              ],
            ),
            if (prescription.pharmacyName != null) ...[
              const SizedBox(height: 4),
              Text(prescription.pharmacyName!,
                  style: const TextStyle(fontSize: 12, color: Color(0xFF9CA3AF))),
            ],
            const SizedBox(height: 16),
            if (photo != null && photo.isNotEmpty)
              ClipRRect(
                borderRadius: BorderRadius.circular(16),
                child: CachedNetworkImage(
                  imageUrl: photo,
                  height: 220,
                  width: double.infinity,
                  fit: BoxFit.cover,
                  placeholder: (context, url) => Container(
                    height: 220,
                    color: const Color(0xFFF3F4F6),
                    child: const Center(child: CircularProgressIndicator(strokeWidth: 2)),
                  ),
                  errorWidget: (context, url, error) => Container(
                    height: 220,
                    color: const Color(0xFFF3F4F6),
                    child: const Icon(Icons.broken_image_outlined, color: Color(0xFF9CA3AF)),
                  ),
                ),
              )
            else
              Container(
                height: 140,
                decoration: BoxDecoration(
                  color: const Color(0xFFF9FAFB),
                  borderRadius: BorderRadius.circular(16),
                ),
                alignment: Alignment.center,
                child: const Icon(Icons.description_outlined, size: 32, color: Color(0xFFD1D5DB)),
              ),
            const SizedBox(height: 16),
            _DetailRow(
              icon: Icons.medical_services_outlined,
              label: 'Doctor',
              value: prescription.doctorName != null && prescription.doctorName!.isNotEmpty
                  ? 'Dr. ${prescription.doctorName}'
                  : '',
            ),
            const SizedBox(height: 10),
            _DetailRow(
              icon: Icons.local_hospital_outlined,
              label: 'Hospital',
              value: prescription.hospitalName ?? '',
            ),
            const SizedBox(height: 10),
            _DetailRow(
              icon: Icons.event_note_outlined,
              label: 'Submitted',
              value: AppHelpers.formatDate(prescription.createdAt),
            ),
            if (notes != null && notes.isNotEmpty) ...[
              const SizedBox(height: 14),
              const Text('Notes',
                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: Color(0xFF111827))),
              const SizedBox(height: 6),
              Text(notes, style: const TextStyle(fontSize: 13, height: 1.5, color: Color(0xFF374151))),
            ],
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton(
                onPressed: () => Navigator.of(context).pop(),
                child: const Text('Close'),
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
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 32,
          height: 32,
          decoration: BoxDecoration(
            color: AppTheme.primary.withOpacity(0.1),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(icon, size: 16, color: AppTheme.primary),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label,
                  style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: Color(0xFF9CA3AF))),
              const SizedBox(height: 2),
              Text(value.isEmpty ? '—' : value,
                  style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFF111827))),
            ],
          ),
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
    if (_pharmacyId == null) {
      _showError('Please select a pharmacy');
      return;
    }
    if (_doctorController.text.trim().isEmpty) {
      _showError('Please enter the doctor name');
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
        const SnackBar(
          content: Text('Prescription uploaded successfully'),
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
                  color: const Color(0xFFE5E7EB),
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
                    color: AppTheme.primary.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: const Icon(Icons.description_outlined,
                      color: AppTheme.primaryDark, size: 22),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Upload Prescription',
                          style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w800,
                              color: Color(0xFF111827))),
                      const SizedBox(height: 2),
                      Text('The pharmacy will review and confirm your order.',
                          style: TextStyle(
                              fontSize: 12, color: Colors.grey.shade500)),
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
                  color: const Color(0xFFF9FAFB),
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(
                    color: _photoPath != null
                        ? AppTheme.primary
                        : const Color(0xFFE5E7EB),
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
                            const Positioned(
                              right: 10,
                              top: 10,
                              child: CircleAvatar(
                                radius: 16,
                                backgroundColor: AppTheme.primary,
                                child: Icon(Icons.check,
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
                              color: AppTheme.primary.withOpacity(0.12),
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(Icons.add_a_photo_outlined,
                                size: 24, color: AppTheme.primaryDark),
                          ),
                          const SizedBox(height: 10),
                          const Text('Tap to add prescription photo (optional)',
                              style: TextStyle(
                                  fontSize: 12.5,
                                  fontWeight: FontWeight.w500,
                                  color: Color(0xFF9CA3AF))),
                        ],
                      ),
              ),
            ),
            const SizedBox(height: 16),

            TextField(
              controller: _doctorController,
              decoration: InputDecoration(
                labelText: 'Doctor Name',
                hintText: 'Dr. John Doe',
                prefixIcon: const Icon(Icons.person_outline,
                    size: 20, color: Color(0xFF9CA3AF)),
                filled: true,
                fillColor: Colors.grey.shade50,
                contentPadding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: const BorderSide(color: Color(0xFFE5E7EB)),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: const BorderSide(color: Color(0xFFE5E7EB)),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: const BorderSide(
                      color: AppTheme.primary, width: 1.8),
                ),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _notesController,
              maxLines: 3,
              decoration: InputDecoration(
                labelText: 'Notes (optional)',
                hintText: 'Medicines needed, dosage, etc.',
                prefixIcon: const Icon(Icons.edit_note,
                    size: 20, color: Color(0xFF9CA3AF)),
                filled: true,
                fillColor: Colors.grey.shade50,
                contentPadding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: const BorderSide(color: Color(0xFFE5E7EB)),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: const BorderSide(color: Color(0xFFE5E7EB)),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: const BorderSide(
                      color: AppTheme.primary, width: 1.8),
                ),
              ),
            ),
            const SizedBox(height: 16),

            Text('Select Pharmacy',
                style:
                    TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: Colors.grey.shade700)),
            const SizedBox(height: 8),
            _loadingPharmacies
                ? const SizedBox(height: 40, child: Center(child: CircularProgressIndicator(strokeWidth: 2)))
                : _pharmacies.isEmpty
                    ? const Padding(
                        padding: EdgeInsets.symmetric(vertical: 12),
                        child: Text('No pharmacies available. Check your connection.',
                            style: TextStyle(fontSize: 12, color: Color(0xFFDC2626))),
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
                                      ? AppTheme.primary.withOpacity(0.1)
                                      : const Color(0xFFF9FAFB),
                                  borderRadius: BorderRadius.circular(16),
                                  border: Border.all(
                                    color: selected
                                        ? AppTheme.primary
                                        : const Color(0xFFE5E7EB),
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
                                            ? AppTheme.primary
                                            : AppTheme.primary.withOpacity(0.12),
                                        borderRadius: BorderRadius.circular(10),
                                      ),
                                      child: const Icon(Icons.local_pharmacy,
                                          size: 18,
                                          color: AppTheme.primaryDark),
                                    ),
                                    const SizedBox(height: 8),
                                    Expanded(
                                      child: Text(p.name ?? 'Pharmacy',
                                          maxLines: 2,
                                          overflow: TextOverflow.ellipsis,
                                          style: const TextStyle(
                                              fontSize: 12.5,
                                              fontWeight: FontWeight.w600,
                                              color: Color(0xFF111827))),
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
                  backgroundColor: AppTheme.primary,
                  disabledBackgroundColor: AppTheme.primary.withOpacity(0.5),
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
                    : const Text('Submit Prescription',
                        style: TextStyle(
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
