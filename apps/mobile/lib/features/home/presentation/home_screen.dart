import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_spacing.dart';
import '../../../core/utils/date_formatters.dart';
import '../../../core/widgets/avatar_initials.dart';
import '../../../data/models/employee.dart';
import '../providers/home_dashboard_provider.dart';
import 'widgets/boundary_proximity_banner.dart';
import 'widgets/geofence_card.dart';
import 'widgets/mock_location_alert.dart';
import 'widgets/offline_notice_banner.dart';
import 'widgets/outside_site_alert.dart';
import 'widgets/status_hero_card.dart';
import 'widgets/todays_sessions_preview.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({
    super.key,
    this.onPunchPressed,
  });

  final VoidCallback? onPunchPressed;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final state = ref.watch(homeDashboardProvider);
    final notifier = ref.read(homeDashboardProvider.notifier);

    final now = DateTime.now();
    final dateStr = DateFormatters.formatDate(now);
    final greeting = DateFormatters.getGreeting(now, state.employee.name.split(' ').first);

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              dateStr,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: theme.textTheme.labelMedium?.copyWith(
                color: AppColors.textMuted,
                fontWeight: FontWeight.w500,
              ),
            ),
            Text(
              greeting,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w700,
              ),
            ),
          ],
        ),
        actions: [
          // Debug Toggle: Inside vs Outside Geofence
          IconButton(
            tooltip: state.isInsideGeofence
                ? 'Simulate Outside Site Radius'
                : 'Simulate Inside Site Radius',
            icon: Icon(
              state.isInsideGeofence
                  ? Icons.location_on_rounded
                  : Icons.location_off_rounded,
              color: state.isInsideGeofence ? AppColors.success : AppColors.error,
            ),
            onPressed: () => notifier.toggleGeofenceRadius(),
          ),

          // Widget Gallery
          IconButton(
            tooltip: 'Widget Gallery',
            icon: const Icon(Icons.palette_outlined),
            onPressed: () => context.push('/gallery'),
          ),

          // Avatar Initials
          Padding(
            padding: const EdgeInsets.only(right: AppSpacing.screenHorizontal),
            child: AvatarInitials(
              initials: state.employee.initials,
              size: 36.0,
            ),
          ),
        ],
      ),
      body: SafeArea(
        child: state.isLoading
            ? const Center(child: CircularProgressIndicator())
            : RefreshIndicator(
                onRefresh: () => notifier.refreshLocation(),
                child: ListView(
                  padding: const EdgeInsets.all(AppSpacing.screenHorizontal),
                  children: [
                    // Offline / Low-Network Notice Banner
                    if (state.isOfflineMode) ...[
                      OfflineNoticeBanner(
                        pendingSyncCount: state.pendingSyncCount,
                      ),
                      const SizedBox(height: AppSpacing.sm),
                    ],

                    // Mock Location Spoofing Alert
                    if (state.isMockLocationDetected) ...[
                      const MockLocationAlert(),
                      const SizedBox(height: AppSpacing.sm),
                    ],

                    // Geofence Boundary Proximity Indicator
                    if (state.isNearBoundary && state.isInsideGeofence) ...[
                      BoundaryProximityBanner(
                        distanceMeters: state.currentDistanceMeters,
                        radiusMeters:
                            state.selectedLocation.radiusMeters.round(),
                      ),
                      const SizedBox(height: AppSpacing.sm),
                    ],

                    // 1. Geofence Card with Map, Site Details, and Inside/Outside Chip
                    GeofenceCard(
                      selectedLocation: state.selectedLocation,
                      allLocations: state.assignedLocations,
                      isInside: state.isInsideGeofence,
                      distanceMeters: state.currentDistanceMeters,
                      onLocationChanged: (loc) => notifier.selectLocation(loc),
                    ),
                    const SizedBox(height: AppSpacing.md),

                    // 2. Outside-Site Alert (when outside geofence boundary)
                    if (!state.isInsideGeofence) ...[
                      OutsideSiteAlert(
                        siteName: state.selectedLocation.name,
                        distanceMeters: state.currentDistanceMeters,
                        radiusMeters: state.selectedLocation.radiusMeters.round(),
                        isRefreshing: state.isRefreshingLocation,
                        onRefreshLocation: () => notifier.refreshLocation(),
                      ),
                      const SizedBox(height: AppSpacing.md),
                    ],

                    // 3. Status Hero Card (Primary navy, Punch In/Out, Live worked hours)
                    StatusHeroCard(
                      isPunchedIn: state.isPunchedIn,
                      isInsideGeofence: state.isInsideGeofence,
                      isMockLocationDetected: state.isMockLocationDetected,
                      workedToday: state.workedTodayLive,
                      lastPunch: state.lastPunch,
                      onPunchPressed: onPunchPressed ??
                          () {
                            final typeParam = state.isPunchedIn ? 'out' : 'in';
                            final router = GoRouter.maybeOf(context);
                            if (router != null) {
                              context.push('/punch/selfie?type=$typeParam');
                            } else {
                              notifier.togglePunchDirect();
                            }
                          },
                    ),
                    const SizedBox(height: AppSpacing.lg),

                    // 4. Today's Sessions Preview (last 2 sessions) + View all -> /today
                    TodaysSessionsPreview(
                      sessions: state.todaySessions,
                      onViewAll: () {
                        final router = GoRouter.maybeOf(context);
                        if (router != null) {
                          context.go('/today');
                        }
                      },
                    ),
                    const SizedBox(height: AppSpacing.lg),

                    // 5. Interactive Debug Switcher Bar
                    _DebugSwitcherBar(
                      isInside: state.isInsideGeofence,
                      distanceMeters: state.currentDistanceMeters,
                      employeeType: state.employee.employeeType,
                      isOffline: state.isOfflineMode,
                      isMockGps: state.isMockLocationDetected,
                      onToggleRadius: () => notifier.toggleGeofenceRadius(),
                      onToggleEmployeeType: () => notifier.toggleEmployeeType(),
                      onToggleOffline: () => notifier.toggleOfflineMode(),
                      onToggleMockGps: () =>
                          notifier.toggleMockLocationDetection(),
                      onSimulateNearBoundary: () =>
                          notifier.simulateNearBoundary(),
                    ),
                    const SizedBox(height: AppSpacing.md),
                  ],
                ),
              ),
      ),
    );
  }
}

class _DebugSwitcherBar extends StatelessWidget {
  const _DebugSwitcherBar({
    required this.isInside,
    required this.distanceMeters,
    required this.employeeType,
    required this.isOffline,
    required this.isMockGps,
    required this.onToggleRadius,
    required this.onToggleEmployeeType,
    required this.onToggleOffline,
    required this.onToggleMockGps,
    required this.onSimulateNearBoundary,
  });

  final bool isInside;
  final int distanceMeters;
  final EmployeeType employeeType;
  final bool isOffline;
  final bool isMockGps;
  final VoidCallback onToggleRadius;
  final VoidCallback onToggleEmployeeType;
  final VoidCallback onToggleOffline;
  final VoidCallback onToggleMockGps;
  final VoidCallback onSimulateNearBoundary;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: AppSpacing.borderRadiusCard,
        border: Border.all(color: AppColors.cardBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(
                Icons.bug_report_outlined,
                size: 16.0,
                color: AppColors.textMuted,
              ),
              const SizedBox(width: AppSpacing.xs),
              Text(
                'PHASE 7 QA & EDGE CASE DEBUG CONTROLS',
                style: Theme.of(context).textTheme.labelMedium?.copyWith(
                      fontWeight: FontWeight.w700,
                      color: AppColors.textMuted,
                      letterSpacing: 0.5,
                      fontSize: 10.0,
                    ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.sm),
          Wrap(
            spacing: AppSpacing.xs,
            runSpacing: AppSpacing.xs,
            children: [
              OutlinedButton.icon(
                onPressed: onToggleRadius,
                icon: Icon(
                  isInside ? Icons.near_me : Icons.near_me_disabled,
                  size: 15.0,
                  color: isInside ? AppColors.success : AppColors.error,
                ),
                label: Text(
                  isInside ? 'Outside' : 'Inside',
                  style: const TextStyle(fontSize: 11.0),
                ),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: AppSpacing.sm),
                  shape: const RoundedRectangleBorder(
                    borderRadius: AppSpacing.borderRadiusChip,
                  ),
                ),
              ),
              OutlinedButton.icon(
                onPressed: onToggleEmployeeType,
                icon: Icon(
                  employeeType == EmployeeType.site
                      ? Icons.apartment
                      : Icons.business,
                  size: 15.0,
                  color: AppColors.primary,
                ),
                label: Text(
                  employeeType == EmployeeType.site ? 'To Office' : 'To Site',
                  style: const TextStyle(fontSize: 11.0),
                ),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: AppSpacing.sm),
                  shape: const RoundedRectangleBorder(
                    borderRadius: AppSpacing.borderRadiusChip,
                  ),
                ),
              ),
              OutlinedButton.icon(
                onPressed: onToggleOffline,
                icon: Icon(
                  isOffline ? Icons.cloud_off : Icons.cloud_done,
                  size: 15.0,
                  color: isOffline ? AppColors.warning : AppColors.success,
                ),
                label: Text(
                  isOffline ? 'Online' : 'Offline',
                  style: const TextStyle(fontSize: 11.0),
                ),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: AppSpacing.sm),
                  shape: const RoundedRectangleBorder(
                    borderRadius: AppSpacing.borderRadiusChip,
                  ),
                ),
              ),
              OutlinedButton.icon(
                onPressed: onToggleMockGps,
                icon: Icon(
                  isMockGps ? Icons.fmd_bad : Icons.gps_fixed,
                  size: 15.0,
                  color: isMockGps ? AppColors.error : AppColors.primary,
                ),
                label: Text(
                  isMockGps ? 'Clean GPS' : 'Mock GPS',
                  style: const TextStyle(fontSize: 11.0),
                ),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: AppSpacing.sm),
                  shape: const RoundedRectangleBorder(
                    borderRadius: AppSpacing.borderRadiusChip,
                  ),
                ),
              ),
              OutlinedButton.icon(
                onPressed: onSimulateNearBoundary,
                icon: const Icon(
                  Icons.radar,
                  size: 15.0,
                  color: AppColors.primary,
                ),
                label: const Text(
                  'Near Boundary',
                  style: TextStyle(fontSize: 11.0),
                ),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: AppSpacing.sm),
                  shape: const RoundedRectangleBorder(
                    borderRadius: AppSpacing.borderRadiusChip,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
