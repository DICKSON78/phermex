/// Resolves the Jitsi meeting coordinates for a telemedicine session.
///
/// The backend is inconsistent about which fields it fills in: some sessions
/// only carry `room_code`, others only a full `room_url`. Normalising both here
/// means the "Join" button works no matter which one the server returned.
class ConsultSession {
  final String roomUrl;
  final String jitsiServer;
  final String roomCode;
  final bool isLive;

  const ConsultSession({
    required this.roomUrl,
    required this.jitsiServer,
    required this.roomCode,
    required this.isLive,
  });

  /// False when the server gave us nothing to dial, so the UI can explain
  /// instead of opening a blank call screen.
  bool get isJoinable => roomCode.isNotEmpty || roomUrl.isNotEmpty;

  static const defaultServer = 'https://meet.jit.si';

  /// Builds a session from an API record or a push payload. Unknown keys are
  /// ignored, and snake_case/camelCase payloads are both accepted.
  static ConsultSession from(Map<String, dynamic> data) {
    final status = '${_read(data, 'status') ?? ''}';
    final server = _read(data, 'jitsi_server') ?? _read(data, 'jitsiServer');
    final jitsiServer = (server == null || '$server'.isEmpty)
        ? defaultServer
        : '$server';

    var code = '${_read(data, 'room_code') ?? _read(data, 'roomCode') ?? ''}'
        .trim();
    final url = '${_read(data, 'room_url') ?? _read(data, 'roomUrl') ?? ''}'
        .trim();

    // A room URL with no explicit code still identifies the meeting.
    if (code.isEmpty && url.isNotEmpty) {
      final parsed = Uri.tryParse(url);
      final segments = parsed?.pathSegments.where((s) => s.isNotEmpty) ?? const <String>[];
      if (segments.isNotEmpty) code = segments.last;
    }

    final roomUrl = url.isNotEmpty
        ? url
        : (code.isEmpty ? defaultServer : '$jitsiServer/$code');

    return ConsultSession(
      roomUrl: roomUrl,
      jitsiServer: jitsiServer,
      roomCode: code,
      isLive: status.isEmpty ? true : status == 'live',
    );
  }

  /// The scheduled start time, when the record carries a parseable one.
  static DateTime? scheduledAt(Map<String, dynamic> data) {
    final raw = _read(data, 'scheduled_at') ??
        _read(data, 'scheduledAt') ??
        _read(data, 'appointment_date');
    if (raw == null) return null;
    final parsed = DateTime.tryParse('$raw'.trim());
    if (parsed == null) return null;
    return parsed.toLocal();
  }

  static Object? _read(Map<String, dynamic> data, String key) {
    if (data.containsKey(key)) return data[key];
    // Tolerate a nested `session` object from older endpoints.
    final nested = data['session'];
    if (nested is Map && nested.containsKey(key)) return nested[key];
    return null;
  }
}
