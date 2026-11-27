import 'package:flutter/material.dart';
import '../../app/theme/app_colors.dart';
import '../../app/theme/app_spacing.dart';

class AvatarInitials extends StatelessWidget {
  const AvatarInitials({
    required this.initials,
    super.key,
    this.size = 44.0,
    this.backgroundColor,
    this.foregroundColor,
    this.fontSize,
    this.isCircle = true,
  });

  final String initials;
  final double size;
  final Color? backgroundColor;
  final Color? foregroundColor;
  final double? fontSize;
  final bool isCircle;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final bg = backgroundColor ?? AppColors.primaryContainer;
    final fg = foregroundColor ?? AppColors.primary;
    final textFontSize = fontSize ?? (size * 0.4);

    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: bg,
        shape: isCircle ? BoxShape.circle : BoxShape.rectangle,
        borderRadius: isCircle ? null : AppSpacing.borderRadiusInput,
      ),
      alignment: Alignment.center,
      child: Text(
        initials.toUpperCase(),
        style: theme.textTheme.titleMedium?.copyWith(
          color: fg,
          fontSize: textFontSize,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}
