import 'package:flutter/material.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../app/theme/app_typography.dart';
import '../../../../core/utils/date_formatters.dart';
import '../../../../core/widgets/status_chip.dart';
import '../../../../data/models/day_summary.dart';

class RecentDaysList extends StatelessWidget {
  const RecentDaysList({
    required this.summaries,
    required this.onDayTap,
    super.key,
  });

  final List<DaySummary> summaries;
  final ValueChanged<DateTime> onDayTap;

  @override
  Widget build(BuildContext context) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);

    // Filter to past & today days only, in reverse chronological order
    final pastDays = summaries
        .where((s) => !s.date.isAfter(today))
        .toList()
        .reversed
        .toList();

    if (pastDays.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(AppSpacing.lg),
        decoration: BoxDecoration(
          color: AppColors.card,
          borderRadius: AppSpacing.borderRadiusCard,
          border: Border.all(color: AppColors.cardBorder),
        ),
        child: const Center(
          child: Text(
            'No attendance records found for this period.',
            style: TextStyle(color: AppColors.textMuted),
          ),
        ),
      );
    }

    return Column(
      children: pastDays.map((summary) {
        return Padding(
          padding: const EdgeInsets.only(bottom: AppSpacing.sm),
          child: _RecentDayItem(
            summary: summary,
            onTap: () => onDayTap(summary.date),
          ),
        );
      }).toList(),
    );
  }
}

class _RecentDayItem extends StatelessWidget {
  const _RecentDayItem({
    required this.summary,
    required this.onTap,
  });

  final DaySummary summary;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final date = summary.date;

    // Date formatting
    final dayOfWeek = switch (date.weekday) {
      DateTime.monday => 'Mon',
      DateTime.tuesday => 'Tue',
      DateTime.wednesday => 'Wed',
      DateTime.thursday => 'Thu',
      DateTime.friday => 'Fri',
      DateTime.saturday => 'Sat',
      DateTime.sunday => 'Sun',
      _ => '',
    };
    final monthShort = switch (date.month) {
      1 => 'Jan',
      2 => 'Feb',
      3 => 'Mar',
      4 => 'Apr',
      5 => 'May',
      6 => 'Jun',
      7 => 'Jul',
      8 => 'Aug',
      9 => 'Sep',
      10 => 'Oct',
      11 => 'Nov',
      12 => 'Dec',
      _ => '',
    };
    final dateStr = '$dayOfWeek, ${date.day} $monthShort';

    // In / Out times span
    String timesSpan = 'No punch recorded';
    if (summary.sessions.isNotEmpty) {
      final firstIn = DateFormatters.formatTime(summary.sessions.first.inTime);
      final lastOut = summary.sessions.last.outTime != null
          ? DateFormatters.formatTime(summary.sessions.last.outTime!)
          : 'Running';
      timesSpan = '$firstIn – $lastOut';
    } else if (summary.status == DayStatus.weeklyOff) {
      timesSpan = 'Scheduled weekly off';
    }

    final workedFormatted = DateFormatters.formatDuration(summary.totalWorked);

    return InkWell(
      onTap: onTap,
      borderRadius: AppSpacing.borderRadiusCard,
      child: Container(
        padding: const EdgeInsets.all(AppSpacing.md),
        decoration: BoxDecoration(
          color: AppColors.card,
          borderRadius: AppSpacing.borderRadiusCard,
          border: Border.all(color: AppColors.cardBorder),
        ),
        child: Row(
          children: [
            // Left: Date + Times span
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Wrap(
                    crossAxisAlignment: WrapCrossAlignment.center,
                    spacing: AppSpacing.xs,
                    runSpacing: 2.0,
                    children: [
                      Text(
                        dateStr,
                        style: theme.textTheme.titleSmall?.copyWith(
                          fontWeight: FontWeight.w700,
                          fontSize: 14.5,
                        ),
                      ),
                      _buildStatusChip(summary.status),
                    ],
                  ),
                  const SizedBox(height: 4.0),
                  Text(
                    timesSpan,
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: AppColors.textMuted,
                      fontSize: 12.0,
                    ),
                  ),
                ],
              ),
            ),

            // Right: Total Worked Time + Chevron
            if (summary.totalWorked > Duration.zero) ...[
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    workedFormatted,
                    style: AppTypography.tabular(
                      fontSize: 14.0,
                      fontWeight: FontWeight.w700,
                      color: AppColors.primary,
                    ),
                  ),
                  Text(
                    '${summary.sessions.length} ${summary.sessions.length == 1 ? 'session' : 'sessions'}',
                    style: theme.textTheme.labelMedium?.copyWith(
                      color: AppColors.textMuted,
                      fontSize: 10.5,
                    ),
                  ),
                ],
              ),
              const SizedBox(width: AppSpacing.xs),
            ],

            const Icon(
              Icons.chevron_right_rounded,
              color: AppColors.textMuted,
              size: 20.0,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusChip(DayStatus status) {
    switch (status) {
      case DayStatus.present:
        return const StatusChip(
          label: 'Present',
          variant: StatusChipVariant.success,
        );
      case DayStatus.late:
        return const StatusChip(
          label: 'Late',
          variant: StatusChipVariant.warning,
        );
      case DayStatus.halfDay:
        return const StatusChip(
          label: 'Half Day',
          variant: StatusChipVariant.warning,
        );
      case DayStatus.absent:
        return const StatusChip(
          label: 'Absent',
          variant: StatusChipVariant.error,
        );
      case DayStatus.weeklyOff:
        return const StatusChip(
          label: 'Weekly Off',
          variant: StatusChipVariant.neutral,
        );
      case DayStatus.holiday:
        return const StatusChip(
          label: 'Holiday',
          variant: StatusChipVariant.neutral,
        );
      case DayStatus.upcoming:
        return const StatusChip(
          label: 'Upcoming',
          variant: StatusChipVariant.neutral,
        );
    }
  }
}
