import 'package:flutter/material.dart';
import '../../app/theme/app_colors.dart';
import '../../app/theme/app_spacing.dart';
import '../../app/theme/app_typography.dart';

class KeyValueRow extends StatelessWidget {
  const KeyValueRow({
    required this.label,
    super.key,
    this.value,
    this.valueWidget,
    this.showDivider = true,
    this.isBoldValue = true,
  }) : assert(
          value != null || valueWidget != null,
          'Either value or valueWidget must be provided',
        );

  final String label;
  final String? value;
  final Widget? valueWidget;
  final bool showDivider;
  final bool isBoldValue;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(vertical: AppSpacing.md),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Expanded(
                flex: 2,
                child: Text(
                  label,
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: AppColors.textMuted,
                  ),
                ),
              ),
              const SizedBox(width: AppSpacing.sm),
              Expanded(
                flex: 3,
                child: Align(
                  alignment: Alignment.centerRight,
                  child: valueWidget ??
                      Text(
                        value!,
                        textAlign: TextAlign.end,
                        style: AppTypography.tabular(
                          fontSize: 14.0,
                          fontWeight:
                              isBoldValue ? FontWeight.w700 : FontWeight.w500,
                          color: AppColors.text,
                        ),
                      ),
                ),
              ),
            ],
          ),
        ),
        if (showDivider)
          const Divider(
            height: 1.0,
            thickness: 1.0,
            color: AppColors.divider,
          ),
      ],
    );
  }
}
