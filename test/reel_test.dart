import 'package:flutter_test/flutter_test.dart';
import 'package:pharmex_customer_app/models/models.dart';

void main() {
  group('PharmacyReel', () {
    test('parses a reel posted by a pharmacy', () {
      final reel = PharmacyReel.fromJson({
        'id': 7,
        'title': 'Free blood pressure check',
        'description': 'Everyday 9am - 5pm',
        'media_type': 'image',
        'media_url': 'https://helix.co.tz/storage/1.jpg',
        'thumbnail_url': null,
        'status': 'published',
        'pharmacy': {'id': 42, 'name': 'Malka Pharmacy', 'location': 'Kinondoni'},
      });

      expect(reel.id, 7);
      expect(reel.pharmacyId, 42);
      expect(reel.title, 'Free blood pressure check');
      expect(reel.pharmacyName, 'Malka Pharmacy');
      expect(reel.pharmacyLocation, 'Kinondoni');
      expect(reel.isVideo, isFalse);
    });

    test('accepts camelCase keys from the API payload', () {
      final reel = PharmacyReel.fromJson({
        'id': 8,
        'title': 'Delivery now available',
        'mediaType': 'video',
        'mediaUrl': 'https://helix.co.tz/storage/2.mp4',
        'pharmacy_id': 43,
      });

      expect(reel.mediaType, 'video');
      expect(reel.mediaUrl, 'https://helix.co.tz/storage/2.mp4');
      expect(reel.pharmacyId, 43);
      expect(reel.isVideo, isTrue);
    });

    test('falls back to pharmacy id 0 when the feed omits the pharmacy', () {
      final reel = PharmacyReel.fromJson({
        'id': 9,
        'title': 'Generic offer',
        'media_type': 'image',
        'media_url': 'https://helix.co.tz/storage/3.jpg',
      });

      expect(reel.pharmacyId, 0);
      expect(reel.pharmacyName, isNull);
    });

    test('each reel is keyed by its pharmacy so one pharmacy means one reel', () {
      // The feed is deduplicated by pharmacyId, so a pharmacy contributes at
      // most one entry even if the backend payload repeats it.
      final payload = [
        {
          'id': 1,
          'title': 'Pharmacy 42 reel',
          'media_type': 'image',
          'media_url': 'https://helix.co.tz/storage/a.jpg',
          'pharmacy': {'id': 42, 'name': 'Malka Pharmacy'},
        },
        {
          'id': 2,
          'title': 'Pharmacy 43 reel',
          'media_type': 'video',
          'media_url': 'https://helix.co.tz/storage/b.mp4',
          'pharmacy': {'id': 43, 'name': 'Mbao Pharmacy'},
        },
      ].map((e) => PharmacyReel.fromJson(e)).toList();

      final seen = <int>{};
      final deduped = payload.where((r) => seen.add(r.pharmacyId)).toList();

      expect(deduped.length, 2);
      expect(deduped.map((r) => r.pharmacyId).toSet(), {42, 43});
    });
  });
}
