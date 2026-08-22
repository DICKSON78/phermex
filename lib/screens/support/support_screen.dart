import 'package:flutter/material.dart';
import '../../models/models.dart';
import '../../services/customer_repository.dart';
import '../../theme.dart';
import '../../utils/helpers.dart';

class SupportScreen extends StatefulWidget {
  const SupportScreen({super.key});

  @override
  State<SupportScreen> createState() => _SupportScreenState();
}

class _SupportScreenState extends State<SupportScreen> {
  List<SupportTicket> _tickets = [];
  bool _loading = true;
  String? _error;
  SupportTicket? _selected;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final list = await CustomerRepository.supportTickets();
      if (!mounted) return;
      setState(() {
        _tickets = list;
        _error = null;
      });
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _refreshDetail(SupportTicket ticket) async {
    try {
      final list = await CustomerRepository.supportTickets();
      final updated = list.firstWhere((t) => t.id == ticket.id, orElse: () => ticket);
      if (!mounted) return;
      setState(() => _selected = updated);
    } catch (_) {
      // Keep current detail on refresh failure
    }
  }

  void _openDetail(SupportTicket ticket) {
    setState(() => _selected = ticket);
  }

  Future<void> _sendReply(String text) async {
    final ticket = _selected;
    if (ticket == null || text.trim().isEmpty) return;
    try {
      await CustomerRepository.replySupportTicket(ticket.id, text.trim());
      await _refreshDetail(ticket);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to send: $e')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.bgLight,
      appBar: AppBar(
        title: Text(_selected == null ? 'Support' : 'Ticket #${_selected!.id}'),
        backgroundColor: Colors.white,
        leading: _selected == null
            ? null
            : IconButton(
                icon: const Icon(Icons.arrow_back),
                onPressed: () => setState(() => _selected = null),
              ),
      ),
      floatingActionButton: _selected == null
          ? FloatingActionButton(
              backgroundColor: AppTheme.primary,
              foregroundColor: Colors.white,
              onPressed: () => _showCreateSheet(),
              child: const Icon(Icons.add),
            )
          : null,
      body: _selected == null ? _buildList() : _buildDetail(_selected!),
    );
  }

  Widget _buildList() {
    if (_loading) return const Center(child: CircularProgressIndicator());
    if (_error != null) {
      return Center(
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
      );
    }
    if (_tickets.isEmpty) {
      return RefreshIndicator(
        onRefresh: _load,
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          children: const [
            SizedBox(height: 120),
            Icon(Icons.support_agent, size: 56, color: Color(0xFFD1D5DB)),
            SizedBox(height: 16),
            Center(child: Text('No support tickets yet',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: Color(0xFF111827)))),
            SizedBox(height: 6),
            Center(child: Text('Tap + to contact the Pharmex team',
                style: TextStyle(fontSize: 13, color: Color(0xFF9CA3AF)))),
          ],
        ),
      );
    }
    return RefreshIndicator(
      onRefresh: _load,
      child: ListView.separated(
        padding: const EdgeInsets.all(16),
        physics: const AlwaysScrollableScrollPhysics(),
        itemCount: _tickets.length,
        separatorBuilder: (_, index) => const SizedBox(height: 10),
        itemBuilder: (context, index) {
          final t = _tickets[index];
          return _TicketCard(ticket: t, onTap: () => _openDetail(t));
        },
      ),
    );
  }

  Widget _buildDetail(SupportTicket ticket) {
    return Column(
      children: [
        Expanded(
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppTheme.border),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(ticket.subject ?? 'Ticket #${ticket.id}',
                              style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: Color(0xFF111827))),
                        ),
                        _StatusBadge(status: ticket.status),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Text(ticket.description ?? '',
                        style: const TextStyle(fontSize: 14, height: 1.5, color: Color(0xFF374151))),
                    const SizedBox(height: 12),
                    Text('Opened ${_date(ticket.createdAt)}',
                        style: const TextStyle(fontSize: 11, color: Color(0xFF9CA3AF))),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 4),
                child: Text('Conversation',
                    style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: Color(0xFF111827))),
              ),
              const SizedBox(height: 10),
              if (ticket.replies.isEmpty)
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 20),
                  child: Center(child: Text('No replies yet. The team will respond soon.',
                      style: TextStyle(fontSize: 13, color: Color(0xFF9CA3AF)))),
                ),
              ...ticket.replies.map((r) => _ReplyBubble(reply: r)),
            ],
          ),
        ),
        if (ticket.status == 'open' || ticket.status == 'in_progress')
          _ReplyBar(onSend: _sendReply),
      ],
    );
  }

  String _date(String? value) {
    return AppHelpers.formatDate(value);
  }

  void _showCreateSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _CreateTicketSheet(
        onCreated: () async {
          await _load();
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Ticket submitted. We will get back to you.')),
            );
          }
        },
      ),
    );
  }
}

class _TicketCard extends StatelessWidget {
  final SupportTicket ticket;
  final VoidCallback onTap;
  const _TicketCard({required this.ticket, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppTheme.border),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text('#${ticket.id} ${ticket.subject ?? ''}',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: Color(0xFF111827))),
                ),
                _StatusBadge(status: ticket.status),
              ],
            ),
            const SizedBox(height: 6),
            Text(ticket.description ?? '',
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(fontSize: 13, height: 1.4, color: Color(0xFF6B7280))),
            const SizedBox(height: 10),
            Text('${_label(ticket.priority)} priority',
                style: const TextStyle(fontSize: 11, color: Color(0xFF9CA3AF))),
          ],
        ),
      ),
    );
  }

  String _label(String? value) {
    if (value == null) return '';
    final map = {'low': 'Low', 'medium': 'Medium', 'high': 'High', 'urgent': 'Urgent'};
    return map[value.toLowerCase()] ?? value;
  }
}

class _StatusBadge extends StatelessWidget {
  final String? status;
  const _StatusBadge({this.status});

  @override
  Widget build(BuildContext context) {
    final s = status ?? '';
    Color bg = const Color(0xFFF3F4F6);
    Color fg = const Color(0xFF6B7280);
    String label = s;
    switch (s) {
      case 'open':
        bg = const Color(0xFFDBEAFE);
        fg = const Color(0xFF1D4ED8);
        label = 'Open';
        break;
      case 'in_progress':
        bg = const Color(0xFFFEF3C7);
        fg = const Color(0xFFB45309);
        label = 'In Progress';
        break;
      case 'resolved':
        bg = const Color(0xFFD1FAE5);
        fg = const Color(0xFF047857);
        label = 'Resolved';
        break;
      case 'closed':
        bg = const Color(0xFFF3F4F6);
        fg = const Color(0xFF4B5563);
        label = 'Closed';
        break;
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(999)),
      child: Text(label, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: fg)),
    );
  }
}

class _ReplyBubble extends StatelessWidget {
  final TicketReply reply;
  const _ReplyBubble({required this.reply});

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: reply.fromAdmin ? Alignment.centerLeft : Alignment.centerRight,
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.all(14),
        constraints: const BoxConstraints(maxWidth: 300),
        decoration: BoxDecoration(
          color: reply.fromAdmin ? const Color(0xFFE7F9EF) : const Color(0xFFE5E7EB),
          borderRadius: BorderRadius.circular(14),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(reply.fromAdmin ? 'Pharmex Team' : 'You',
                style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Color(0xFF374151))),
            const SizedBox(height: 4),
            Text(reply.message ?? '',
                style: const TextStyle(fontSize: 13, height: 1.4, color: Color(0xFF111827))),
            const SizedBox(height: 6),
            Text(reply.createdAt ?? '',
                style: const TextStyle(fontSize: 10, color: Color(0xFF9CA3AF))),
          ],
        ),
      ),
    );
  }
}

class _ReplyBar extends StatefulWidget {
  final Future<void> Function(String text) onSend;
  const _ReplyBar({required this.onSend});

  @override
  State<_ReplyBar> createState() => _ReplyBarState();
}

class _ReplyBarState extends State<_ReplyBar> {
  final TextEditingController _controller = TextEditingController();
  bool _sending = false;

  Future<void> _send() async {
    final text = _controller.text;
    if (text.trim().isEmpty) return;
    setState(() => _sending = true);
    try {
      await widget.onSend(text);
      _controller.clear();
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      top: false,
      child: Container(
        padding: const EdgeInsets.all(12),
        color: Colors.white,
        child: Row(
          children: [
            Expanded(
              child: TextField(
                controller: _controller,
                enabled: !_sending,
                minLines: 1,
                maxLines: 4,
                decoration: const InputDecoration(hintText: 'Type your reply...'),
              ),
            ),
            const SizedBox(width: 10),
            _sending
                ? const SizedBox(
                    width: 44,
                    height: 44,
                    child: Center(child: CircularProgressIndicator(strokeWidth: 2)),
                  )
                : IconButton.filled(
                    onPressed: _send,
                    style: IconButton.styleFrom(
                      backgroundColor: AppTheme.primary,
                      foregroundColor: Colors.white,
                    ),
                    icon: const Icon(Icons.send),
                  ),
          ],
        ),
      ),
    );
  }
}

class _CreateTicketSheet extends StatefulWidget {
  final VoidCallback onCreated;
  const _CreateTicketSheet({required this.onCreated});

  @override
  State<_CreateTicketSheet> createState() => _CreateTicketSheetState();
}

class _CreateTicketSheetState extends State<_CreateTicketSheet> {
  final TextEditingController _subject = TextEditingController();
  final TextEditingController _description = TextEditingController();
  String _category = 'Technical Issue';
  String _priority = 'medium';
  bool _submitting = false;
  String? _error;

  static const _categories = [
    'Technical Issue',
    'Order & Delivery',
    'Payment',
    'Account & Login',
    'Other',
  ];

  @override
  void dispose() {
    _subject.dispose();
    _description.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_subject.text.trim().isEmpty || _description.text.trim().isEmpty) {
      setState(() => _error = 'Subject and description are required.');
      return;
    }
    setState(() {
      _submitting = true;
      _error = null;
    });
    try {
      await CustomerRepository.createSupportTicket(
        subject: _subject.text.trim(),
        description: _description.text.trim(),
        category: _category,
        priority: _priority,
      );
      if (mounted) {
        Navigator.of(context).pop();
        widget.onCreated();
      }
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.of(context).viewInsets.bottom;
    return Padding(
      padding: EdgeInsets.only(bottom: bottom),
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: const Color(0xFFE5E7EB),
                  borderRadius: BorderRadius.circular(999),
                ),
              ),
            ),
            const SizedBox(height: 16),
            const Text('New Support Ticket',
                style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700, color: Color(0xFF111827))),
            const SizedBox(height: 4),
            const Text('Describe your issue and the Pharmex team will help.',
                style: TextStyle(fontSize: 13, color: Color(0xFF6B7280))),
            const SizedBox(height: 16),
            TextField(
              controller: _subject,
              decoration: const InputDecoration(labelText: 'Subject'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _description,
              minLines: 3,
              maxLines: 5,
              decoration: const InputDecoration(labelText: 'Description'),
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              initialValue: _category,
              decoration: const InputDecoration(labelText: 'Category'),
              items: _categories.map((c) => DropdownMenuItem(value: c, child: Text(c))).toList(),
              onChanged: (v) => setState(() => _category = v ?? _category),
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              initialValue: _priority,
              decoration: const InputDecoration(labelText: 'Priority'),
              items: const [
                DropdownMenuItem(value: 'low', child: Text('Low')),
                DropdownMenuItem(value: 'medium', child: Text('Medium')),
                DropdownMenuItem(value: 'high', child: Text('High')),
                DropdownMenuItem(value: 'urgent', child: Text('Urgent')),
              ],
              onChanged: (v) => setState(() => _priority = v ?? _priority),
            ),
            if (_error != null) ...[
              const SizedBox(height: 10),
              Text(_error!, style: const TextStyle(fontSize: 12, color: Color(0xFFDC2626))),
            ],
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _submitting ? null : _submit,
                child: _submitting
                    ? const SizedBox(
                        width: 22,
                        height: 22,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                      )
                    : const Text('Submit Ticket'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
