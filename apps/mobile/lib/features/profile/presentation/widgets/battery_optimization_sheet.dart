import 'package:flutter/material.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../l10n/app_localizations.dart';

class BatteryOptimizationSheet extends StatelessWidget {
  const BatteryOptimizationSheet({super.key});

  static Future<void> show(BuildContext context) {
    return showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(
          top: Radius.circular(AppSpacing.radiusCard),
        ),
      ),
      builder: (_) => const BatteryOptimizationSheet(),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final l10n = AppLocalizations.of(context);

    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.screenHorizontal),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 36.0,
                height: 4.0,
                decoration: const BoxDecoration(
                  color: AppColors.divider,
                  borderRadius: AppSpacing.borderRadiusPill,
                ),
              ),
            ),
            const SizedBox(height: AppSpacing.md),
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(AppSpacing.xs + 2),
                  decoration: const BoxDecoration(
                    color: AppColors.primaryContainer,
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.battery_charging_full_rounded,
                    size: 20.0,
                    color: AppColors.primary,
                  ),
                ),
                const SizedBox(width: AppSpacing.sm),
                Expanded(
                  child: Text(
                    l10n?.batteryGuideHeading ?? 'Keep TrueShift Unrestricted',
                    style: theme.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.sm),
            Text(
              'Aggressive Android battery savers can pause GPS and background punch sync. Follow these steps for your phone:',
              style: theme.textTheme.bodyMedium?.copyWith(
                color: AppColors.textMuted,
              ),
            ),
            const SizedBox(height: AppSpacing.md),
            const _DeviceStepTile(
              brand: 'Samsung Galaxy (M / F / A Series)',
              steps: 'Settings → Apps → TrueShift → Battery → Select "Unrestricted".',
            ),
            const SizedBox(height: AppSpacing.sm),
            const _DeviceStepTile(
              brand: 'Xiaomi / Redmi / POCO (MIUI / HyperOS)',
              steps: 'Settings → Apps → TrueShift → Battery Saver → "No restrictions" & enable "Autostart".',
            ),
            const SizedBox(height: AppSpacing.sm),
            const _DeviceStepTile(
              brand: 'Vivo / Oppo / Realme',
              steps: 'Settings → Battery → Background power consumption → Allow TrueShift to run in background.',
            ),
            const SizedBox(height: AppSpacing.lg),
            SizedBox(
              width: double.infinity,
              height: AppSpacing.primaryButtonHeight,
              child: FilledButton(
                onPressed: () => Navigator.of(context).pop(),
                style: FilledButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: AppColors.onPrimary,
                  shape: const RoundedRectangleBorder(
                    borderRadius: AppSpacing.borderRadiusInput,
                  ),
                ),
                child: Text(
                  l10n?.understood ?? 'Understood',
                  style: theme.textTheme.titleSmall?.copyWith(
                    color: AppColors.onPrimary,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ),
            const SizedBox(height: AppSpacing.sm),
          ],
        ),
      ),
    );
  }
}

class _DeviceStepTile extends StatelessWidget {
  const _DeviceStepTile({
    required this.brand,
    required this.steps,
  });

  final String brand;
  final String steps;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: AppSpacing.borderRadiusCard,
        border: Border.all(color: AppColors.cardBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(
                Icons.phone_android_rounded,
                size: 16.0,
                color: AppColors.primary,
              ),
              const SizedBox(width: AppSpacing.xs),
              Expanded(
                child: Text(
                  brand,
                  style: theme.textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.w700,
                    fontSize: 13.0,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.xs),
          Text(
            steps,
            style: theme.textTheme.bodySmall?.copyWith(
              color: AppColors.text,
              fontSize: 12.0,
            ),
          ),
        ],
      ),
    );
  }
}
