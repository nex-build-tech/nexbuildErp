import 'package:flutter/material.dart';
import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_spacing.dart';
import '../../../core/widgets/avatar_initials.dart';
import '../../../core/widgets/geofence_map_placeholder.dart';
import '../../../core/widgets/info_card.dart';
import '../../../core/widgets/key_value_row.dart';
import '../../../core/widgets/primary_button.dart';
import '../../../core/widgets/punch_button.dart';
import '../../../core/widgets/section_header.dart';
import '../../../core/widgets/status_chip.dart';

class WidgetGalleryScreen extends StatefulWidget {
  const WidgetGalleryScreen({super.key});

  @override
  State<WidgetGalleryScreen> createState() => _WidgetGalleryScreenState();
}

class _WidgetGalleryScreenState extends State<WidgetGalleryScreen> {
  bool _isInsideGeofence = true;
  bool _isPrimaryLoading = false;
  bool _isPunchLoading = false;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Widget Gallery'),
        actions: [
          IconButton(
            tooltip: 'Toggle Geofence Inside/Outside',
            icon: Icon(
              _isInsideGeofence ? Icons.near_me : Icons.near_me_disabled,
              color: _isInsideGeofence ? AppColors.success : AppColors.error,
            ),
            onPressed: () {
              setState(() {
                _isInsideGeofence = !_isInsideGeofence;
              });
            },
          ),
        ],
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(AppSpacing.screenHorizontal),
          children: [
            // --- 1. Colors ---
            const SectionHeader(title: 'Color Tokens (Spec)', isUppercase: true),
            const Wrap(
              spacing: AppSpacing.sm,
              runSpacing: AppSpacing.sm,
              children: [
                _ColorChip(label: 'primary\n#17365D', color: AppColors.primary, textColor: Colors.white),
                _ColorChip(label: 'primaryCont.\n#DCE6F4', color: AppColors.primaryContainer, textColor: AppColors.primary),
                _ColorChip(label: 'secondary\n#F5A524', color: AppColors.secondary, textColor: AppColors.onSecondary),
                _ColorChip(label: 'success\n#157F3D', color: AppColors.success, textColor: Colors.white),
                _ColorChip(label: 'successCont.\n#DDF5E5', color: AppColors.successContainer, textColor: AppColors.success),
                _ColorChip(label: 'warning\n#6B4A00', color: AppColors.warning, textColor: Colors.white),
                _ColorChip(label: 'warningCont.\n#FFF4DB', color: AppColors.warningContainer, textColor: AppColors.warning),
                _ColorChip(label: 'error\n#B42318', color: AppColors.error, textColor: Colors.white),
                _ColorChip(label: 'errorCont.\n#FDE7E5', color: AppColors.errorContainer, textColor: AppColors.error),
                _ColorChip(label: 'surface\n#F6F7F9', color: AppColors.surface, textColor: AppColors.text, hasBorder: true),
              ],
            ),
            const SizedBox(height: AppSpacing.xl),

            // --- 2. Typography ---
            const SectionHeader(title: 'Typography Scale (Inter)', isUppercase: true),
            InfoCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('06:18 / 8h 42m', style: theme.textTheme.displaySmall),
                  const Text('displaySmall · 32 / 800 tabular figures', style: TextStyle(color: AppColors.textMuted, fontSize: 11)),
                  const SizedBox(height: AppSpacing.md),
                  Text('Good evening, Ramesh', style: theme.textTheme.titleLarge),
                  const Text('titleLarge · 22 / 700', style: TextStyle(color: AppColors.textMuted, fontSize: 11)),
                  const SizedBox(height: AppSpacing.md),
                  Text('NexBuild Attendance', style: theme.textTheme.titleMedium),
                  const Text('titleMedium · 18 / 600', style: TextStyle(color: AppColors.textMuted, fontSize: 11)),
                  const SizedBox(height: AppSpacing.md),
                  Text('Green Valley – Tower B', style: theme.textTheme.titleSmall),
                  const Text('titleSmall · 15 / 600', style: TextStyle(color: AppColors.textMuted, fontSize: 11)),
                  const SizedBox(height: AppSpacing.md),
                  Text('Real hours. Real shifts. Geofence attendance.', style: theme.textTheme.bodyMedium),
                  const Text('bodyMedium · 14 / 400', style: TextStyle(color: AppColors.textMuted, fontSize: 11)),
                  const SizedBox(height: AppSpacing.md),
                  Text('INSIDE SITE · PRIMARY', style: theme.textTheme.labelMedium),
                  const Text('labelMedium · 12 / 600', style: TextStyle(color: AppColors.textMuted, fontSize: 11)),
                ],
              ),
            ),
            const SizedBox(height: AppSpacing.xl),

            // --- 3. Geofence Map Placeholder ---
            SectionHeader(
              title: 'Geofence Map (CustomPainter)',
              isUppercase: true,
              trailing: TextButton.icon(
                icon: Icon(_isInsideGeofence ? Icons.check_circle : Icons.warning_amber_rounded, size: 16),
                label: Text(_isInsideGeofence ? 'Inside' : 'Outside'),
                onPressed: () => setState(() => _isInsideGeofence = !_isInsideGeofence),
              ),
            ),
            GeofenceMapPlaceholder(
              isInside: _isInsideGeofence,
              radiusMeters: 200,
              distanceMeters: _isInsideGeofence ? 42 : 340,
            ),
            const SizedBox(height: AppSpacing.xl),

            // --- 4. Punch Buttons ---
            const SectionHeader(title: 'Punch Button (Secondary #F5A524)', isUppercase: true),
            PunchButton(
              type: PunchButtonType.punchIn,
              isLoading: _isPunchLoading,
              onPressed: () {
                setState(() => _isPunchLoading = true);
                Future.delayed(const Duration(seconds: 1), () {
                  if (mounted) setState(() => _isPunchLoading = false);
                });
              },
            ),
            const SizedBox(height: AppSpacing.sm),
            PunchButton(
              type: PunchButtonType.punchOut,
              onPressed: () {},
            ),
            const SizedBox(height: AppSpacing.sm),
            const PunchButton(
              type: PunchButtonType.punchIn,
              isLocked: true,
              onPressed: null,
            ),
            const SizedBox(height: AppSpacing.xl),

            // --- 5. Primary Buttons ---
            const SectionHeader(title: 'Primary Button (#17365D)', isUppercase: true),
            PrimaryButton(
              text: 'Send OTP',
              isLoading: _isPrimaryLoading,
              onPressed: () {
                setState(() => _isPrimaryLoading = true);
                Future.delayed(const Duration(seconds: 1), () {
                  if (mounted) setState(() => _isPrimaryLoading = false);
                });
              },
            ),
            const SizedBox(height: AppSpacing.sm),
            PrimaryButton(
              text: 'Done',
              icon: const Icon(Icons.check, size: 20, color: AppColors.onPrimary),
              onPressed: () {},
            ),
            const SizedBox(height: AppSpacing.sm),
            const PrimaryButton(
              text: 'Disabled Button',
              onPressed: null,
            ),
            const SizedBox(height: AppSpacing.xl),

            // --- 6. Status Chips ---
            const SectionHeader(title: 'Status Chips (Color + Icon/Label)', isUppercase: true),
            const Wrap(
              spacing: AppSpacing.sm,
              runSpacing: AppSpacing.sm,
              children: [
                StatusChip(
                  label: 'Inside site',
                  variant: StatusChipVariant.success,
                  icon: Icon(Icons.check, size: 14, color: AppColors.success),
                ),
                StatusChip(
                  label: 'Outside site',
                  variant: StatusChipVariant.error,
                  icon: Icon(Icons.error_outline, size: 14, color: AppColors.error),
                ),
                StatusChip(
                  label: 'Late',
                  variant: StatusChipVariant.warning,
                  icon: Icon(Icons.access_time, size: 14, color: AppColors.warning),
                ),
                StatusChip(
                  label: 'Running',
                  variant: StatusChipVariant.success,
                  isPill: true,
                ),
                StatusChip(
                  label: 'SITE EMPLOYEE',
                  variant: StatusChipVariant.warning,
                  isPill: true,
                ),
                StatusChip(
                  label: 'PRIMARY',
                  variant: StatusChipVariant.success,
                  isPill: true,
                ),
                StatusChip(
                  label: 'Pending sync',
                  variant: StatusChipVariant.neutral,
                  icon: Icon(Icons.sync, size: 14, color: AppColors.textMuted),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.xl),

            // --- 7. InfoCard & KeyValueRow ---
            const SectionHeader(title: 'InfoCard & KeyValueRow', isUppercase: true),
            InfoCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const AvatarInitials(initials: 'RP', size: 36.0),
                      const SizedBox(width: AppSpacing.md),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Selfie verified',
                            style: theme.textTheme.titleSmall,
                          ),
                          Text(
                            'Liveness check passed',
                            style: theme.textTheme.labelMedium?.copyWith(
                              color: AppColors.textMuted,
                            ),
                          ),
                        ],
                      ),
                      const Spacer(),
                      const Icon(Icons.check, color: AppColors.success, size: 22.0),
                    ],
                  ),
                  const SizedBox(height: AppSpacing.md),
                  const KeyValueRow(label: 'Site', value: 'Green Valley – Tower B'),
                  const KeyValueRow(label: 'Distance from centre', value: '42 m of 200 m'),
                  const KeyValueRow(label: 'Worked today so far', value: '6h 18m', showDivider: false),
                ],
              ),
            ),
            const SizedBox(height: AppSpacing.xl),

            // --- 8. Avatar Variations ---
            const SectionHeader(title: 'Avatar Initials', isUppercase: true),
            const Row(
              children: [
                AvatarInitials(initials: 'RP', size: 36.0),
                SizedBox(width: AppSpacing.md),
                AvatarInitials(initials: 'RP', size: 48.0),
                SizedBox(width: AppSpacing.md),
                AvatarInitials(initials: 'RP', size: 60.0),
                SizedBox(width: AppSpacing.md),
                AvatarInitials(initials: 'RP', size: 48.0, isCircle: false),
              ],
            ),
            const SizedBox(height: AppSpacing.xxl),
          ],
        ),
      ),
    );
  }
}

class _ColorChip extends StatelessWidget {
  const _ColorChip({
    required this.label,
    required this.color,
    required this.textColor,
    this.hasBorder = false,
  });

  final String label;
  final Color color;
  final Color textColor;
  final bool hasBorder;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 104.0,
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.sm,
        vertical: AppSpacing.sm,
      ),
      decoration: BoxDecoration(
        color: color,
        borderRadius: AppSpacing.borderRadiusChip,
        border: hasBorder ? Border.all(color: AppColors.cardBorder) : null,
      ),
      child: Text(
        label,
        textAlign: TextAlign.center,
        style: TextStyle(
          color: textColor,
          fontSize: 11.0,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}
