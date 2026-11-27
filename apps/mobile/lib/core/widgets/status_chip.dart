import 'package:flutter/material.dart';
import '../../app/theme/app_spacing.dart';
import '../../app/theme/app_theme.dart';

enum StatusChipVariant {
  success,
  warning,
  error,
  info,
  neutral,
}

class StatusChip extends StatelessWidget {
  const StatusChip({
    required this.label,
    super.key,
    this.icon,
    this.variant = StatusChipVariant.info,
    this.isPill = false,
  });

  final String label;
  final Widget? icon;
  final StatusChipVariant variant;
  final bool isPill;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final statusColors = context.statusColors;

    final (Color bgColor, Color fgColor) = switch (variant) {
      StatusChipVariant.success => (
          statusColors.successContainer,
          statusColors.onSuccessContainer,
        ),
      StatusChipVariant.warning => (
          statusColors.warningContainer,
          statusColors.onWarningContainer,
        ),
      StatusChipVariant.error => (
          theme.colorScheme.errorContainer,
          theme.colorScheme.onErrorContainer,
        ),
      StatusChipVariant.info => (
          theme.colorScheme.primaryContainer,
          theme.colorScheme.onPrimaryContainer,
        ),
      StatusChipVariant.neutral => (
          theme.colorScheme.outlineVariant.withValues(alpha: 0.5),
          theme.colorScheme.onSurface.withValues(alpha: 0.7),
        ),
    };

    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.sm + 2,
        vertical: AppSpacing.xs + 1,
      ),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: isPill
            ? AppSpacing.borderRadiusPill
            : AppSpacing.borderRadiusChip,
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            icon!,
            const SizedBox(width: AppSpacing.xs),
          ],
          Flexible(
            child: Text(
              label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: theme.textTheme.labelMedium?.copyWith(
                color: fgColor,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
