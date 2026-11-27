import 'package:flutter/material.dart';
import '../../../../l10n/app_localizations.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../app/theme/app_typography.dart';
import '../../../../core/widgets/avatar_initials.dart';
import '../../../../core/widgets/status_chip.dart';
import '../../../../data/models/employee.dart';

class ProfileHeader extends StatelessWidget {
  const ProfileHeader({
    required this.employee,
    super.key,
  });

  final Employee employee;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final l10n = AppLocalizations.of(context);
    final isSite = employee.employeeType == EmployeeType.site;

    final badgeLabel = isSite
        ? (l10n?.siteEmployee ?? 'Site employee')
        : (l10n?.officeEmployee ?? 'Office employee');

    return Container(
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: AppSpacing.borderRadiusCard,
        border: Border.all(
          color: AppColors.cardBorder,
          width: 1.0,
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          AvatarInitials(
            initials: employee.initials,
            size: 64.0,
            fontSize: 22.0,
            backgroundColor: AppColors.primaryContainer,
            foregroundColor: AppColors.primary,
          ),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  employee.name,
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w700,
                    fontSize: 18.0,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 2.0),
                Text(
                  '${employee.role} · ${employee.code}',
                  style: AppTypography.tabular(
                    fontSize: 13.0,
                    fontWeight: FontWeight.w500,
                    color: AppColors.textMuted,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: AppSpacing.xs + 2),
                StatusChip(
                  label: badgeLabel,
                  icon: Icon(
                    isSite ? Icons.construction : Icons.business,
                    size: 14.0,
                    color: isSite ? AppColors.primary : AppColors.secondary,
                  ),
                  variant: isSite
                      ? StatusChipVariant.info
                      : StatusChipVariant.neutral,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
