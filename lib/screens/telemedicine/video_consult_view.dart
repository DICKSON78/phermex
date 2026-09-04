import 'package:flutter/material.dart';
import 'package:jitsi_meet_flutter_sdk/jitsi_meet_flutter_sdk.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../services/api_service.dart';
import '../../theme.dart';

/// A custom-styled video call view. Launches an in-app Jitsi meet room and also
/// offers the option to open the call in the system web browser.
class VideoConsultView extends StatefulWidget {
  final String roomUrl;
  final String jitsiServer;
  final String roomCode;
  final String pharmacyName;
  final bool isLive;

  const VideoConsultView({
    super.key,
    required this.roomUrl,
    required this.jitsiServer,
    required this.roomCode,
    required this.pharmacyName,
    this.isLive = true,
  });

  @override
  State<VideoConsultView> createState() => _VideoConsultViewState();
}

class _VideoConsultViewState extends State<VideoConsultView> {
  final _jitsi = JitsiMeet();
  bool _joining = false;

  String get _userName => ApiService.userName?.isNotEmpty == true
      ? ApiService.userName!
      : 'Patient';

  Future<void> _joinInApp() async {
    setState(() => _joining = true);
    try {
      final options = JitsiMeetConferenceOptions(
        serverURL: widget.jitsiServer,
        room: widget.roomCode,
        userInfo: JitsiMeetUserInfo(
          displayName: _userName,
          email: ApiService.cachedUser?['email']?.toString(),
        ),
        featureFlags: const {
          'call-integration.enabled': false,
          'chat.enabled': true,
          'raise-hand.enabled': false,
          'toolbox.alwaysVisible': false,
        },
      );
      await _jitsi.join(
        options,
        JitsiMeetEventListener(conferenceTerminated: (_, __) {
          if (mounted) Navigator.of(context).pop();
        }),
      );
    } catch (e) {
      if (!mounted) return;
      setState(() => _joining = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Could not start video. ${ApiService.friendlyError(e)}'),
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  Future<void> _openInBrowser() async {
    try {
      final uri = Uri.parse(widget.roomUrl);
      final ok = await launchUrl(uri, mode: LaunchMode.externalApplication);
      if (!ok && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Could not open browser'),
              behavior: SnackBarBehavior.floating),
        );
      }
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Could not open browser'),
            behavior: SnackBarBehavior.floating),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.darkSurface,
      appBar: AppBar(
        backgroundColor: AppTheme.darkSurface,
        foregroundColor: Colors.white,
        elevation: 0,
        title: const Text('Video Consult',
            style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w700)),
      ),
      body: SafeArea(
        child: Column(
          children: [
            const Spacer(),
            // Avatar / camera placeholder styled like a live call
            Container(
              width: 140,
              height: 140,
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.12),
                shape: BoxShape.circle,
              ),
              child: widget.isLive
                  ? const Icon(Icons.videocam, size: 56, color: Colors.white)
                  : const Icon(Icons.video_call, size: 56, color: Colors.white),
            ),
            const SizedBox(height: 20),
            const Text('Live Consultation',
                style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w700)),
            const SizedBox(height: 6),
            Text(widget.pharmacyName,
                style: const TextStyle(color: Color(0xFF9CA3AF), fontSize: 13)),
            const SizedBox(height: 4),
            Text(widget.isLive ? 'Call is ready for you' : 'Waiting for pharmacist',
                style: const TextStyle(color: Color(0xFF9CA3AF), fontSize: 12)),
            const Spacer(),
            if (_joining) ...[
              const CircularProgressIndicator(color: AppTheme.primary),
              const SizedBox(height: 16),
            ],
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Column(
                children: [
                  SizedBox(
                    width: double.infinity,
                    height: 52,
                    child: ElevatedButton.icon(
                      onPressed: _joining ? null : _joinInApp,
                      icon: const Icon(Icons.videocam, size: 20, color: Colors.white),
                      label: Text(_joining ? 'Joining…' : 'Open In-App Video',
                          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
                      style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primary),
                    ),
                  ),
                  const SizedBox(height: 12),
                  SizedBox(
                    width: double.infinity,
                    height: 52,
                    child: OutlinedButton.icon(
                      onPressed: _openInBrowser,
                      icon: const Icon(Icons.public, size: 20, color: Colors.white),
                      label: const Text('Continue in Web Browser',
                          style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: Colors.white,
                        side: const BorderSide(color: Color(0xFF4B5563)),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}