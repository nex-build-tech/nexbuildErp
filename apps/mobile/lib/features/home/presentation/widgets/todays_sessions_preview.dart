import 'package:flutter/material.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../app/theme/app_typography.dart';
import '../../../../core/utils/date_formatters.dart';
import '../../../../core/widgets/info_card.dart';
import '../../../../core/widgets/section_header.dart';
import '../../../../core/widgets/status_chip.dart';
import '../../../../data/models/work_session.dart';

class TodaysSessionsPreview extends StatelessWidget {
  const TodaysSessionsPreview({
    required this.sessions,
    required this.onViewAll,
    super.key,
  });

  final List<WorkSession> sessions;
  final VoidCallback onViewAll;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    // Show last 2 sessions
    final previewSessions = sessions.length > 2
        ? sessions.sublist(sessions.length - 2)
        : sessions;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SectionHeader(
          title: "Today's sessions",
          actionLabel: 'View all',
          onActionTap: onViewAll,
        ),
        const SizedBox(height: AppSpacing.xs),

        if (previewSessions.isEmpty)
          InfoCard(
            padding: const EdgeInsets.all(AppSpacing.md),
            child: Center(
              child: Text(
                'No sessions recorded yet today.',
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: AppColors.textMuted,
                ),
              ),
            ),
          )
        else
          ...previewSessions.reversed.map((session) {
            final inTimeStr = DateFormatters.formatTime(session.inTime);

            if (session.isRunning) {
              return Padding(
                padding: const EdgeInsets.only(bottom: AppSpacing.sm),
                child: InfoCard(
                  padding: const EdgeInsets.symmetric(
                    horizontal: AppSpacing.lg,
                    vertical: AppSpacing.md,
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          Container(
                            width: 8.0,
                            height: 8.0,
                            decoration: const BoxDecoration(
                              color: AppColors.success,
                              shape: BoxShape.circle,
                            ),
                          ),
                          const SizedBox(width: AppSpacing.sm),
                          Text(
                            'In · $inTimeStr',
                            style: AppTypography.tabular(
                              fontSize: 14.0,
                              fontWeight: FontWeight.w600,
                              color: AppColors.text,
                            ),
                          ),
                        ],
                      ),
                      const StatusChip(
                        label: 'Running',
                        variant: StatusChipVariant.success,
                        isPill: true,
                      ),
                    ],
                  ),
                ),
              );
            }

            final outTimeStr = session.outTime != null
                ? DateFormatters.formatTime(session.outTime!)
                : '--:--';
            final durationStr = DateFormatters.formatDuration(session.duration);

            return Padding(
              padding: const EdgeInsets.only(bottom: AppSpacing.sm),
              child: InfoCard(
                padding: const EdgeInsets.symmetric(
                  horizontal: AppSpacing.lg,
                  vertical: AppSpacing.md,
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      '$inTimeStr → $outTimeStr',
                      style: AppTypography.tabular(
                        fontSize: 14.0,
                        fontWeight: FontWeight.w600,
                        color: AppColors.text,
                      ),
                    ),
                    Text(
                      durationStr,
                      style: AppTypography.tabular(
                        fontSize: 14.0,
                        fontWeight: FontWeight.w700,
                        color: AppColors.primary,
                      ),
                    ),
                  ],
                ),
              ),
            );
          }),
      ],
    );
  }
}
