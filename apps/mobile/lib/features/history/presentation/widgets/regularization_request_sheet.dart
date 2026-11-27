import 'package:flutter/material.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../core/utils/date_formatters.dart';
import '../../../../core/widgets/primary_button.dart';

class RegularizationRequestSheet extends StatefulWidget {
  const RegularizationRequestSheet({
    required this.date,
    super.key,
  });

  final DateTime date;

  static Future<void> show(
    BuildContext context, {
    required DateTime date,
  }) {
    return showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.card,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(
          top: Radius.circular(AppSpacing.radiusCard),
        ),
      ),
      builder: (context) => RegularizationRequestSheet(date: date),
    );
  }

  @override
  State<RegularizationRequestSheet> createState() =>
      _RegularizationRequestSheetState();
}

class _RegularizationRequestSheetState
    extends State<RegularizationRequestSheet> {
  final _noteController = TextEditingController();
  String _selectedReason = 'Forgot to punch out';
  final String _requestedInTime = '09:00 AM';
  final String _requestedOutTime = '06:00 PM';
  bool _isSubmitting = false;

  final List<String> _reasons = [
    'Forgot to punch out',
    'Forgot to punch in',
    'Technical / App glitch',
    'Onsite field duty / Yard visit',
    'Missed both In and Out',
  ];

  @override
  void dispose() {
    _noteController.dispose();
    super.dispose();
  }

  void _handleSubmit() {
    setState(() => _isSubmitting = true);

    Future.delayed(const Duration(milliseconds: 600), () {
      if (!mounted) return;
      Navigator.of(context).pop();

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'Regularization request submitted for ${DateFormatters.formatDate(widget.date)}',
          ),
          backgroundColor: AppColors.success,
          behavior: SnackBarBehavior.floating,
        ),
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final dateStr = DateFormatters.formatDate(widget.date);

    return Padding(
      padding: EdgeInsets.only(
        left: AppSpacing.lg,
        right: AppSpacing.lg,
        top: AppSpacing.lg,
        bottom: MediaQuery.of(context).viewInsets.bottom + AppSpacing.lg,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Drag handle
          Center(
            child: Container(
              width: 36.0,
              height: 4.0,
              decoration: const BoxDecoration(
                color: AppColors.divider,
                borderRadius: AppSpacing.borderRadiusPill,
              ),
            ),
          ),
          const SizedBox(height: AppSpacing.md),

          // Title & Date
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Request Regularization',
                    style: theme.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w700,
                      color: AppColors.text,
                    ),
                  ),
                  Text(
                    dateStr,
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: AppColors.textMuted,
                      fontSize: 12.5,
                    ),
                  ),
                ],
              ),
              IconButton(
                icon: const Icon(Icons.close_rounded, size: 20.0),
                onPressed: () => Navigator.of(context).pop(),
                tooltip: 'Close',
              ),
            ],
          ),

          const SizedBox(height: AppSpacing.md),
          const Divider(color: AppColors.divider, height: 1.0),
          const SizedBox(height: AppSpacing.md),

          // Reason Selector
          Text(
            'Reason for Regularization',
            style: theme.textTheme.labelMedium?.copyWith(
              fontWeight: FontWeight.w700,
              color: AppColors.text,
            ),
          ),
          const SizedBox(height: AppSpacing.xs),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: AppSpacing.borderRadiusInput,
              border: Border.all(color: AppColors.cardBorder),
            ),
            child: DropdownButtonHideUnderline(
              child: DropdownButton<String>(
                value: _selectedReason,
                isExpanded: true,
                icon: const Icon(Icons.arrow_drop_down_rounded),
                items: _reasons.map((r) {
                  return DropdownMenuItem<String>(
                    value: r,
                    child: Text(
                      r,
                      style: theme.textTheme.bodyMedium?.copyWith(
                        fontSize: 13.5,
                      ),
                    ),
                  );
                }).toList(),
                onChanged: (val) {
                  if (val != null) setState(() => _selectedReason = val);
                },
              ),
            ),
          ),

          const SizedBox(height: AppSpacing.md),

          // Requested Times Row
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Requested In Time',
                      style: theme.textTheme.labelMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                        color: AppColors.textMuted,
                      ),
                    ),
                    const SizedBox(height: 4.0),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: AppSpacing.md,
                        vertical: AppSpacing.sm,
                      ),
                      decoration: BoxDecoration(
                        color: AppColors.surface,
                        borderRadius: AppSpacing.borderRadiusInput,
                        border: Border.all(color: AppColors.cardBorder),
                      ),
                      child: Text(
                        _requestedInTime,
                        style: theme.textTheme.bodyMedium?.copyWith(
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Requested Out Time',
                      style: theme.textTheme.labelMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                        color: AppColors.textMuted,
                      ),
                    ),
                    const SizedBox(height: 4.0),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: AppSpacing.md,
                        vertical: AppSpacing.sm,
                      ),
                      decoration: BoxDecoration(
                        color: AppColors.surface,
                        borderRadius: AppSpacing.borderRadiusInput,
                        border: Border.all(color: AppColors.cardBorder),
                      ),
                      child: Text(
                        _requestedOutTime,
                        style: theme.textTheme.bodyMedium?.copyWith(
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),

          const SizedBox(height: AppSpacing.md),

          // Remarks / Explanation
          Text(
            'Remarks / Notes',
            style: theme.textTheme.labelMedium?.copyWith(
              fontWeight: FontWeight.w700,
              color: AppColors.text,
            ),
          ),
          const SizedBox(height: AppSpacing.xs),
          TextField(
            controller: _noteController,
            maxLines: 2,
            decoration: InputDecoration(
              hintText: 'Provide additional details for your supervisor...',
              hintStyle: theme.textTheme.bodyMedium?.copyWith(
                color: AppColors.textMuted,
                fontSize: 12.5,
              ),
              filled: true,
              fillColor: AppColors.surface,
              border: const OutlineInputBorder(
                borderRadius: AppSpacing.borderRadiusInput,
                borderSide: BorderSide(color: AppColors.cardBorder),
              ),
              enabledBorder: const OutlineInputBorder(
                borderRadius: AppSpacing.borderRadiusInput,
                borderSide: BorderSide(color: AppColors.cardBorder),
              ),
              focusedBorder: const OutlineInputBorder(
                borderRadius: AppSpacing.borderRadiusInput,
                borderSide: BorderSide(color: AppColors.primary),
              ),
            ),
          ),

          const SizedBox(height: AppSpacing.lg),

          // Submit Button
          PrimaryButton(
            text: 'Submit Regularization Request',
            isLoading: _isSubmitting,
            onPressed: _handleSubmit,
          ),
        ],
      ),
    );
  }
}
