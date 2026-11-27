import 'package:flutter/material.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../app/theme/app_typography.dart';
import '../../../../core/utils/date_formatters.dart';
import '../../../../core/widgets/info_card.dart';
import '../../../../core/widgets/status_chip.dart';
import '../../../../data/models/day_summary.dart';

class TodaySummaryCard extends StatelessWidget {
  const TodaySummaryCard({
    required this.workedDuration,
    required this.breakDuration,
    required this.sessionCount,
    required this.dayStatus,
    required this.isPunchedIn,
    this.shiftDuration = const Duration(hours: 9),
    this.fullDayTarget = const Duration(hours: 8),
    super.key,
  });

  final Duration workedDuration;
  final Duration breakDuration;
  final int sessionCount;
  final DayStatus dayStatus;
  final bool isPunchedIn;
  final Duration shiftDuration;
  final Duration fullDayTarget;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    final workedFormatted = DateFormatters.formatDuration(workedDuration);
    final breakFormatted = DateFormatters.formatDuration(breakDuration);

    final progress = shiftDuration.inMinutes > 0
        ? (workedDuration.inMinutes / shiftDuration.inMinutes).clamp(0.0, 1.0)
        : 0.0;
    final percent = (progress * 100).round();

    // Remaining duration to 8h full day
    final remainingMinutes = fullDayTarget.inMinutes - workedDuration.inMinutes;
    final remainingHint = remainingMinutes > 0
        ? '${DateFormatters.formatDuration(Duration(minutes: remainingMinutes))} to reach full day'
        : 'Full day target reached';

    return InfoCard(
      padding: const EdgeInsets.all(AppSpacing.lg),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 1. Top Row: Worked Time & Shift Status Chip
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'WORKED TODAY',
                      style: theme.textTheme.labelMedium?.copyWith(
                        fontWeight: FontWeight.w700,
                        color: AppColors.textMuted,
                        letterSpacing: 0.8,
                      ),
                    ),
                    const SizedBox(height: 2.0),
                    FittedBox(
                      fit: BoxFit.scaleDown,
                      alignment: Alignment.centerLeft,
                      child: Text(
                        workedFormatted,
                        style: AppTypography.tabular(
                          fontSize: 32.0,
                          fontWeight: FontWeight.w800,
                          color: AppColors.primary,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: AppSpacing.sm),
              if (isPunchedIn)
                const StatusChip(
                  label: 'Running',
                  variant: StatusChipVariant.success,
                  icon: Icon(Icons.timelapse_rounded, size: 14.0),
                )
              else
                _buildStatusChip(dayStatus),
            ],
          ),

          const SizedBox(height: AppSpacing.md),
          const Divider(color: AppColors.divider, height: 1.0),
          const SizedBox(height: AppSpacing.md),

          // 2. Metrics Row: Total Break & Sessions Count
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'TOTAL BREAK',
                      style: theme.textTheme.labelMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                        color: AppColors.textMuted,
                        letterSpacing: 0.6,
                      ),
                    ),
                    const SizedBox(height: 2.0),
                    Text(
                      breakFormatted,
                      style: AppTypography.tabular(
                        fontSize: 18.0,
                        fontWeight: FontWeight.w700,
                        color: AppColors.text,
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                height: 36.0,
                width: 1.0,
                color: AppColors.divider,
              ),
              const SizedBox(width: AppSpacing.lg),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'SESSIONS',
                      style: theme.textTheme.labelMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                        color: AppColors.textMuted,
                        letterSpacing: 0.6,
                      ),
                    ),
                    const SizedBox(height: 2.0),
                    Text(
                      '$sessionCount ${sessionCount == 1 ? 'session' : 'sessions'}',
                      style: AppTypography.tabular(
                        fontSize: 18.0,
                        fontWeight: FontWeight.w700,
                        color: AppColors.text,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),

          const SizedBox(height: AppSpacing.lg),

          // 3. Progress Bar against shift length
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  'Shift progress',
                  style: theme.textTheme.labelMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                    color: AppColors.textMuted,
                  ),
                ),
              ),
              const SizedBox(width: AppSpacing.sm),
              Text(
                '$percent% (${DateFormatters.formatDuration(shiftDuration)} shift)',
                style: AppTypography.tabular(
                  fontSize: 12.0,
                  fontWeight: FontWeight.w700,
                  color: AppColors.text,
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.xs),
          ClipRRect(
            borderRadius: AppSpacing.borderRadiusPill,
            child: LinearProgressIndicator(
              value: progress,
              minHeight: 8.0,
              backgroundColor: AppColors.primaryContainer.withValues(alpha: 0.4),
              valueColor: const AlwaysStoppedAnimation<Color>(AppColors.primary),
            ),
          ),
          const SizedBox(height: AppSpacing.sm),

          // 4. "Full day needs 8h" Target Hint Pill
          Container(
            padding: const EdgeInsets.symmetric(
              horizontal: AppSpacing.md,
              vertical: 6.0,
            ),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: AppSpacing.borderRadiusPill,
              border: Border.all(color: AppColors.cardBorder),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(
                  Icons.info_outline_rounded,
                  size: 14.0,
                  color: AppColors.primary,
                ),
                const SizedBox(width: AppSpacing.xs),
                Flexible(
                  child: Text(
                    'Full day needs 8h · $remainingHint',
                    style: theme.textTheme.labelMedium?.copyWith(
                      color: AppColors.textMuted,
                      fontSize: 11.5,
                      fontWeight: FontWeight.w600,
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatusChip(DayStatus status) {
    switch (status) {
      case DayStatus.present:
        return const StatusChip(
          label: 'Present',
          variant: StatusChipVariant.success,
          icon: Icon(Icons.check_circle_rounded, size: 14.0),
        );
      case DayStatus.late:
        return const StatusChip(
          label: 'Late',
          variant: StatusChipVariant.warning,
          icon: Icon(Icons.warning_amber_rounded, size: 14.0),
        );
      case DayStatus.halfDay:
        return const StatusChip(
          label: 'Half Day',
          variant: StatusChipVariant.warning,
          icon: Icon(Icons.timelapse_rounded, size: 14.0),
        );
      case DayStatus.absent:
        return const StatusChip(
          label: 'Absent',
          variant: StatusChipVariant.error,
          icon: Icon(Icons.cancel_rounded, size: 14.0),
        );
      case DayStatus.weeklyOff:
        return const StatusChip(
          label: 'Weekly Off',
          variant: StatusChipVariant.neutral,
          icon: Icon(Icons.weekend_rounded, size: 14.0),
        );
      case DayStatus.holiday:
        return const StatusChip(
          label: 'Holiday',
          variant: StatusChipVariant.neutral,
          icon: Icon(Icons.celebration_rounded, size: 14.0),
        );
      case DayStatus.upcoming:
        return const StatusChip(
          label: 'Upcoming',
          variant: StatusChipVariant.neutral,
        );
    }
  }
}
