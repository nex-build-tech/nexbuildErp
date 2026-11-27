import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../l10n/app_localizations.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../app/theme/app_typography.dart';
import '../../../../core/widgets/info_card.dart';
import '../../providers/profile_provider.dart';
import 'battery_optimization_sheet.dart';

class SettingsCard extends ConsumerWidget {
  const SettingsCard({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final l10n = AppLocalizations.of(context);
    final settings = ref.watch(settingsProvider);

    return InfoCard(
      padding: const EdgeInsets.all(AppSpacing.lg),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // --- Language Section ---
          Text(
            l10n?.appLanguage ?? 'Language',
            style: theme.textTheme.titleSmall?.copyWith(
              fontWeight: FontWeight.w700,
              fontSize: 14.0,
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
          SizedBox(
            width: double.infinity,
            child: SegmentedButton<String>(
              segments: const [
                ButtonSegment<String>(
                  value: 'en',
                  label: Text('English'),
                ),
                ButtonSegment<String>(
                  value: 'mr',
                  label: Text('मराठी'),
                ),
                ButtonSegment<String>(
                  value: 'hi',
                  label: Text('हिंदी'),
                ),
              ],
              selected: {settings.locale.languageCode},
              onSelectionChanged: (Set<String> newSelection) {
                if (newSelection.isNotEmpty) {
                  ref
                      .read(settingsProvider.notifier)
                      .setLocale(Locale(newSelection.first));
                }
              },
              style: SegmentedButton.styleFrom(
                selectedBackgroundColor: AppColors.primaryContainer,
                selectedForegroundColor: AppColors.primary,
                foregroundColor: AppColors.text,
                textStyle: theme.textTheme.labelMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
                shape: const RoundedRectangleBorder(
                  borderRadius: AppSpacing.borderRadiusInput,
                ),
              ),
            ),
          ),

          const Padding(
            padding: EdgeInsets.symmetric(vertical: AppSpacing.md),
            child: Divider(
              height: 1.0,
              thickness: 1.0,
              color: AppColors.divider,
            ),
          ),

          // --- Punch-out Reminder Section ---
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      l10n?.punchOutReminder ?? 'Punch-out Reminder',
                      style: theme.textTheme.bodyMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                        color: AppColors.text,
                      ),
                    ),
                    const SizedBox(height: 2.0),
                    Text(
                      'Daily alert before shift end',
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: AppColors.textMuted,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: AppSpacing.sm),
              Material(
                color: Colors.transparent,
                child: InkWell(
                  onTap: () async {
                    final picked = await showTimePicker(
                      context: context,
                      initialTime: settings.punchOutReminder,
                    );
                    if (picked != null) {
                      ref
                          .read(settingsProvider.notifier)
                          .setPunchOutReminder(picked);
                    }
                  },
                  borderRadius: AppSpacing.borderRadiusChip,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: AppSpacing.md,
                      vertical: AppSpacing.xs + 2,
                    ),
                    decoration: BoxDecoration(
                      color: AppColors.primaryContainer.withValues(alpha: 0.6),
                      borderRadius: AppSpacing.borderRadiusChip,
                      border: Border.all(
                        color: AppColors.primary.withValues(alpha: 0.3),
                        width: 1.0,
                      ),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(
                          Icons.access_time_rounded,
                          size: 16.0,
                          color: AppColors.primary,
                        ),
                        const SizedBox(width: AppSpacing.xs),
                        Text(
                          settings.punchOutReminder.format(context),
                          style: AppTypography.tabular(
                            fontSize: 13.0,
                            fontWeight: FontWeight.w700,
                            color: AppColors.primary,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),

          const Padding(
            padding: EdgeInsets.symmetric(vertical: AppSpacing.md),
            child: Divider(
              height: 1.0,
              thickness: 1.0,
              color: AppColors.divider,
            ),
          ),

          // --- Battery Optimization Guidance ---
          InkWell(
            onTap: () => BatteryOptimizationSheet.show(context),
            borderRadius: AppSpacing.borderRadiusCard,
            child: Row(
              children: [
                Container(
                  width: 36.0,
                  height: 36.0,
                  decoration: BoxDecoration(
                    color: AppColors.primaryContainer.withValues(alpha: 0.6),
                    borderRadius: AppSpacing.borderRadiusInput,
                  ),
                  child: const Icon(
                    Icons.battery_saver_rounded,
                    size: 20.0,
                    color: AppColors.primary,
                  ),
                ),
                const SizedBox(width: AppSpacing.md),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        l10n?.batteryGuideTitle ?? 'Battery Optimization Guide',
                        style: theme.textTheme.bodyMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                          color: AppColors.text,
                        ),
                      ),
                      const SizedBox(height: 2.0),
                      Text(
                        l10n?.batteryGuideSubtitle ??
                            'Prevent GPS sleep and background kill on construction devices',
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: AppColors.textMuted,
                          fontSize: 12.0,
                        ),
                      ),
                    ],
                  ),
                ),
                const Icon(
                  Icons.chevron_right_rounded,
                  size: 20.0,
                  color: AppColors.textMuted,
                ),
              ],
            ),
          ),

          const Padding(
            padding: EdgeInsets.symmetric(vertical: AppSpacing.md),
            child: Divider(
              height: 1.0,
              thickness: 1.0,
              color: AppColors.divider,
            ),
          ),

          // --- App Version Info ---
          Center(
            child: Text(
              'TrueShift v1.0.0 (Build 1) · Production',
              style: AppTypography.tabular(
                fontSize: 12.0,
                fontWeight: FontWeight.w500,
                color: AppColors.textMuted,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
