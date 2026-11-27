import 'package:flutter/material.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../core/widgets/primary_button.dart';

class RequestApprovalSheet extends StatefulWidget {
  const RequestApprovalSheet({
    required this.currentSiteName,
    required this.distanceMeters,
    super.key,
  });

  final String currentSiteName;
  final int distanceMeters;

  static Future<void> show(
    BuildContext context, {
    required String currentSiteName,
    required int distanceMeters,
  }) {
    return showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.card,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(
          top: Radius.circular(AppSpacing.radiusHeroCard),
        ),
      ),
      builder: (context) => RequestApprovalSheet(
        currentSiteName: currentSiteName,
        distanceMeters: distanceMeters,
      ),
    );
  }

  @override
  State<RequestApprovalSheet> createState() => _RequestApprovalSheetState();
}

class _RequestApprovalSheetState extends State<RequestApprovalSheet> {
  final TextEditingController _reasonController = TextEditingController();
  String _selectedReason = 'Material yard visit';
  bool _isSubmitted = false;

  final List<String> _commonReasons = const [
    'Material yard visit',
    'Client / Consultant meeting',
    'Emergency site inspection',
    'Official travel between sites',
    'Other work assignment',
  ];

  @override
  void dispose() {
    _reasonController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Padding(
      padding: EdgeInsets.only(
        left: AppSpacing.screenHorizontal,
        right: AppSpacing.screenHorizontal,
        top: AppSpacing.md,
        bottom: MediaQuery.of(context).viewInsets.bottom + AppSpacing.xl,
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
          const SizedBox(height: AppSpacing.lg),

          Text(
            'Request location approval',
            style: theme.textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: AppSpacing.xs),
          Text(
            "You are currently ${widget.distanceMeters} m outside ${widget.currentSiteName}. Submit a reason to request manager approval for this punch.",
            style: theme.textTheme.bodyMedium?.copyWith(
              color: AppColors.textMuted,
            ),
          ),
          const SizedBox(height: AppSpacing.lg),

          if (_isSubmitted) ...[
            Container(
              padding: const EdgeInsets.all(AppSpacing.md),
              decoration: const BoxDecoration(
                color: AppColors.successContainer,
                borderRadius: AppSpacing.borderRadiusCard,
              ),
              child: Row(
                children: [
                  const Icon(Icons.check_circle, color: AppColors.success),
                  const SizedBox(width: AppSpacing.md),
                  Expanded(
                    child: Text(
                      'Approval request submitted to Project Manager.',
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: AppColors.onSuccessContainer,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: AppSpacing.xl),
            PrimaryButton(
              text: 'Done',
              onPressed: () => Navigator.of(context).pop(),
            ),
          ] else ...[
            Text(
              'Select reason',
              style: theme.textTheme.labelMedium?.copyWith(
                fontWeight: FontWeight.w600,
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
                  icon: const Icon(Icons.keyboard_arrow_down_rounded),
                  items: _commonReasons
                      .map((r) => DropdownMenuItem(value: r, child: Text(r)))
                      .toList(),
                  onChanged: (val) {
                    if (val != null) {
                      setState(() => _selectedReason = val);
                    }
                  },
                ),
              ),
            ),
            const SizedBox(height: AppSpacing.md),

            Text(
              'Additional note (optional)',
              style: theme.textTheme.labelMedium?.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: AppSpacing.xs),
            TextField(
              controller: _reasonController,
              maxLines: 3,
              decoration: const InputDecoration(
                hintText: 'Enter details for your manager...',
                hintStyle: TextStyle(color: AppColors.textHint),
                filled: true,
                fillColor: AppColors.surface,
                border: OutlineInputBorder(
                  borderRadius: AppSpacing.borderRadiusInput,
                  borderSide: BorderSide(color: AppColors.cardBorder),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: AppSpacing.borderRadiusInput,
                  borderSide: BorderSide(color: AppColors.cardBorder),
                ),
              ),
            ),
            const SizedBox(height: AppSpacing.xl),

            PrimaryButton(
              text: 'Submit Request',
              onPressed: () {
                setState(() => _isSubmitted = true);
              },
            ),
          ],
        ],
      ),
    );
  }
}
