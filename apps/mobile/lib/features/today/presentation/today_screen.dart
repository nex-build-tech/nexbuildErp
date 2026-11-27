import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_spacing.dart';
import '../../../core/utils/date_formatters.dart';
import '../../../core/widgets/section_header.dart';
import '../providers/today_provider.dart';
import 'widgets/break_interval_pill.dart';
import 'widgets/punch_location_map_snippet.dart';
import 'widgets/session_card_timeline.dart';
import 'widgets/today_empty_state.dart';
import 'widgets/today_summary_card.dart';

class TodayScreen extends ConsumerWidget {
  const TodayScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final state = ref.watch(todayProvider);
    final notifier = ref.read(todayProvider.notifier);

    final dateStr = DateFormatters.formatDate(state.selectedDate);
    final shiftStr =
        'Shift ${state.employee.shiftStart} – ${state.employee.shiftEnd}';

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Today',
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w700,
              ),
            ),
            Text(
              '$dateStr · $shiftStr',
              style: theme.textTheme.labelMedium?.copyWith(
                color: AppColors.textMuted,
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            tooltip: 'Refresh today attendance',
            onPressed: () => notifier.refresh(),
          ),
        ],
      ),
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () => notifier.refresh(),
          color: AppColors.primary,
          child: ListView(
            padding: const EdgeInsets.symmetric(
              horizontal: AppSpacing.screenHorizontal,
              vertical: AppSpacing.sm,
            ),
            children: [
              // 1. Today Summary Card
              TodaySummaryCard(
                workedDuration: state.workedTodayLive,
                breakDuration: state.totalBreakDuration,
                sessionCount: state.sessionCount,
                dayStatus: state.todaySummary.status,
                isPunchedIn: state.isPunchedIn,
              ),

              const SizedBox(height: AppSpacing.lg),

              // 2. Timeline or Empty State
              if (state.todayPunches.isEmpty) ...[
                const TodayEmptyState(),
              ] else ...[
                // Section Header
                SectionHeader(
                  title: 'PUNCH LOG TIMELINE',
                  subtitle: 'Chronological In/Out sessions & breaks',
                  trailing: Text(
                    '${state.todayPunches.length} punches',
                    style: theme.textTheme.labelMedium?.copyWith(
                      color: AppColors.textMuted,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
                const SizedBox(height: AppSpacing.xs),

                // Sessions & Break Pills
                for (int i = 0; i < state.todaySessions.length; i++) ...[
                  SessionCardTimeline(
                    sessionNumber: i + 1,
                    session: state.todaySessions[i],
                    allPunches: state.todayPunches,
                    location: state.getLocation(state.todaySessions[i].locationId),
                  ),

                  // If there is a subsequent session, render BreakIntervalPill
                  if (i < state.todaySessions.length - 1) ...[
                    Builder(
                      builder: (context) {
                        final currentOut = state.todaySessions[i].outTime;
                        final nextIn = state.todaySessions[i + 1].inTime;
                        if (currentOut != null) {
                          final breakDur = nextIn.difference(currentOut);
                          if (!breakDur.isNegative && breakDur.inMinutes > 0) {
                            return BreakIntervalPill(duration: breakDur);
                          }
                        }
                        return const SizedBox(height: AppSpacing.sm);
                      },
                    ),
                  ],
                ],

                const SizedBox(height: AppSpacing.lg),

                // 3. Map Snippet of Punch Locations
                PunchLocationMapSnippet(
                  punches: state.todayPunches,
                  location: state.locations.isNotEmpty
                      ? state.locations.first
                      : null,
                ),

                const SizedBox(height: AppSpacing.md),

                // 4. Regularization / Missed Punch Reminder Banner
                Container(
                  padding: const EdgeInsets.all(AppSpacing.md),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: AppSpacing.borderRadiusCard,
                    border: Border.all(color: AppColors.cardBorder),
                  ),
                  child: Row(
                    children: [
                      const Icon(
                        Icons.help_outline_rounded,
                        size: 20.0,
                        color: AppColors.textMuted,
                      ),
                      const SizedBox(width: AppSpacing.sm),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Forgot to punch out?',
                              style: theme.textTheme.titleSmall?.copyWith(
                                fontWeight: FontWeight.w700,
                                fontSize: 13.0,
                              ),
                            ),
                            Text(
                              'Open punches auto-close at shift end. You can regularize punches with manager review.',
                              style: theme.textTheme.bodyMedium?.copyWith(
                                color: AppColors.textMuted,
                                fontSize: 11.5,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ],

              const SizedBox(height: AppSpacing.xl),
            ],
          ),
        ),
      ),
    );
  }
}
