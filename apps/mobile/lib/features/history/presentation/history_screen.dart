import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_spacing.dart';
import '../../../core/widgets/section_header.dart';
import '../providers/history_provider.dart';
import 'widgets/attendance_summary_tiles.dart';
import 'widgets/calendar_grid.dart';
import 'widgets/day_detail_screen.dart';
import 'widgets/month_navigator_header.dart';
import 'widgets/recent_days_list.dart';

class HistoryScreen extends ConsumerWidget {
  const HistoryScreen({super.key});

  Future<void> _handleDayTap(
    BuildContext context,
    WidgetRef ref,
    DateTime date,
  ) async {
    final notifier = ref.read(historyProvider.notifier);
    await notifier.selectDay(date);

    if (!context.mounted) return;
    final state = ref.read(historyProvider);
    final summary = state.selectedDaySummary;
    if (summary == null) return;

    await DayDetailScreen.show(
      context,
      date: date,
      summary: summary,
      punches: state.selectedDayPunches,
      employee: state.employee,
      locations: state.locations,
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final state = ref.watch(historyProvider);
    final notifier = ref.read(historyProvider.notifier);

    return Scaffold(
      appBar: AppBar(
        title: Text(
          'History',
          style: theme.textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.w700,
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            tooltip: 'Refresh attendance history',
            onPressed: () => notifier.refresh(),
          ),
        ],
      ),
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () => notifier.refresh(),
          color: AppColors.primary,
          child: state.isLoading && state.summaries.isEmpty
              ? const Center(
                  child: CircularProgressIndicator(color: AppColors.primary),
                )
              : ListView(
                  padding: const EdgeInsets.symmetric(
                    horizontal: AppSpacing.screenHorizontal,
                    vertical: AppSpacing.sm,
                  ),
                  children: [
                    // 1. Month Navigator Header
                    MonthNavigatorHeader(
                      selectedMonth: state.selectedMonth,
                      canGoNext: state.canGoNext,
                      canGoPrev: state.canGoPrev,
                      onPrevious: () => notifier.previousMonth(),
                      onNext: () => notifier.nextMonth(),
                      totalHours: state.totalWorkedHours,
                    ),

                    const SizedBox(height: AppSpacing.md),

                    // 2. Attendance Summary Tiles (Present, Late, Half Day, Absent)
                    AttendanceSummaryTiles(
                      presentCount: state.presentCount,
                      lateCount: state.lateCount,
                      halfDayCount: state.halfDayCount,
                      absentCount: state.absentCount,
                    ),

                    const SizedBox(height: AppSpacing.md),

                    // 3. Calendar Grid (Sunday First with status colored dots and legend)
                    CalendarGrid(
                      selectedMonth: state.selectedMonth,
                      summaries: state.summaries,
                      selectedDay: state.selectedDay,
                      onDayTap: (date) => _handleDayTap(context, ref, date),
                    ),

                    const SizedBox(height: AppSpacing.lg),

                    // 4. Recent Days List Section
                    const SectionHeader(
                      title: 'RECENT ATTENDANCE',
                      subtitle: 'Tap any day to view complete shift details',
                    ),
                    const SizedBox(height: AppSpacing.xs),

                    RecentDaysList(
                      summaries: state.summaries,
                      onDayTap: (date) => _handleDayTap(context, ref, date),
                    ),

                    const SizedBox(height: AppSpacing.xl),
                  ],
                ),
        ),
      ),
    );
  }
}
