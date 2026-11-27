import 'package:flutter/material.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../app/theme/app_typography.dart';
import '../../../../data/models/day_summary.dart';

class CalendarGrid extends StatelessWidget {
  const CalendarGrid({
    required this.selectedMonth,
    required this.summaries,
    required this.onDayTap,
    this.selectedDay,
    super.key,
  });

  final DateTime selectedMonth;
  final List<DaySummary> summaries;
  final ValueChanged<DateTime> onDayTap;
  final DateTime? selectedDay;

  static const List<String> _weekdays = [
    'Sun',
    'Mon',
    'Tue',
    'Wed',
    'Thu',
    'Fri',
    'Sat',
  ];

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);

    final firstDayOfMonth = DateTime(selectedMonth.year, selectedMonth.month, 1);
    final daysInMonth = DateTime(selectedMonth.year, selectedMonth.month + 1, 0).day;
    // Sunday first: Sunday = 0, Monday = 1, ..., Saturday = 6
    final startWeekdayOffset = firstDayOfMonth.weekday % 7;

    final totalGridCells = startWeekdayOffset + daysInMonth;
    final rowCount = (totalGridCells / 7).ceil();

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
          // 1. Weekday Header Row (Sunday First)
          Row(
            children: _weekdays.map((day) {
              final isSunday = day == 'Sun';
              return Expanded(
                child: Center(
                  child: Text(
                    day,
                    style: theme.textTheme.labelMedium?.copyWith(
                      fontWeight: FontWeight.w700,
                      color: isSunday ? AppColors.error.withValues(alpha: 0.8) : AppColors.textMuted,
                      fontSize: 11.5,
                    ),
                  ),
                ),
              );
            }).toList(),
          ),

          const SizedBox(height: AppSpacing.sm),
          const Divider(color: AppColors.divider, height: 1.0),
          const SizedBox(height: AppSpacing.sm),

          // 2. Day Grid Cells
          for (int row = 0; row < rowCount; row++) ...[
            Row(
              children: [
                for (int col = 0; col < 7; col++) ...[
                  Expanded(
                    child: Builder(
                      builder: (context) {
                        final cellIndex = row * 7 + col;
                        final dayNumber = cellIndex - startWeekdayOffset + 1;

                        if (dayNumber < 1 || dayNumber > daysInMonth) {
                          return const SizedBox(height: 44.0);
                        }

                        final cellDate = DateTime(
                          selectedMonth.year,
                          selectedMonth.month,
                          dayNumber,
                        );

                        final isToday = cellDate.year == today.year &&
                            cellDate.month == today.month &&
                            cellDate.day == today.day;

                        final isSelected = selectedDay != null &&
                            cellDate.year == selectedDay!.year &&
                            cellDate.month == selectedDay!.month &&
                            cellDate.day == selectedDay!.day;

                        final isFuture = cellDate.isAfter(today);

                        DaySummary? summary;
                        try {
                          summary = summaries.firstWhere(
                            (s) =>
                                s.date.year == cellDate.year &&
                                s.date.month == cellDate.month &&
                                s.date.day == cellDate.day,
                          );
                        } catch (_) {}

                        final status = summary?.status ??
                            (cellDate.weekday == DateTime.sunday
                                ? DayStatus.weeklyOff
                                : (isFuture
                                    ? DayStatus.upcoming
                                    : DayStatus.absent));

                        return _CalendarDayCell(
                          dayNumber: dayNumber,
                          date: cellDate,
                          status: status,
                          isToday: isToday,
                          isSelected: isSelected,
                          isFuture: isFuture,
                          onTap: () => onDayTap(cellDate),
                        );
                      },
                    ),
                  ),
                ],
              ],
            ),
            if (row < rowCount - 1) const SizedBox(height: 4.0),
          ],

          const SizedBox(height: AppSpacing.md),
          const Divider(color: AppColors.divider, height: 1.0),
          const SizedBox(height: AppSpacing.sm),

          // 3. Status Color Legend
          const _CalendarLegend(),
        ],
      ),
    );
  }
}

class _CalendarDayCell extends StatelessWidget {
  const _CalendarDayCell({
    required this.dayNumber,
    required this.date,
    required this.status,
    required this.isToday,
    required this.isSelected,
    required this.isFuture,
    required this.onTap,
  });

  final int dayNumber;
  final DateTime date;
  final DayStatus status;
  final bool isToday;
  final bool isSelected;
  final bool isFuture;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    Color? dotColor;
    Color textColor = AppColors.text;

    if (isFuture) {
      textColor = AppColors.textMuted.withValues(alpha: 0.35);
    } else {
      switch (status) {
        case DayStatus.present:
          dotColor = AppColors.success;
          break;
        case DayStatus.late:
          dotColor = AppColors.warning;
          break;
        case DayStatus.halfDay:
          dotColor = AppColors.secondary;
          break;
        case DayStatus.absent:
          dotColor = AppColors.error;
          break;
        case DayStatus.weeklyOff:
          textColor = AppColors.textMuted.withValues(alpha: 0.5);
          break;
        case DayStatus.holiday:
          dotColor = AppColors.primary;
          break;
        case DayStatus.upcoming:
          textColor = AppColors.textMuted.withValues(alpha: 0.35);
          break;
      }
    }

    return InkWell(
      onTap: isFuture ? null : onTap,
      borderRadius: AppSpacing.borderRadiusChip,
      child: Container(
        height: 44.0,
        decoration: BoxDecoration(
          color: isSelected
              ? AppColors.primary.withValues(alpha: 0.12)
              : Colors.transparent,
          borderRadius: AppSpacing.borderRadiusChip,
          border: isToday
              ? Border.all(color: AppColors.primary, width: 1.8)
              : (isSelected
                  ? Border.all(color: AppColors.secondary, width: 1.5)
                  : null),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              '$dayNumber',
              style: AppTypography.tabular(
                fontSize: 13.0,
                fontWeight: isToday || isSelected ? FontWeight.w800 : FontWeight.w600,
                color: isToday ? AppColors.primary : textColor,
              ),
            ),
            const SizedBox(height: 2.0),
            if (dotColor != null)
              Container(
                width: 5.0,
                height: 5.0,
                decoration: BoxDecoration(
                  color: dotColor,
                  shape: BoxShape.circle,
                ),
              )
            else
              const SizedBox(height: 5.0),
          ],
        ),
      ),
    );
  }
}

class _CalendarLegend extends StatelessWidget {
  const _CalendarLegend();

  @override
  Widget build(BuildContext context) {
    return const Wrap(
      spacing: AppSpacing.md,
      runSpacing: AppSpacing.xs,
      alignment: WrapAlignment.center,
      children: [
        _LegendItem(color: AppColors.success, label: 'Present'),
        _LegendItem(color: AppColors.warning, label: 'Late'),
        _LegendItem(color: AppColors.secondary, label: 'Half Day'),
        _LegendItem(color: AppColors.error, label: 'Absent'),
        _LegendItem(color: AppColors.cardBorder, label: 'Weekly Off'),
      ],
    );
  }
}

class _LegendItem extends StatelessWidget {
  const _LegendItem({
    required this.color,
    required this.label,
  });

  final Color color;
  final String label;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 8.0,
          height: 8.0,
          decoration: BoxDecoration(
            color: color,
            shape: BoxShape.circle,
          ),
        ),
        const SizedBox(width: 4.0),
        Text(
          label,
          style: theme.textTheme.labelMedium?.copyWith(
            fontSize: 11.0,
            color: AppColors.textMuted,
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }
}
