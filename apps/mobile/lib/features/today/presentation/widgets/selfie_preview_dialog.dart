import 'package:flutter/material.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../app/theme/app_typography.dart';
import '../../../../core/utils/date_formatters.dart';
import '../../../../core/widgets/key_value_row.dart';
import '../../../../core/widgets/primary_button.dart';
import '../../../../data/models/punch.dart';
import '../../../../data/models/work_location.dart';

class SelfiePreviewDialog extends StatelessWidget {
  const SelfiePreviewDialog({
    required this.punch,
    this.location,
    super.key,
  });

  final Punch punch;
  final WorkLocation? location;

  static Future<void> show(
    BuildContext context, {
    required Punch punch,
    WorkLocation? location,
  }) {
    return showDialog<void>(
      context: context,
      builder: (context) => SelfiePreviewDialog(
        punch: punch,
        location: location,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isPunchIn = punch.punchType == PunchType.punchIn;
    final timeStr = DateFormatters.formatTime(punch.timestamp);
    final dateStr = DateFormatters.formatDate(punch.timestamp);

    return Dialog(
      backgroundColor: AppColors.card,
      shape: const RoundedRectangleBorder(
        borderRadius: AppSpacing.borderRadiusCard,
      ),
      insetPadding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.lg,
        vertical: AppSpacing.xl,
      ),
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            // 1. Header Row
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Container(
                      width: 10.0,
                      height: 10.0,
                      decoration: BoxDecoration(
                        color: isPunchIn ? AppColors.success : AppColors.error,
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: AppSpacing.xs),
                    Text(
                      isPunchIn ? 'Punch In Selfie' : 'Punch Out Selfie',
                      style: theme.textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
                IconButton(
                  icon: const Icon(Icons.close_rounded, size: 20.0),
                  onPressed: () => Navigator.of(context).pop(),
                  tooltip: 'Close',
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(),
                ),
              ],
            ),

            const SizedBox(height: AppSpacing.md),

            // 2. Selfie Thumbnail Graphic Preview with Oval boundary
            Container(
              width: double.infinity,
              height: 200.0,
              decoration: BoxDecoration(
                color: const Color(0xFF101928),
                borderRadius: AppSpacing.borderRadiusInput,
                border: Border.all(
                  color: AppColors.secondary.withValues(alpha: 0.8),
                  width: 2.0,
                ),
              ),
              child: Stack(
                alignment: Alignment.center,
                children: [
                  // Stylized face icon & background grid
                  Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(
                        width: 72.0,
                        height: 72.0,
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.12),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          Icons.face_rounded,
                          size: 48.0,
                          color: Colors.white70,
                        ),
                      ),
                      const SizedBox(height: AppSpacing.sm),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: AppSpacing.sm,
                          vertical: 2.0,
                        ),
                        decoration: BoxDecoration(
                          color: AppColors.success.withValues(alpha: 0.2),
                          borderRadius: AppSpacing.borderRadiusPill,
                          border: Border.all(
                            color: AppColors.success,
                            width: 0.8,
                          ),
                        ),
                        child: const FittedBox(
                          fit: BoxFit.scaleDown,
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                Icons.verified_rounded,
                                size: 12.0,
                                color: AppColors.success,
                              ),
                              SizedBox(width: 4.0),
                              Text(
                                'Verified · 98.4%',
                                style: TextStyle(
                                  fontSize: 10.0,
                                  fontWeight: FontWeight.w700,
                                  color: Color(0xFF4ADE80),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),

                  // Top badge: Live photo
                  Positioned(
                    top: 8.0,
                    right: 8.0,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 6.0,
                        vertical: 2.0,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.black.withValues(alpha: 0.6),
                        borderRadius: AppSpacing.borderRadiusPill,
                      ),
                      child: const Text(
                        'LIVE',
                        style: TextStyle(
                          fontSize: 9.0,
                          fontWeight: FontWeight.w800,
                          color: Colors.white,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: AppSpacing.md),

            // 3. Time & Date
            Text(
              timeStr,
              style: AppTypography.tabular(
                fontSize: 22.0,
                fontWeight: FontWeight.w800,
                color: AppColors.primary,
              ),
            ),
            Text(
              dateStr,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: AppColors.textMuted,
                fontSize: 12.0,
              ),
            ),

            const SizedBox(height: AppSpacing.sm),
            const Divider(color: AppColors.divider),
            const SizedBox(height: AppSpacing.xs),

            // 4. Details List
            KeyValueRow(
              label: 'Location',
              value: location?.name ?? 'Site',
            ),
            KeyValueRow(
              label: 'Distance',
              value: '${punch.distanceFromCenterM.round()} m from centre',
            ),
            KeyValueRow(
              label: 'GPS',
              value: '${punch.latitude.toStringAsFixed(4)}° N, ${punch.longitude.toStringAsFixed(4)}° E',
            ),
            if (punch.note != null)
              KeyValueRow(
                label: 'Note',
                value: punch.note!,
              ),
            const KeyValueRow(
              label: 'Liveness Confidence',
              value: '98.4% (Passed)',
              showDivider: false,
            ),

            const SizedBox(height: AppSpacing.md),

            // 5. Done button
            PrimaryButton(
              text: 'Close',
              height: 44.0,
              onPressed: () => Navigator.of(context).pop(),
            ),
          ],
        ),
      ),
    );
  }
}
