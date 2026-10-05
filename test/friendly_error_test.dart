import 'package:flutter_test/flutter_test.dart';
import 'package:pharmex_customer_app/services/api_service.dart';

void main() {
  group('friendlyError surfaces real API messages', () {
    test('passes through a server validation message', () {
      expect(
        ApiService.friendlyError(ApiException('The email has already been taken.')),
        'The email has already been taken.',
      );
    });

    test('passes through the gateway-not-configured message', () {
      expect(
        ApiService.friendlyError(ApiException('Payment gateway not configured.')),
        'Payment gateway not configured.',
      );
    });

    test('still maps 403/404 style messages that arrive as plain text', () {
      // non-ApiException paths keep their original string behaviour
      expect(ApiService.friendlyError(Exception('boom 404')), isNotEmpty);
    });

    test('does not leak connection internals', () {
      final out = ApiService.friendlyError(
        ApiException('connection to db failed at 10.0.0.5'),
      );
      expect(out, isNot(contains('10.0.0.5')));
    });
  });
}
