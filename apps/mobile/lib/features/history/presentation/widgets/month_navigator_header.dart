import 'package:flutter/material.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../core/utils/date_formatters.dart';

class MonthNavigatorHeader extends StatelessWidget {
  const MonthNavigatorHeader({
    required this.selectedMonth,
    required this.canGoNext,
    required this.canGoPrev,
    required this.onPrevious,
    required this.onNext,
    this.totalHours,
    super.key,
  });

  final DateTime selectedMonth;
  final bool canGoNext;
  final bool canGoPrev;
  final VoidCallback onPrevious;
  final VoidCallback onNext;
  final Duration? totalHours;

  static const List<String> _monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final monthName = _monthNames[selectedMonth.month - 1];
    final year = selectedMonth.year;
    final title = '$monthName $year';

    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.sm,
        vertical: AppSpacing.xs,
      ),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: AppSpacing.borderRadiusCard,
        border: Border.all(color: AppColors.cardBorder),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          // Previous Month button
          IconButton(
            icon: const Icon(Icons.chevron_left_rounded),
            tooltip: 'Previous month',
            color: canGoPrev ? AppColors.text : AppColors.textMuted.withValues(alpha: 0.3),
            onPressed: canGoPrev ? onPrevious : null,
          ),

          // Month title & optional hours subtitle
          Expanded(
            child: Column(
              children: [
                Text(
                  title,
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w800,
                    color: AppColors.primary,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
                if (totalHours != null && totalHours! > Duration.zero) ...[
                  const SizedBox(height: 2.0),
                  Text(
                    '${DateFormatters.formatDuration(totalHours!)} total worked',
                    style: theme.textTheme.labelMedium?.copyWith(
                      color: AppColors.textMuted,
                      fontWeight: FontWeight.w600,
                      fontSize: 11.5,
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ],
            ),
          ),

          // Next Month button (blocked if on current month)
          IconButton(
            icon: const Icon(Icons.chevron_right_rounded),
            tooltip: canGoNext ? 'Next month' : 'Future months not available',
            color: canGoNext ? AppColors.text : AppColors.textMuted.withValues(alpha: 0.3),
            onPressed: canGoNext ? onNext : null,
          ),
        ],
      ),
    );
  }
}
