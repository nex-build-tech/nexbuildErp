import 'package:flutter/material.dart';
import '../../../../l10n/app_localizations.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../core/widgets/info_card.dart';
import '../../../../core/widgets/key_value_row.dart';
import '../../../../data/models/employee.dart';

class EmploymentInfoCard extends StatelessWidget {
  const EmploymentInfoCard({
    required this.employee,
    super.key,
  });

  final Employee employee;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final l10n = AppLocalizations.of(context);

    return InfoCard(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
      child: Column(
        children: [
          KeyValueRow(
            label: l10n?.shiftTiming ?? 'Shift Timing',
            value: '${employee.shiftStart} – ${employee.shiftEnd}',
          ),
          KeyValueRow(
            label: l10n?.reportingManager ?? 'Reporting Manager',
            value: employee.reportingManager,
          ),
          KeyValueRow(
            label: l10n?.registeredPhone ?? 'Registered Phone',
            value: '+91 ${employee.phone}',
          ),
          KeyValueRow(
            label: l10n?.deviceBinding ?? 'Device Binding',
            showDivider: false,
            valueWidget: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(
                  Icons.check_circle_rounded,
                  size: 16.0,
                  color: AppColors.success,
                ),
                const SizedBox(width: AppSpacing.xs),
                Flexible(
                  child: Text(
                    l10n?.boundDevice ?? 'Bound to this device (Samsung Galaxy M34)',
                    textAlign: TextAlign.end,
                    style: theme.textTheme.bodyMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                      color: AppColors.text,
                      fontSize: 13.0,
                    ),
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
