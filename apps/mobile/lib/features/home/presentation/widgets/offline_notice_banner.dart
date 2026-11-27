import 'package:flutter/material.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../core/widgets/status_chip.dart';
import '../../../../l10n/app_localizations.dart';

class OfflineNoticeBanner extends StatelessWidget {
  const OfflineNoticeBanner({
    required this.pendingSyncCount,
    super.key,
  });

  final int pendingSyncCount;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final l10n = AppLocalizations.of(context);

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: AppColors.warningContainer,
        borderRadius: AppSpacing.borderRadiusCard,
        border: Border.all(
          color: AppColors.warning.withValues(alpha: 0.3),
          width: 1.0,
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(
            Icons.cloud_off_rounded,
            size: 22.0,
            color: AppColors.warning,
          ),
          const SizedBox(width: AppSpacing.sm + 2),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        l10n?.offlineMode ?? 'Offline Mode',
                        style: theme.textTheme.titleSmall?.copyWith(
                          color: AppColors.warning,
                          fontWeight: FontWeight.w700,
                          fontSize: 14.0,
                        ),
                      ),
                    ),
                    if (pendingSyncCount > 0)
                      StatusChip(
                        label: '$pendingSyncCount ${l10n?.pendingSync ?? "Pending Sync"}',
                        variant: StatusChipVariant.warning,
                        icon: const Icon(
                          Icons.sync_problem_rounded,
                          size: 13.0,
                          color: AppColors.warning,
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 2.0),
                Text(
                  l10n?.offlineModeDesc ??
                      'Punches are stored locally and will sync when network connects.',
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: AppColors.warning,
                    fontSize: 12.0,
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
