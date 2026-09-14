import 'package:flutter/material.dart';
import '../../services/customer_repository.dart';
import '../../services/offline_service.dart';
import '../../theme.dart';

class ChatbotScreen extends StatefulWidget {
  const ChatbotScreen({super.key});

  @override
  State<ChatbotScreen> createState() => _ChatbotScreenState();
}

class _Message {
  final String text;
  final bool fromUser;

  _Message(this.text, {required this.fromUser});
}

class _ChatbotScreenState extends State<ChatbotScreen> {
  final _controller = TextEditingController();
  final _scroll = ScrollController();
  final List<_Message> _messages = [];
  List<String> _suggestions = [
    'How do I order medicines?',
    'How do I track my order?',
    'What payment methods are accepted?',
    'Do you offer delivery?',
  ];
  bool _sending = false;

  static const _starter = [
    'Hello! 👋 I can help you with orders, prescriptions, payments, telemedicine, loyalty, and insurance. What would you like to know?',
  ];

  @override
  void initState() {
    super.initState();
    _messages.add(_Message(_starter.first, fromUser: false));
    _scrollAfterFrame();
  }

  @override
  void dispose() {
    _controller.dispose();
    _scroll.dispose();
    super.dispose();
  }

  void _scrollAfterFrame() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scroll.hasClients) {
        _scroll.animateTo(
          _scroll.position.maxScrollExtent,
          duration: const Duration(milliseconds: 250),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Future<void> _send(String raw) async {
    final text = raw.trim();
    if (text.isEmpty || _sending) return;
    _controller.clear();
    setState(() {
      _messages.add(_Message(text, fromUser: true));
      _sending = true;
      _suggestions = [];
    });
    _scrollAfterFrame();

    try {
      final res = await CustomerRepository.chatbotReply(text);
      final reply = res['reply']?.toString() ?? 'Sorry, I could not process that.';
      final suggestions = res['suggestions'] is List ? res['suggestions'].map((s) => s.toString()).toList() : <String>[];
      if (mounted) {
        setState(() {
          _messages.add(_Message(reply, fromUser: false));
          _suggestions = suggestions;
          _sending = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _messages.add(_Message(
            'I could not reach the server right now. Please check your connection and try again.',
            fromUser: false,
          ));
          _sending = false;
        });
      }
    }
    _scrollAfterFrame();
  }

  @override
  Widget build(BuildContext context) {
    final isOffline = OfflineService.isOffline.value;
    return Scaffold(
      backgroundColor: AppTheme.bgLight,
      appBar: AppBar(
        title: const Text('Assistant'),
        backgroundColor: Colors.white,
        centerTitle: false,
        actions: [
          if (isOffline)
            Padding(
              padding: const EdgeInsets.only(right: 12),
              child: Center(
                child: Icon(Icons.wifi_off, size: 18, color: Colors.grey.shade500),
              ),
            ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: ListView.builder(
              controller: _scroll,
              padding: const EdgeInsets.all(16),
              itemCount: _messages.length,
              itemBuilder: (ctx, i) {
                final msg = _messages[i];
                return _Bubble(text: msg.text, fromUser: msg.fromUser);
              },
            ),
          ),
          if (_suggestions.isNotEmpty)
            Container(
              padding: const EdgeInsets.fromLTRB(12, 0, 12, 4),
              child: Wrap(
                spacing: 8,
                runSpacing: 4,
                children: _suggestions.map((s) {
                  return ActionChip(
                    label: Text(s, style: const TextStyle(fontSize: 12)),
                    backgroundColor: AppTheme.primary.withOpacity(0.06),
                    side: BorderSide(color: AppTheme.primary.withOpacity(0.4)),
                    shape: StadiumBorder(side: BorderSide(color: AppTheme.primary.withOpacity(0.3))),
                    onPressed: _sending ? null : () => _send(s),
                  );
                }).toList(),
              ),
            ),
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              border: Border(top: BorderSide(color: Colors.grey.shade200)),
            ),
            child: SafeArea(
              top: false,
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                child: Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _controller,
                        textInputAction: TextInputAction.send,
                        minLines: 1,
                        maxLines: 4,
                        onSubmitted: _send,
                        decoration: InputDecoration(
                          hintText: 'Ask me anything…',
                          filled: true,
                          fillColor: AppTheme.bgLight,
                          isDense: true,
                          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(24),
                            borderSide: BorderSide.none,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    GestureDetector(
                      onTap: _sending ? null : () => _send(_controller.text),
                      child: Container(
                        padding: const EdgeInsets.all(12),
                        decoration: const BoxDecoration(
                          color: AppTheme.primary,
                          shape: BoxShape.circle,
                        ),
                        child: _sending
                            ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                            : const Icon(Icons.send_rounded, color: Colors.white, size: 18),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _Bubble extends StatelessWidget {
  final String text;
  final bool fromUser;

  const _Bubble({required this.text, required this.fromUser});

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: fromUser ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.78),
        decoration: BoxDecoration(
          color: fromUser ? AppTheme.primary : Colors.white,
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(16),
            topRight: const Radius.circular(16),
            bottomLeft: Radius.circular(fromUser ? 16 : 4),
            bottomRight: Radius.circular(fromUser ? 4 : 16),
          ),
          border: fromUser ? null : Border.all(color: Colors.grey.shade200),
        ),
        child: Text(
          text,
          style: TextStyle(
            fontSize: 14,
            height: 1.4,
            color: fromUser ? Colors.white : AppTheme.textDark,
          ),
        ),
      ),
    );
  }
}