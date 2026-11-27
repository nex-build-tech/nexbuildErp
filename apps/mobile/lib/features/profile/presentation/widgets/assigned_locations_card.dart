import 'package:flutter/material.dart';
import '../../../../l10n/app_localizations.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../app/theme/app_typography.dart';
import '../../../../core/widgets/info_card.dart';
import '../../../../core/widgets/status_chip.dart';
import '../../../../data/models/work_location.dart';

class AssignedLocationsCard extends StatelessWidget {
  const AssignedLocationsCard({
    required this.locations,
    super.key,
  });

  final List<WorkLocation> locations;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final l10n = AppLocalizations.of(context);

    if (locations.isEmpty) {
      return InfoCard(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: AppSpacing.md),
          child: Center(
            child: Text(
              'No assigned locations',
              style: theme.textTheme.bodyMedium?.copyWith(
                color: AppColors.textMuted,
              ),
            ),
          ),
        ),
      );
    }

    return Column(
      children: [
        for (var i = 0; i < locations.length; i++) ...[
          _LocationItemCard(
            location: locations[i],
            primaryLabel: l10n?.primaryLocation ?? 'Primary',
          ),
          if (i < locations.length - 1)
            const SizedBox(height: AppSpacing.sm),
        ],
      ],
    );
  }
}

class _LocationItemCard extends StatelessWidget {
  const _LocationItemCard({
    required this.location,
    required this.primaryLabel,
  });

  final WorkLocation location;
  final String primaryLabel;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isSite = location.locationType == LocationType.site;

    return InfoCard(
      padding: const EdgeInsets.all(AppSpacing.md),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 38.0,
                height: 38.0,
                decoration: BoxDecoration(
                  color: isSite
                      ? AppColors.primaryContainer.withValues(alpha: 0.5)
                      : AppColors.secondaryContainer.withValues(alpha: 0.5),
                  borderRadius: AppSpacing.borderRadiusInput,
                ),
                child: Icon(
                  isSite ? Icons.location_on_outlined : Icons.domain_outlined,
                  size: 20.0,
                  color: isSite ? AppColors.primary : AppColors.secondary,
                ),
              ),
              const SizedBox(width: AppSpacing.sm + 4),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            location.name,
                            style: theme.textTheme.titleSmall?.copyWith(
                              fontWeight: FontWeight.w700,
                              fontSize: 15.0,
                            ),
                          ),
                        ),
                        if (location.isPrimary) ...[
                          const SizedBox(width: AppSpacing.xs),
                          StatusChip(
                            label: primaryLabel,
                            variant: StatusChipVariant.success,
                          ),
                        ],
                      ],
                    ),
                    Wrap(
                      spacing: AppSpacing.sm,
                      runSpacing: AppSpacing.xs,
                      crossAxisAlignment: WrapCrossAlignment.center,
                      children: [
                        Text(
                          location.typeLabel,
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: AppColors.textMuted,
                          ),
                        ),
                        Container(
                          width: 3.0,
                          height: 3.0,
                          decoration: const BoxDecoration(
                            color: AppColors.textMuted,
                            shape: BoxShape.circle,
                          ),
                        ),
                        Text(
                          '${location.radiusMeters.toInt()}m radius',
                          style: AppTypography.tabular(
                            fontSize: 12.0,
                            fontWeight: FontWeight.w600,
                            color: AppColors.primary,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
