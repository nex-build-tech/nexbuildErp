import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../app/theme/app_spacing.dart';

enum PunchButtonType {
  punchIn,
  punchOut,
}

class PunchButton extends StatelessWidget {
  const PunchButton({
    required this.onPressed,
    super.key,
    this.type = PunchButtonType.punchIn,
    this.isLocked = false,
    this.isLoading = false,
    this.customLabel,
  });

  final VoidCallback? onPressed;
  final PunchButtonType type;
  final bool isLocked;
  final bool isLoading;
  final String? customLabel;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    if (isLocked) {
      return SizedBox(
        height: AppSpacing.punchButtonHeight,
        width: double.infinity,
        child: Container(
          decoration: BoxDecoration(
            color: theme.colorScheme.outlineVariant.withValues(alpha: 0.6),
            borderRadius: AppSpacing.borderRadiusCard,
          ),
          alignment: Alignment.center,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                Icons.lock_outline_rounded,
                size: 20.0,
                color: theme.colorScheme.onSurface.withValues(alpha: 0.5),
              ),
              const SizedBox(width: AppSpacing.sm),
              Flexible(
                child: Text(
                  customLabel ??
                      (type == PunchButtonType.punchIn
                          ? 'Punch In locked'
                          : 'Punch Out locked'),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: theme.textTheme.titleMedium?.copyWith(
                    color: theme.colorScheme.onSurface.withValues(alpha: 0.5),
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ],
          ),
        ),
      );
    }

    final label = customLabel ??
        (type == PunchButtonType.punchIn
            ? 'Punch In with selfie'
            : 'Punch Out with selfie');

    return Semantics(
      button: true,
      label: label,
      child: SizedBox(
        height: AppSpacing.punchButtonHeight,
        width: double.infinity,
        child: FilledButton(
          onPressed: isLoading
              ? null
              : () {
                  HapticFeedback.mediumImpact();
                  onPressed?.call();
                },
        style: FilledButton.styleFrom(
          backgroundColor: theme.colorScheme.secondary,
          foregroundColor: theme.colorScheme.onSecondary,
          disabledBackgroundColor: theme.colorScheme.secondary.withValues(alpha: 0.5),
          shape: const RoundedRectangleBorder(
            borderRadius: AppSpacing.borderRadiusCard,
          ),
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
        ),
        child: isLoading
            ? SizedBox(
                height: 24.0,
                width: 24.0,
                child: CircularProgressIndicator(
                  strokeWidth: 2.5,
                  valueColor: AlwaysStoppedAnimation<Color>(
                    theme.colorScheme.onSecondary,
                  ),
                ),
              )
            : Row(
                mainAxisAlignment: MainAxisAlignment.center,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    Icons.camera_alt_outlined,
                    size: 22.0,
                    color: theme.colorScheme.onSecondary,
                  ),
                  const SizedBox(width: AppSpacing.md),
                  Flexible(
                    child: Text(
                      label,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: theme.textTheme.titleMedium?.copyWith(
                        color: theme.colorScheme.onSecondary,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ],
              ),
        ),
      ),
    );
  }
}
