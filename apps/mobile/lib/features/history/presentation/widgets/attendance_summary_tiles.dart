import 'package:flutter/material.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../app/theme/app_typography.dart';

class AttendanceSummaryTiles extends StatelessWidget {
  const AttendanceSummaryTiles({
    required this.presentCount,
    required this.lateCount,
    required this.halfDayCount,
    required this.absentCount,
    super.key,
  });

  final int presentCount;
  final int lateCount;
  final int halfDayCount;
  final int absentCount;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        // 1. Present
        Expanded(
          child: _SummaryTile(
            label: 'Present',
            count: presentCount,
            icon: Icons.check_circle_rounded,
            color: AppColors.success,
            containerColor: AppColors.successContainer,
          ),
        ),
        const SizedBox(width: AppSpacing.sm),

        // 2. Late
        Expanded(
          child: _SummaryTile(
            label: 'Late',
            count: lateCount,
            icon: Icons.warning_amber_rounded,
            color: AppColors.warning,
            containerColor: AppColors.warningContainer,
          ),
        ),
        const SizedBox(width: AppSpacing.sm),

        // 3. Half Day
        Expanded(
          child: _SummaryTile(
            label: 'Half Day',
            count: halfDayCount,
            icon: Icons.timelapse_rounded,
            color: AppColors.secondary,
            containerColor: AppColors.warningContainer.withValues(alpha: 0.5),
          ),
        ),
        const SizedBox(width: AppSpacing.sm),

        // 4. Absent
        Expanded(
          child: _SummaryTile(
            label: 'Absent',
            count: absentCount,
            icon: Icons.cancel_rounded,
            color: AppColors.error,
            containerColor: AppColors.errorContainer,
          ),
        ),
      ],
    );
  }
}

class _SummaryTile extends StatelessWidget {
  const _SummaryTile({
    required this.label,
    required this.count,
    required this.icon,
    required this.color,
    required this.containerColor,
  });

  final String label;
  final int count;
  final IconData icon;
  final Color color;
  final Color containerColor;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.sm,
        vertical: AppSpacing.md,
      ),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: AppSpacing.borderRadiusCard,
        border: Border.all(color: AppColors.cardBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(6.0),
            decoration: BoxDecoration(
              color: containerColor,
              shape: BoxShape.circle,
            ),
            child: Icon(
              icon,
              size: 16.0,
              color: color,
            ),
          ),
          const SizedBox(height: AppSpacing.xs + 2),
          Text(
            '$count',
            style: AppTypography.tabular(
              fontSize: 20.0,
              fontWeight: FontWeight.w800,
              color: AppColors.text,
            ),
          ),
          const SizedBox(height: 2.0),
          Text(
            label,
            style: theme.textTheme.labelMedium?.copyWith(
              color: AppColors.textMuted,
              fontWeight: FontWeight.w600,
              fontSize: 11.0,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
}
