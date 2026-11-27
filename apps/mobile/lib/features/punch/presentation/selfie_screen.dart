import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_spacing.dart';
import '../../../app/theme/app_typography.dart';
import '../../../core/utils/date_formatters.dart';
import '../../../data/models/punch.dart';
import '../../home/providers/home_dashboard_provider.dart';
import '../providers/punch_provider.dart';
import 'widgets/selfie_camera_view.dart';

class SelfieScreen extends ConsumerStatefulWidget {
  const SelfieScreen({
    this.punchType = PunchType.punchIn,
    super.key,
  });

  final PunchType punchType;

  @override
  ConsumerState<SelfieScreen> createState() => _SelfieScreenState();
}

class _SelfieScreenState extends ConsumerState<SelfieScreen> {
  DateTime _currentTime = DateTime.now();

  @override
  void initState() {
    super.initState();
    _currentTime = DateTime.now();
  }

  Future<void> _handleCapture() async {
    final homeState = ref.read(homeDashboardProvider);
    final punchNotifier = ref.read(punchProvider.notifier);

    final success = await punchNotifier.captureAndVerify(
      punchType: widget.punchType,
      location: homeState.selectedLocation,
      distanceMeters: homeState.currentDistanceMeters,
    );

    if (success && mounted) {
      context.go('/punch/success');
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final homeState = ref.watch(homeDashboardProvider);
    final punchState = ref.watch(punchProvider);
    final cameraService = ref.watch(cameraServiceProvider);

    final isPunchIn = widget.punchType == PunchType.punchIn;
    final title = isPunchIn ? 'Punch In · Selfie' : 'Punch Out · Selfie';

    final locationName = homeState.selectedLocation.name;
    final distance = homeState.currentDistanceMeters;
    final timeStr = DateFormatters.formatTime(_currentTime);

    return Scaffold(
      backgroundColor: const Color(0xFF090E17),
      appBar: AppBar(
        backgroundColor: const Color(0xFF090E17),
        foregroundColor: Colors.white,
        title: Text(
          title,
          style: theme.textTheme.titleMedium?.copyWith(
            color: Colors.white,
            fontWeight: FontWeight.w700,
          ),
        ),
        actions: [
          // Failure simulation debug toggle
          IconButton(
            tooltip: punchState.simulateFailure
                ? 'Simulating Face Failure (Active)'
                : 'Simulate Face Failure',
            icon: Icon(
              punchState.simulateFailure
                  ? Icons.no_photography_rounded
                  : Icons.camera_alt_outlined,
              color: punchState.simulateFailure
                  ? AppColors.error
                  : Colors.white.withValues(alpha: 0.7),
            ),
            onPressed: () {
              ref.read(punchProvider.notifier).toggleSimulateFailure();
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  duration: const Duration(seconds: 2),
                  content: Text(
                    punchState.simulateFailure
                        ? 'Simulating failure disabled (Normal capture)'
                        : 'Simulating failure: next capture will fail with "Face not clear"',
                  ),
                ),
              );
            },
          ),
        ],
      ),
      body: Stack(
        children: [
          SafeArea(
            child: Column(
              children: [
                // 1. Sub-header Chips Row (Site + Distance, Time)
                Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: AppSpacing.screenHorizontal,
                    vertical: AppSpacing.xs,
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      // Location chip
                      Flexible(
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: AppSpacing.md,
                            vertical: 6.0,
                          ),
                          decoration: BoxDecoration(
                            color: const Color(0xFF06331E),
                            borderRadius: AppSpacing.borderRadiusPill,
                            border: Border.all(
                              color: const Color(0xFF135A36),
                              width: 1.0,
                            ),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(
                                Icons.location_on,
                                size: 14.0,
                                color: Color(0xFF4ADE80),
                              ),
                              const SizedBox(width: AppSpacing.xs),
                              Flexible(
                                child: Text(
                                  '$locationName · $distance m',
                                  style: const TextStyle(
                                    color: Color(0xFF4ADE80),
                                    fontSize: 12.0,
                                    fontWeight: FontWeight.w700,
                                  ),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(width: AppSpacing.sm),

                      // Time chip
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: AppSpacing.md,
                          vertical: 6.0,
                        ),
                        decoration: BoxDecoration(
                          color: const Color(0xFF1E293B),
                          borderRadius: AppSpacing.borderRadiusPill,
                          border: Border.all(
                            color: const Color(0xFF334155),
                            width: 1.0,
                          ),
                        ),
                        child: Text(
                          timeStr,
                          style: AppTypography.tabular(
                            fontSize: 12.0,
                            fontWeight: FontWeight.w700,
                            color: Colors.white,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: AppSpacing.sm),

                // 2. Camera Viewfinder with Face Oval Guide
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: AppSpacing.screenHorizontal,
                    ),
                    child: SelfieCameraView(cameraService: cameraService),
                  ),
                ),

                const SizedBox(height: AppSpacing.md),

                // 3. Bottom Controls Area
                Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: AppSpacing.screenHorizontal,
                  ),
                  child: Column(
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        crossAxisAlignment: CrossAxisAlignment.center,
                        children: [
                          // Left: Front camera label
                          const Row(
                            children: [
                              Icon(
                                Icons.flip_camera_android_rounded,
                                size: 18.0,
                                color: Colors.white70,
                              ),
                              SizedBox(width: AppSpacing.xs),
                              Text(
                                'Front camera',
                                style: TextStyle(
                                  color: Colors.white70,
                                  fontSize: 12.0,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ],
                          ),

                          // Center: Round Amber Shutter Button
                          GestureDetector(
                            onTap: punchState.isVerifying ? null : _handleCapture,
                            child: Container(
                              width: 76.0,
                              height: 76.0,
                              padding: const EdgeInsets.all(4.0),
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                border: Border.all(
                                  color: Colors.white,
                                  width: 3.5,
                                ),
                              ),
                              child: Container(
                                decoration: const BoxDecoration(
                                  shape: BoxShape.circle,
                                  color: AppColors.secondary,
                                ),
                                child: const Center(
                                  child: Icon(
                                    Icons.camera_alt_rounded,
                                    size: 32.0,
                                    color: AppColors.onSecondary,
                                  ),
                                ),
                              ),
                            ),
                          ),

                          // Right: Empty spacer for alignment
                          const SizedBox(width: 80.0),
                        ],
                      ),
                      const SizedBox(height: AppSpacing.md),

                      // Subtitle
                      Text(
                        'Front camera · Live photo only · No gallery upload',
                        style: theme.textTheme.bodyMedium?.copyWith(
                          color: Colors.white.withValues(alpha: 0.6),
                          fontSize: 12.0,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      const SizedBox(height: AppSpacing.sm),

                      // Quick toggle for debug/testing: [Simulate: Success | Face not clear]
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          InkWell(
                            onTap: () {
                              if (punchState.simulateFailure) {
                                ref.read(punchProvider.notifier).toggleSimulateFailure();
                              }
                            },
                            borderRadius: AppSpacing.borderRadiusPill,
                            child: Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: AppSpacing.sm,
                                vertical: 4.0,
                              ),
                              decoration: BoxDecoration(
                                color: !punchState.simulateFailure
                                    ? AppColors.secondary.withValues(alpha: 0.2)
                                    : Colors.transparent,
                                borderRadius: AppSpacing.borderRadiusPill,
                                border: Border.all(
                                  color: !punchState.simulateFailure
                                      ? AppColors.secondary
                                      : Colors.white24,
                                ),
                              ),
                              child: Text(
                                'Simulate: Success',
                                style: TextStyle(
                                  fontSize: 11.0,
                                  color: !punchState.simulateFailure
                                      ? AppColors.secondary
                                      : Colors.white60,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: AppSpacing.xs),
                          InkWell(
                            onTap: () {
                              if (!punchState.simulateFailure) {
                                ref.read(punchProvider.notifier).toggleSimulateFailure();
                              }
                            },
                            borderRadius: AppSpacing.borderRadiusPill,
                            child: Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: AppSpacing.sm,
                                vertical: 4.0,
                              ),
                              decoration: BoxDecoration(
                                color: punchState.simulateFailure
                                    ? AppColors.error.withValues(alpha: 0.2)
                                    : Colors.transparent,
                                borderRadius: AppSpacing.borderRadiusPill,
                                border: Border.all(
                                  color: punchState.simulateFailure
                                      ? AppColors.error
                                      : Colors.white24,
                                ),
                              ),
                              child: Text(
                                'Face not clear',
                                style: TextStyle(
                                  fontSize: 11.0,
                                  color: punchState.simulateFailure
                                      ? AppColors.error
                                      : Colors.white60,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: AppSpacing.xs),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // 4. Verifying Overlay Spinner
          if (punchState.isVerifying)
            Container(
              color: Colors.black.withValues(alpha: 0.75),
              child: Center(
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: AppSpacing.xl,
                    vertical: AppSpacing.lg,
                  ),
                  decoration: BoxDecoration(
                    color: const Color(0xFF1E293B),
                    borderRadius: AppSpacing.borderRadiusCard,
                    border: Border.all(color: const Color(0xFF334155)),
                  ),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const SizedBox(
                        width: 38.0,
                        height: 38.0,
                        child: CircularProgressIndicator(
                          strokeWidth: 3.0,
                          valueColor: AlwaysStoppedAnimation<Color>(
                            AppColors.secondary,
                          ),
                        ),
                      ),
                      const SizedBox(height: AppSpacing.md),
                      Text(
                        'Verifying liveness...',
                        style: theme.textTheme.titleSmall?.copyWith(
                          color: Colors.white,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: 2.0),
                      Text(
                        'Checking face alignment and location',
                        style: theme.textTheme.bodyMedium?.copyWith(
                          color: Colors.white70,
                          fontSize: 12.0,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),

          // 5. Failure Modal View
          if (punchState.failureReason != null)
            Container(
              color: Colors.black.withValues(alpha: 0.8),
              padding: const EdgeInsets.all(AppSpacing.xl),
              child: Center(
                child: Container(
                  padding: const EdgeInsets.all(AppSpacing.xl),
                  decoration: const BoxDecoration(
                    color: AppColors.card,
                    borderRadius: AppSpacing.borderRadiusCard,
                  ),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        width: 56.0,
                        height: 56.0,
                        decoration: const BoxDecoration(
                          color: AppColors.errorContainer,
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          Icons.warning_amber_rounded,
                          size: 32.0,
                          color: AppColors.error,
                        ),
                      ),
                      const SizedBox(height: AppSpacing.md),
                      Text(
                        'Face not clear',
                        style: theme.textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w800,
                          color: AppColors.text,
                        ),
                      ),
                      const SizedBox(height: AppSpacing.xs),
                      Text(
                        punchState.failureReason!,
                        textAlign: TextAlign.center,
                        style: theme.textTheme.bodyMedium?.copyWith(
                          color: AppColors.textMuted,
                        ),
                      ),
                      const SizedBox(height: AppSpacing.lg),
                      SizedBox(
                        width: double.infinity,
                        height: AppSpacing.primaryButtonHeight,
                        child: FilledButton(
                          onPressed: () {
                            ref.read(punchProvider.notifier).clearFailure();
                          },
                          style: FilledButton.styleFrom(
                            backgroundColor: AppColors.primary,
                            shape: const RoundedRectangleBorder(
                              borderRadius: AppSpacing.borderRadiusInput,
                            ),
                          ),
                          child: const Text(
                            'Try Again',
                            style: TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
