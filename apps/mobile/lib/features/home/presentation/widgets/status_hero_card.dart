import 'package:flutter/material.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../app/theme/app_typography.dart';
import '../../../../core/utils/date_formatters.dart';
import '../../../../core/widgets/punch_button.dart';
import '../../../../data/models/punch.dart';

class StatusHeroCard extends StatelessWidget {
  const StatusHeroCard({
    required this.isPunchedIn,
    required this.isInsideGeofence,
    required this.workedToday,
    required this.lastPunch,
    required this.onPunchPressed,
    this.isLoading = false,
    this.isMockLocationDetected = false,
    super.key,
  });

  final bool isPunchedIn;
  final bool isInsideGeofence;
  final Duration workedToday;
  final Punch? lastPunch;
  final VoidCallback onPunchPressed;
  final bool isLoading;
  final bool isMockLocationDetected;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    // Format last punch info
    String lastPunchText = 'No punches yet today';
    if (lastPunch != null) {
      final timeStr = DateFormatters.formatTime(lastPunch!.timestamp);
      lastPunchText = lastPunch!.punchType == PunchType.punchIn
          ? 'Last in $timeStr'
          : 'Last out $timeStr';
    }

    final workedFormatted = DateFormatters.formatDuration(workedToday);

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: AppColors.primary,
        borderRadius: AppSpacing.borderRadiusHeroCard,
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withValues(alpha: 0.25),
            blurRadius: 16.0,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Top Row: Status and Worked Today
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Left Column: Current Status
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'CURRENT STATUS',
                      style: theme.textTheme.labelMedium?.copyWith(
                        color: AppColors.primaryContainer.withValues(alpha: 0.8),
                        fontWeight: FontWeight.w700,
                        letterSpacing: 0.8,
                      ),
                    ),
                    const SizedBox(height: AppSpacing.xs),
                    Text(
                      isPunchedIn ? 'Punched in' : 'Punched out',
                      style: theme.textTheme.titleLarge?.copyWith(
                        color: AppColors.onPrimary,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(height: 2.0),
                    Text(
                      lastPunchText,
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: AppColors.primaryContainer.withValues(alpha: 0.75),
                        fontSize: 13.0,
                      ),
                    ),
                  ],
                ),
              ),

              // Right Column: Worked Today
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    'WORKED TODAY',
                    style: theme.textTheme.labelMedium?.copyWith(
                      color: AppColors.primaryContainer.withValues(alpha: 0.8),
                      fontWeight: FontWeight.w700,
                      letterSpacing: 0.8,
                    ),
                  ),
                  const SizedBox(height: AppSpacing.xs),
                  Text(
                    workedFormatted,
                    style: AppTypography.tabular(
                      fontSize: 26.0,
                      fontWeight: FontWeight.w800,
                      color: AppColors.onPrimary,
                    ),
                  ),
                ],
              ),
            ],
          ),

          const SizedBox(height: AppSpacing.lg),

          // Punch Button
          PunchButton(
            type: isPunchedIn
                ? PunchButtonType.punchOut
                : PunchButtonType.punchIn,
            isLocked: !isInsideGeofence || isMockLocationDetected,
            customLabel: isMockLocationDetected ? 'Mock Location Blocked' : null,
            isLoading: isLoading,
            onPressed: (isInsideGeofence && !isMockLocationDetected)
                ? onPunchPressed
                : null,
          ),
        ],
      ),
    );
  }
}
