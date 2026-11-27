import 'package:flutter/material.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../app/theme/app_typography.dart';
import '../../../../core/utils/date_formatters.dart';
import '../../../../data/models/punch.dart';
import '../../../../data/models/work_location.dart';
import 'selfie_preview_dialog.dart';

class TimelinePunchItem extends StatelessWidget {
  const TimelinePunchItem({
    required this.punch,
    this.location,
    this.isLastInSession = false,
    this.isFirstInSession = false,
    super.key,
  });

  final Punch punch;
  final WorkLocation? location;
  final bool isLastInSession;
  final bool isFirstInSession;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isPunchIn = punch.punchType == PunchType.punchIn;
    final dotColor = isPunchIn ? AppColors.success : AppColors.error;
    final dotContainer = isPunchIn ? AppColors.successContainer : AppColors.errorContainer;

    final timeStr = DateFormatters.formatTime(punch.timestamp);
    final locName = location?.name ?? 'Site';
    final distanceMeters = punch.distanceFromCenterM.round();

    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // 1. Timeline Column: Dot + Vertical Connecting Line
          SizedBox(
            width: 32.0,
            child: Column(
              children: [
                // Top half line if not first
                Expanded(
                  flex: isFirstInSession ? 0 : 1,
                  child: isFirstInSession
                      ? const SizedBox(height: 12.0)
                      : Container(
                          width: 2.0,
                          color: AppColors.divider,
                        ),
                ),

                // Punch Node Dot
                Container(
                  width: 24.0,
                  height: 24.0,
                  decoration: BoxDecoration(
                    color: dotContainer,
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: dotColor,
                      width: 2.0,
                    ),
                  ),
                  child: Center(
                    child: Container(
                      width: 8.0,
                      height: 8.0,
                      decoration: BoxDecoration(
                        color: dotColor,
                        shape: BoxShape.circle,
                      ),
                    ),
                  ),
                ),

                // Bottom half line if not last
                Expanded(
                  flex: isLastInSession ? 0 : 1,
                  child: isLastInSession
                      ? const SizedBox(height: 12.0)
                      : Container(
                          width: 2.0,
                          color: AppColors.divider,
                        ),
                ),
              ],
            ),
          ),

          const SizedBox(width: AppSpacing.sm),

          // 2. Punch Content Details Card
          Expanded(
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: AppSpacing.xs),
              child: Container(
                padding: const EdgeInsets.all(AppSpacing.md),
                decoration: BoxDecoration(
                  color: AppColors.card,
                  borderRadius: AppSpacing.borderRadiusCard,
                  border: Border.all(color: AppColors.cardBorder),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    // Text details
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Type & Time
                          Wrap(
                            spacing: AppSpacing.sm,
                            runSpacing: 2.0,
                            crossAxisAlignment: WrapCrossAlignment.center,
                            children: [
                              Text(
                                isPunchIn ? 'Punch In' : 'Punch Out',
                                style: theme.textTheme.titleSmall?.copyWith(
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.text,
                                  fontSize: 14.5,
                                ),
                              ),
                              Text(
                                timeStr,
                                style: AppTypography.tabular(
                                  fontSize: 14.5,
                                  fontWeight: FontWeight.w700,
                                  color: dotColor,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 3.0),

                          // Location & Distance
                          Row(
                            children: [
                              const Icon(
                                Icons.location_on_outlined,
                                size: 14.0,
                                color: AppColors.textMuted,
                              ),
                              const SizedBox(width: 3.0),
                              Expanded(
                                child: Text(
                                  '$locName · $distanceMeters m',
                                  style: theme.textTheme.bodyMedium?.copyWith(
                                    color: AppColors.textMuted,
                                    fontSize: 12.0,
                                  ),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ],
                          ),

                          // Note if present
                          if (punch.note != null && punch.note!.isNotEmpty) ...[
                            const SizedBox(height: 4.0),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: AppSpacing.sm,
                                vertical: 2.0,
                              ),
                              decoration: const BoxDecoration(
                                color: AppColors.surface,
                                borderRadius: AppSpacing.borderRadiusPill,
                              ),
                              child: Text(
                                'Note: ${punch.note!}',
                                style: theme.textTheme.labelMedium?.copyWith(
                                  color: AppColors.text,
                                  fontSize: 11.0,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ),
                          ],

                          // Flags: Auto-closed or Pending sync
                          if (punch.isAutoClosed ||
                              punch.syncStatus == SyncStatus.pending) ...[
                            const SizedBox(height: 4.0),
                            Wrap(
                              spacing: AppSpacing.xs,
                              children: [
                                if (punch.isAutoClosed)
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 6.0,
                                      vertical: 2.0,
                                    ),
                                    decoration: BoxDecoration(
                                      color: AppColors.warningContainer,
                                      borderRadius: AppSpacing.borderRadiusPill,
                                      border: Border.all(
                                        color: AppColors.warning.withValues(alpha: 0.3),
                                        width: 0.8,
                                      ),
                                    ),
                                    child: const Text(
                                      'Auto-closed',
                                      style: TextStyle(
                                        fontSize: 10.0,
                                        fontWeight: FontWeight.w700,
                                        color: AppColors.warning,
                                      ),
                                    ),
                                  ),
                                if (punch.syncStatus == SyncStatus.pending)
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 6.0,
                                      vertical: 2.0,
                                    ),
                                    decoration: const BoxDecoration(
                                      color: AppColors.warningContainer,
                                      borderRadius: AppSpacing.borderRadiusPill,
                                    ),
                                    child: const Text(
                                      'Pending sync',
                                      style: TextStyle(
                                        fontSize: 10.0,
                                        fontWeight: FontWeight.w700,
                                        color: AppColors.warning,
                                      ),
                                    ),
                                  ),
                              ],
                            ),
                          ],
                        ],
                      ),
                    ),

                    const SizedBox(width: AppSpacing.sm),

                    // 3. Selfie Thumbnail Preview button
                    GestureDetector(
                      onTap: () {
                        SelfiePreviewDialog.show(
                          context,
                          punch: punch,
                          location: location,
                        );
                      },
                      child: Tooltip(
                        message: 'View selfie details',
                        child: Stack(
                          alignment: Alignment.bottomRight,
                          children: [
                            Container(
                              width: 44.0,
                              height: 44.0,
                              decoration: BoxDecoration(
                                color: const Color(0xFF101928),
                                borderRadius: AppSpacing.borderRadiusInput,
                                border: Border.all(
                                  color: AppColors.secondary.withValues(alpha: 0.6),
                                  width: 1.5,
                                ),
                              ),
                              child: const Center(
                                child: Icon(
                                  Icons.face_rounded,
                                  size: 24.0,
                                  color: Colors.white70,
                                ),
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.all(2.0),
                              decoration: const BoxDecoration(
                                color: AppColors.success,
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(
                                Icons.check,
                                size: 9.0,
                                color: Colors.white,
                              ),
                            ),
                          ],
                        ),
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
