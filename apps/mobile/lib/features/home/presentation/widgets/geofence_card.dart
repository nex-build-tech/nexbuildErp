import 'package:flutter/material.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../core/widgets/geofence_map_placeholder.dart';
import '../../../../core/widgets/info_card.dart';
import '../../../../core/widgets/status_chip.dart';
import '../../../../data/models/work_location.dart';

class GeofenceCard extends StatelessWidget {
  const GeofenceCard({
    required this.selectedLocation,
    required this.allLocations,
    required this.isInside,
    required this.distanceMeters,
    required this.onLocationChanged,
    super.key,
  });

  final WorkLocation selectedLocation;
  final List<WorkLocation> allLocations;
  final bool isInside;
  final int distanceMeters;
  final ValueChanged<WorkLocation> onLocationChanged;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isSite = selectedLocation.locationType == LocationType.site;

    return InfoCard(
      padding: EdgeInsets.zero,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // CustomPainter Geofence Map
          GeofenceMapPlaceholder(
            isInside: isInside,
            radiusMeters: selectedLocation.radiusMeters.round(),
            distanceMeters: distanceMeters,
            height: 195.0,
          ),

          // Site Details Bar
          Padding(
            padding: const EdgeInsets.all(AppSpacing.md),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Location Name with optional multi-site selector
                      if (allLocations.length > 1)
                        InkWell(
                          onTap: () => _showLocationSelector(context),
                          borderRadius: AppSpacing.borderRadiusChip,
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Flexible(
                                child: Text(
                                  selectedLocation.name,
                                  style: theme.textTheme.titleSmall?.copyWith(
                                    fontWeight: FontWeight.w700,
                                    color: AppColors.text,
                                  ),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                              const SizedBox(width: AppSpacing.xs),
                              const Icon(
                                Icons.keyboard_arrow_down_rounded,
                                size: 18.0,
                                color: AppColors.primary,
                              ),
                            ],
                          ),
                        )
                      else
                        Text(
                          selectedLocation.name,
                          style: theme.textTheme.titleSmall?.copyWith(
                            fontWeight: FontWeight.w700,
                            color: AppColors.text,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      const SizedBox(height: 2.0),
                      Text(
                        '${isSite ? "Assigned site" : "Assigned office"} · $distanceMeters m from centre',
                        style: theme.textTheme.bodyMedium?.copyWith(
                          fontSize: 12.0,
                          color: AppColors.textMuted,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: AppSpacing.sm),

                // Status Chip (Paired color + icon/label)
                StatusChip(
                  label: isInside
                      ? (isSite ? 'Inside site' : 'Inside office')
                      : (isSite ? 'Outside site' : 'Outside office'),
                  variant: isInside
                      ? StatusChipVariant.success
                      : StatusChipVariant.error,
                  icon: Icon(
                    isInside ? Icons.check : Icons.error_outline_rounded,
                    size: 14.0,
                    color: isInside ? AppColors.success : AppColors.error,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  void _showLocationSelector(BuildContext context) {
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: AppColors.card,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(
          top: Radius.circular(AppSpacing.radiusHeroCard),
        ),
      ),
      builder: (context) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(
              horizontal: AppSpacing.screenHorizontal,
              vertical: AppSpacing.md,
            ),
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
                Text(
                  'Select Assigned Location',
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                ),
                const SizedBox(height: AppSpacing.sm),
                ...allLocations.map((loc) {
                  final isSelected = loc.id == selectedLocation.id;
                  return ListTile(
                    contentPadding: EdgeInsets.zero,
                    leading: Icon(
                      loc.locationType == LocationType.site
                          ? Icons.apartment_rounded
                          : Icons.business_rounded,
                      color: isSelected ? AppColors.primary : AppColors.textMuted,
                    ),
                    title: Text(
                      loc.name,
                      style: TextStyle(
                        fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                        color: isSelected ? AppColors.primary : AppColors.text,
                      ),
                    ),
                    subtitle: Text('${loc.typeLabel} · Radius ${loc.radiusMeters.round()} m'),
                    trailing: isSelected
                        ? const Icon(Icons.check_circle, color: AppColors.primary)
                        : null,
                    onTap: () {
                      Navigator.of(context).pop();
                      onLocationChanged(loc);
                    },
                  );
                }),
              ],
            ),
          ),
        );
      },
    );
  }
}
