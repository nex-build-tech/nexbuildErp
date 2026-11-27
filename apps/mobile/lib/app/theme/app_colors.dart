import 'package:flutter/material.dart';

/// Design tokens for TrueShift.
/// Strictly follows Section 6 of the TrueShift design specification.
abstract final class AppColors {
  // Primary & Containers
  static const Color primary = Color(0xFF17365D);
  static const Color onPrimary = Color(0xFFFFFFFF);
  static const Color primaryContainer = Color(0xFFDCE6F4);
  static const Color onPrimaryContainer = Color(0xFF17365D);

  // Secondary (Action - Punch Button Only)
  static const Color secondary = Color(0xFFF5A524);
  static const Color onSecondary = Color(0xFF1A1A1A);
  static const Color secondaryContainer = Color(0xFFFFECC4);
  static const Color onSecondaryContainer = Color(0xFF4C3000);

  // Status: Success (Inside site, Present, Verified)
  static const Color success = Color(0xFF157F3D);
  static const Color onSuccess = Color(0xFFFFFFFF);
  static const Color successContainer = Color(0xFFDDF5E5);
  static const Color onSuccessContainer = Color(0xFF157F3D);

  // Status: Warning (Late, Reminders)
  static const Color warning = Color(0xFF6B4A00);
  static const Color onWarning = Color(0xFFFFFFFF);
  static const Color warningContainer = Color(0xFFFFF4DB);
  static const Color onWarningContainer = Color(0xFF6B4A00);

  // Status: Error (Outside site, Absent, Logout)
  static const Color error = Color(0xFFB42318);
  static const Color onError = Color(0xFFFFFFFF);
  static const Color errorContainer = Color(0xFFFDE7E5);
  static const Color onErrorContainer = Color(0xFFB42318);

  // Surface & Background
  static const Color surface = Color(0xFFF6F7F9);
  static const Color onSurface = Color(0xFF111827);
  static const Color card = Color(0xFFFFFFFF);
  static const Color cardBorder = Color(0xFFE5E7EB);

  // Text
  static const Color text = Color(0xFF111827);
  static const Color textMuted = Color(0xFF4B5563);
  static const Color textHint = Color(0xFF9CA3AF);

  // Neutral & Disabled
  static const Color divider = Color(0xFFE5E7EB);
  static const Color disabled = Color(0xFFD1D5DB);
  static const Color onDisabled = Color(0xFF6B7280);
}
