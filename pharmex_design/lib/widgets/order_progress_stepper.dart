import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

/// One stage of the customer order journey as returned by
/// `GET /api/customer-app/orders/{id}` → `data.progress.stages`.
class OrderProgressStage {
  final String key;
  final String label;
  final String shortLabel;
  final bool completed;
  final bool active;
  final DateTime? at;

  const OrderProgressStage({
    required this.key,
    required this.label,
    required this.shortLabel,
    required this.completed,
    required this.active,
    this.at,
  });

  factory OrderProgressStage.fromJson(Map<String, dynamic> json) {
    final rawAt = json['at'] as String?;
    return OrderProgressStage(
      key: json['key'] as String? ?? '',
      label: json['label'] as String? ?? '',
      shortLabel: json['short'] as String? ?? json['label'] as String? ?? '',
      completed: json['completed'] as bool? ?? false,
      active: json['active'] as bool? ?? false,
      at: rawAt == null ? null : DateTime.tryParse(rawAt),
    );
  }
}

/// Parsed `progress` payload from the customer-app order API.
///
/// The API owns the six-step vocabulary
/// (placed → confirmed → preparing → ready → out for delivery → delivered),
/// so the app renders whatever stage list it receives instead of hard-coding
/// status names. That keeps the mobile UI in lock-step with the web dashboard.
class OrderProgress {
  final String status;
  final String current;
  final bool cancelled;
  final List<OrderProgressStage> stages;

  const OrderProgress({
    required this.status,
    required this.current,
    required this.cancelled,
    required this.stages,
  });

  factory OrderProgress.fromJson(Map<String, dynamic> json) {
    final rawStages = (json['stages'] as List<dynamic>? ?? const []);
    return OrderProgress(
      status: json['status'] as String? ?? 'pending',
      current: json['current'] as String? ?? 'pending',
      cancelled: json['cancelled'] as bool? ?? false,
      stages: rawStages
          .whereType<Map<String, dynamic>>()
          .map(OrderProgressStage.fromJson)
          .toList(growable: false),
    );
  }
}

/// Horizontal preparation → delivery stepper for the customer app.
///
/// Mirrors the dashboard's shared `OrderFlowProgress` component: completed
/// steps are filled brand green, the active step is outlined, and future
/// steps stay muted.
class OrderProgressStepper extends StatelessWidget {
  final OrderProgress progress;
  final bool showTimestamps;

  const OrderProgressStepper({
    super.key,
    required this.progress,
    this.showTimestamps = false,
  });

  @override
  Widget build(BuildContext context) {
    if (progress.cancelled) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(
          color: const Color(0xFFFDECEC),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: const Color(0xFFF6C9C9)),
        ),
        child: const Row(
          children: [
            Icon(Icons.cancel_outlined, size: 18, color: Color(0xFFDC2626)),
            SizedBox(width: 8),
            Text(
              'Order cancelled',
              style: TextStyle(
                fontSize: 12.5,
                fontWeight: FontWeight.w700,
                color: Color(0xFFDC2626),
              ),
            ),
          ],
        ),
      );
    }

    final stages = progress.stages;
    if (stages.isEmpty) return const SizedBox.shrink();

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: List.generate(stages.length, (index) {
        final stage = stages[index];
        final isLast = index == stages.length - 1;
        return Expanded(
          child: Column(
            children: [
              Row(
                children: [
                  _StepDot(stage: stage),
                  if (!isLast)
                    Expanded(
                      child: Container(
                        height: 2,
                        color: stage.completed
                            ? AppColors.brand500
                            : AppColors.line,
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 6),
              Align(
                alignment: isLast
                    ? Alignment.centerRight
                    : Alignment.centerLeft,
                child: Padding(
                  padding: EdgeInsets.only(right: isLast ? 0 : 6),
                  child: Text(
                    stage.shortLabel,
                    textAlign: isLast ? TextAlign.right : TextAlign.left,
                    style: TextStyle(
                      fontSize: 10.5,
                      height: 1.15,
                      fontWeight: stage.active || stage.completed
                          ? FontWeight.w700
                          : FontWeight.w500,
                      color: stage.active
                          ? AppColors.brand700
                          : stage.completed
                          ? AppColors.ink
                          : AppColors.muted,
                    ),
                  ),
                ),
              ),
              if (showTimestamps && stage.at != null) ...[
                const SizedBox(height: 2),
                Align(
                  alignment: isLast
                      ? Alignment.centerRight
                      : Alignment.centerLeft,
                  child: Padding(
                    padding: EdgeInsets.only(right: isLast ? 0 : 6),
                    child: Text(
                      _formatStamp(stage.at!),
                      style: const TextStyle(
                        fontSize: 9,
                        color: AppColors.muted,
                      ),
                    ),
                  ),
                ),
              ],
            ],
          ),
        );
      }),
    );
  }

  static String _formatStamp(DateTime value) {
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    final local = value.toLocal();
    final hour = local.hour % 12 == 0 ? 12 : local.hour % 12;
    final minute = local.minute.toString().padLeft(2, '0');
    final suffix = local.hour < 12 ? 'AM' : 'PM';
    return '${months[local.month - 1]} ${local.day}, $hour:$minute $suffix';
  }
}

class _StepDot extends StatelessWidget {
  final OrderProgressStage stage;

  const _StepDot({required this.stage});

  @override
  Widget build(BuildContext context) {
    final active = stage.active;
    final completed = stage.completed;

    return Container(
      width: 28,
      height: 28,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: completed ? AppColors.brand500 : Colors.white,
        border: Border.all(
          color: completed || active ? AppColors.brand500 : AppColors.line,
          width: 2,
        ),
      ),
      child: Icon(
        completed
            ? Icons.check_rounded
            : active
            ? Icons.radio_button_checked
            : Icons.circle_outlined,
        size: completed ? 15 : 13,
        color: completed
            ? Colors.white
            : active
            ? AppColors.brand600
            : AppColors.line,
      ),
    );
  }
}
