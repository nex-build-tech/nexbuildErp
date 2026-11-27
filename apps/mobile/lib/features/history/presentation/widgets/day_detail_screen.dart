import 'package:flutter/material.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../core/utils/date_formatters.dart';
import '../../../../core/widgets/info_card.dart';
import '../../../../core/widgets/primary_button.dart';
import '../../../../core/widgets/section_header.dart';
import '../../../../data/models/day_summary.dart';
import '../../../../data/models/employee.dart';
import '../../../../data/models/punch.dart';
import '../../../../data/models/work_location.dart';
import '../../../today/presentation/widgets/break_interval_pill.dart';
import '../../../today/presentation/widgets/punch_location_map_snippet.dart';
import '../../../today/presentation/widgets/session_card_timeline.dart';
import '../../../today/presentation/widgets/today_summary_card.dart';
import 'regularization_request_sheet.dart';

class DayDetailScreen extends StatelessWidget {
  const DayDetailScreen({
    required this.date,
    required this.summary,
    required this.punches,
    required this.employee,
    this.locations = const [],
    super.key,
  });

  final DateTime date;
  final DaySummary summary;
  final List<Punch> punches;
  final Employee employee;
  final List<WorkLocation> locations;

  static Future<void> show(
    BuildContext context, {
    required DateTime date,
    required DaySummary summary,
    required List<Punch> punches,
    required Employee employee,
    List<WorkLocation> locations = const [],
  }) {
    return Navigator.of(context).push<void>(
      MaterialPageRoute(
        builder: (context) => DayDetailScreen(
          date: date,
          summary: summary,
          punches: punches,
          employee: employee,
          locations: locations,
        ),
      ),
    );
  }

  WorkLocation? _getLocation(String locationId) {
    try {
      return locations.firstWhere((l) => l.id == locationId);
    } catch (_) {
      return locations.isNotEmpty ? locations.first : null;
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final dateStr = DateFormatters.formatDate(date);
    final shiftStr = 'Shift ${employee.shiftStart} – ${employee.shiftEnd}';

    final needsRegularization = summary.status == DayStatus.halfDay ||
        summary.status == DayStatus.late ||
        summary.status == DayStatus.absent ||
        punches.any((p) => p.isAutoClosed);

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              dateStr,
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w700,
              ),
            ),
            Text(
              shiftStr,
              style: theme.textTheme.labelMedium?.copyWith(
                color: AppColors.textMuted,
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.edit_calendar_rounded),
            tooltip: 'Request Regularization',
            onPressed: () => RegularizationRequestSheet.show(context, date: date),
          ),
        ],
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.screenHorizontal,
            vertical: AppSpacing.sm,
          ),
          children: [
            // 1. Day Summary Card (Read-only mode)
            TodaySummaryCard(
              workedDuration: summary.totalWorked,
              breakDuration: summary.totalBreak,
              sessionCount: summary.sessions.length,
              dayStatus: summary.status,
              isPunchedIn: summary.sessions.any((s) => s.isRunning),
            ),

            const SizedBox(height: AppSpacing.lg),

            // 2. Punch Log Timeline or Absent Message
            if (punches.isEmpty) ...[
              InfoCard(
                padding: const EdgeInsets.all(AppSpacing.xl),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(AppSpacing.md),
                      decoration: BoxDecoration(
                        color: summary.status == DayStatus.weeklyOff
                            ? AppColors.surface
                            : AppColors.errorContainer,
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        summary.status == DayStatus.weeklyOff
                            ? Icons.weekend_rounded
                            : Icons.event_busy_rounded,
                        size: 36.0,
                        color: summary.status == DayStatus.weeklyOff
                            ? AppColors.textMuted
                            : AppColors.error,
                      ),
                    ),
                    const SizedBox(height: AppSpacing.md),
                    Text(
                      summary.status == DayStatus.weeklyOff
                          ? 'Weekly Off'
                          : 'No punches recorded',
                      style: theme.textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 4.0),
                    Text(
                      summary.status == DayStatus.weeklyOff
                          ? 'No shift scheduled on this day.'
                          : 'Attendance was marked absent for this date.',
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: AppColors.textMuted,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    if (summary.status != DayStatus.weeklyOff) ...[
                      const SizedBox(height: AppSpacing.lg),
                      PrimaryButton(
                        text: 'Request Regularization',
                        height: 44.0,
                        onPressed: () => RegularizationRequestSheet.show(
                          context,
                          date: date,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ] else ...[
              // Section Header
              SectionHeader(
                title: 'PUNCH LOG TIMELINE',
                subtitle: 'Chronological In/Out sessions & breaks',
                trailing: Text(
                  '${punches.length} punches',
                  style: theme.textTheme.labelMedium?.copyWith(
                    color: AppColors.textMuted,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              const SizedBox(height: AppSpacing.xs),

              // Sessions & Break Interval Pills
              for (int i = 0; i < summary.sessions.length; i++) ...[
                SessionCardTimeline(
                  sessionNumber: i + 1,
                  session: summary.sessions[i],
                  allPunches: punches,
                  location: _getLocation(summary.sessions[i].locationId),
                ),

                if (i < summary.sessions.length - 1) ...[
                  Builder(
                    builder: (context) {
                      final currentOut = summary.sessions[i].outTime;
                      final nextIn = summary.sessions[i + 1].inTime;
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
                punches: punches,
                location: locations.isNotEmpty ? locations.first : null,
              ),

              const SizedBox(height: AppSpacing.md),

              // 4. Regularization Quick Action Banner
              if (needsRegularization) ...[
                Container(
                  padding: const EdgeInsets.all(AppSpacing.md),
                  decoration: BoxDecoration(
                    color: AppColors.warningContainer.withValues(alpha: 0.4),
                    borderRadius: AppSpacing.borderRadiusCard,
                    border: Border.all(
                      color: AppColors.warning.withValues(alpha: 0.3),
                    ),
                  ),
                  child: Row(
                    children: [
                      const Icon(
                        Icons.edit_calendar_rounded,
                        color: AppColors.warning,
                        size: 22.0,
                      ),
                      const SizedBox(width: AppSpacing.sm),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Discrepancy in attendance?',
                              style: theme.textTheme.labelMedium?.copyWith(
                                fontWeight: FontWeight.w700,
                                color: AppColors.text,
                              ),
                            ),
                            Text(
                              'Raise a regularization request for supervisor review.',
                              style: theme.textTheme.bodyMedium?.copyWith(
                                color: AppColors.textMuted,
                                fontSize: 11.5,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: AppSpacing.xs),
                      TextButton(
                        onPressed: () => RegularizationRequestSheet.show(
                          context,
                          date: date,
                        ),
                        child: const Text('Regularize'),
                      ),
                    ],
                  ),
                ),
              ],
            ],

            const SizedBox(height: AppSpacing.xl),
          ],
        ),
      ),
    );
  }
}
