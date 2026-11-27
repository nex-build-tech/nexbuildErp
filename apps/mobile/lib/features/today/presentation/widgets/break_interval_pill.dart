import 'package:flutter/material.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../app/theme/app_typography.dart';
import '../../../../core/utils/date_formatters.dart';

class BreakIntervalPill extends StatelessWidget {
  const BreakIntervalPill({
    required this.duration,
    super.key,
  });

  final Duration duration;

  @override
  Widget build(BuildContext context) {
    final formatted = DateFormatters.formatDuration(duration);

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4.0),
      child: Row(
        children: [
          // Timeline column aligned line
          SizedBox(
            width: 32.0,
            height: 36.0,
            child: Center(
              child: Container(
                width: 2.0,
                color: AppColors.divider,
              ),
            ),
          ),
          const SizedBox(width: AppSpacing.sm),

          // Centered break interval pill
          Container(
            padding: const EdgeInsets.symmetric(
              horizontal: AppSpacing.md,
              vertical: 6.0,
            ),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: AppSpacing.borderRadiusPill,
              border: Border.all(
                color: AppColors.divider,
                width: 1.0,
              ),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(
                  Icons.coffee_rounded,
                  size: 14.0,
                  color: AppColors.textMuted,
                ),
                const SizedBox(width: AppSpacing.xs),
                Text(
                  '$formatted break',
                  style: AppTypography.tabular(
                    fontSize: 12.0,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textMuted,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
