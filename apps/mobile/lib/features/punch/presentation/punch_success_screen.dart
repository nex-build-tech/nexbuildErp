import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_spacing.dart';
import '../../../app/theme/app_typography.dart';
import '../../../core/utils/date_formatters.dart';
import '../../../core/widgets/avatar_initials.dart';
import '../../../core/widgets/info_card.dart';
import '../../../core/widgets/key_value_row.dart';
import '../../../core/widgets/primary_button.dart';
import '../../../data/models/punch.dart';
import '../../home/providers/home_dashboard_provider.dart';
import '../providers/punch_provider.dart';

class PunchSuccessScreen extends ConsumerStatefulWidget {
  const PunchSuccessScreen({super.key});

  @override
  ConsumerState<PunchSuccessScreen> createState() => _PunchSuccessScreenState();
}

class _PunchSuccessScreenState extends ConsumerState<PunchSuccessScreen> {
  Timer? _redirectTimer;

  @override
  void initState() {
    super.initState();
    // Auto-redirect to /home after 5 seconds
    _redirectTimer = Timer(const Duration(seconds: 5), () {
      if (mounted) {
        _navigateHome();
      }
    });
  }

  @override
  void dispose() {
    _redirectTimer?.cancel();
    super.dispose();
  }

  void _navigateHome() {
    _redirectTimer?.cancel();
    ScaffoldMessenger.of(context).clearSnackBars();
    context.go('/home');
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final homeState = ref.watch(homeDashboardProvider);
    final punchState = ref.watch(punchProvider);

    final punch = punchState.lastCreatedPunch;
    final location = punchState.lastLocation ?? homeState.selectedLocation;
    final distance =
        punchState.lastDistanceMeters ?? homeState.currentDistanceMeters;

    final isPunchIn = punch?.punchType != PunchType.punchOut;
    final punchTime = punch?.timestamp ?? DateTime.now();
    final timeStr = DateFormatters.formatTime(punchTime);
    final dateStr = DateFormatters.formatDate(punchTime);

    final workedFormatted =
        DateFormatters.formatDuration(homeState.workedTodayLive);

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) {
          _navigateHome();
        }
      },
      child: Scaffold(
        body: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(
              horizontal: AppSpacing.screenHorizontal,
              vertical: AppSpacing.md,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                const SizedBox(height: AppSpacing.md),

                // 1. Large Circular Green Animated Checkmark (64x64 icon inside 80x80 circle)
                TweenAnimationBuilder<double>(
                  tween: Tween<double>(begin: 0.0, end: 1.0),
                  duration: const Duration(milliseconds: 400),
                  curve: Curves.elasticOut,
                  builder: (context, scale, child) {
                    return Transform.scale(
                      scale: scale,
                      child: child,
                    );
                  },
                  child: Container(
                    width: 80.0,
                    height: 80.0,
                    decoration: const BoxDecoration(
                      color: AppColors.successContainer,
                      shape: BoxShape.circle,
                    ),
                    child: const Center(
                      child: Icon(
                        Icons.check_rounded,
                        size: 52.0,
                        color: AppColors.success,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: AppSpacing.lg),

                // 2. Status Title & Big Time
                Text(
                  isPunchIn ? 'Punched In' : 'Punched Out',
                  style: theme.textTheme.headlineMedium?.copyWith(
                    fontWeight: FontWeight.w800,
                    color: AppColors.text,
                    fontSize: 28.0,
                  ),
                ),
                const SizedBox(height: 4.0),
                Text(
                  timeStr,
                  style: AppTypography.tabular(
                    fontSize: 34.0,
                    fontWeight: FontWeight.w800,
                    color: AppColors.primary,
                  ),
                ),
                const SizedBox(height: AppSpacing.xs),
                Text(
                  dateStr,
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: AppColors.textMuted,
                  ),
                ),
                const SizedBox(height: AppSpacing.xl),

                // 3. Verified Details Card
                InfoCard(
                  padding: const EdgeInsets.all(AppSpacing.md),
                  child: Column(
                    children: [
                      // Employee Header row
                      Row(
                        children: [
                          AvatarInitials(
                            initials: homeState.employee.initials,
                            size: 38.0,
                          ),
                          const SizedBox(width: AppSpacing.md),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  '${homeState.employee.name} (${homeState.employee.code})',
                                  style: theme.textTheme.titleSmall?.copyWith(
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                                Text(
                                  homeState.employee.role,
                                  style: theme.textTheme.labelMedium?.copyWith(
                                    color: AppColors.textMuted,
                                    fontSize: 12.0,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const Icon(
                            Icons.check_circle_rounded,
                            color: AppColors.success,
                            size: 22.0,
                          ),
                        ],
                      ),
                      const SizedBox(height: AppSpacing.xs),
                      const Divider(color: AppColors.divider),

                      // KeyValueRows
                      KeyValueRow(
                        label: 'Location',
                        value: location.name,
                      ),
                      const KeyValueRow(
                        label: 'GPS',
                        value: '18.5204° N, 73.8567° E (accuracy ±8m)',
                      ),
                      KeyValueRow(
                        label: 'Geofence',
                        value:
                            '$distance m from centre (Allowed: ${location.radiusMeters.round()} m)',
                      ),
                      const KeyValueRow(
                        label: 'Verification',
                        value: 'Face verified (confidence 98.4%)',
                      ),
                      const KeyValueRow(
                        label: 'Device',
                        value: 'Samsung Galaxy M34 · Android 14',
                        showDivider: false,
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: AppSpacing.lg),

                // 4. Alert Reminder Banner (Amber for In, Blue for Out)
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(AppSpacing.md),
                  decoration: BoxDecoration(
                    color: isPunchIn
                        ? AppColors.warningContainer
                        : AppColors.primaryContainer,
                    borderRadius: AppSpacing.borderRadiusInput,
                    border: Border.all(
                      color: isPunchIn
                          ? AppColors.warning.withValues(alpha: 0.3)
                          : AppColors.primary.withValues(alpha: 0.3),
                      width: 1.0,
                    ),
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Padding(
                        padding: const EdgeInsets.only(top: 2.0),
                        child: Icon(
                          isPunchIn
                              ? Icons.warning_amber_rounded
                              : Icons.info_outline_rounded,
                          size: 18.0,
                          color: isPunchIn ? AppColors.warning : AppColors.primary,
                        ),
                      ),
                      const SizedBox(width: AppSpacing.sm),
                      Expanded(
                        child: Text(
                          isPunchIn
                              ? 'Remember to punch out when leaving site. Next punch allowed after 15 minutes.'
                              : 'Shift completed. Total hours worked today: $workedFormatted. Have a safe journey!',
                          style: theme.textTheme.bodyMedium?.copyWith(
                            color:
                                isPunchIn ? AppColors.warning : AppColors.primary,
                            fontSize: 12.5,
                            height: 1.35,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: AppSpacing.xl),

                // 5. Done Button -> returns to /home
                PrimaryButton(
                  text: 'Done',
                  onPressed: _navigateHome,
                ),
                const SizedBox(height: AppSpacing.sm),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
