import 'package:flutter/material.dart';

abstract final class AppSpacing {
  // Spacing Grid (8 dp baseline)
  static const double xs = 4.0;
  static const double sm = 8.0;
  static const double md = 12.0;
  static const double lg = 16.0;
  static const double xl = 24.0;
  static const double xxl = 32.0;

  // Screen Padding
  static const double screenHorizontal = 16.0;

  // Radii
  static const double radiusChip = 8.0;
  static const double radiusInput = 12.0;
  static const double radiusCard = 16.0;
  static const double radiusHeroCard = 20.0;
  static const double radiusPill = 999.0;

  static const BorderRadius borderRadiusChip = BorderRadius.all(Radius.circular(radiusChip));
  static const BorderRadius borderRadiusInput = BorderRadius.all(Radius.circular(radiusInput));
  static const BorderRadius borderRadiusCard = BorderRadius.all(Radius.circular(radiusCard));
  static const BorderRadius borderRadiusHeroCard = BorderRadius.all(Radius.circular(radiusHeroCard));
  static const BorderRadius borderRadiusPill = BorderRadius.all(Radius.circular(radiusPill));

  // Component Dimensions
  static const double punchButtonHeight = 60.0;
  static const double primaryButtonHeight = 56.0;
  static const double navBarHeight = 80.0;
  static const double minTouchTarget = 48.0;
}
