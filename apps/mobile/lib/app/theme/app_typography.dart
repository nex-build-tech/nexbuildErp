import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'app_colors.dart';

abstract final class AppTypography {
  static const List<FontFeature> tabularFeatures = <FontFeature>[
    FontFeature.tabularFigures(),
  ];

  static TextTheme createTextTheme() {
    final baseTextTheme = GoogleFonts.interTextTheme();

    return baseTextTheme.copyWith(
      displaySmall: GoogleFonts.inter(
        fontSize: 32.0,
        fontWeight: FontWeight.w800,
        color: AppColors.text,
        letterSpacing: -0.5,
        fontFeatures: tabularFeatures,
      ),
      titleLarge: GoogleFonts.inter(
        fontSize: 22.0,
        fontWeight: FontWeight.w700,
        color: AppColors.text,
        letterSpacing: -0.2,
      ),
      titleMedium: GoogleFonts.inter(
        fontSize: 18.0,
        fontWeight: FontWeight.w600,
        color: AppColors.text,
        letterSpacing: -0.1,
      ),
      titleSmall: GoogleFonts.inter(
        fontSize: 15.0,
        fontWeight: FontWeight.w600,
        color: AppColors.text,
      ),
      bodyMedium: GoogleFonts.inter(
        fontSize: 14.0,
        fontWeight: FontWeight.w400,
        color: AppColors.text,
        height: 1.4,
      ),
      labelMedium: GoogleFonts.inter(
        fontSize: 12.0,
        fontWeight: FontWeight.w600,
        color: AppColors.textMuted,
        letterSpacing: 0.2,
      ),
    );
  }

  /// TextStyle for tabular numbers and times
  static TextStyle tabular({
    double fontSize = 14.0,
    FontWeight fontWeight = FontWeight.w600,
    Color color = AppColors.text,
  }) {
    return GoogleFonts.inter(
      fontSize: fontSize,
      fontWeight: fontWeight,
      color: color,
      fontFeatures: tabularFeatures,
    );
  }
}
