import 'package:flutter/material.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../app/theme/app_typography.dart';
import '../../../../core/utils/date_formatters.dart';
import '../../../../data/models/punch.dart';
import '../../../../data/models/work_location.dart';
import '../../../../data/models/work_session.dart';
import 'timeline_punch_item.dart';

class SessionCardTimeline extends StatelessWidget {
  const SessionCardTimeline({
    required this.sessionNumber,
    required this.session,
    required this.allPunches,
    this.location,
    super.key,
  });

  final int sessionNumber;
  final WorkSession session;
  final List<Punch> allPunches;
  final WorkLocation? location;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isRunning = session.isRunning;
    final durationStr = DateFormatters.formatDuration(session.duration);

    // Find the matching In punch
    final inPunch = allPunches.firstWhere(
      (p) =>
          p.punchType == PunchType.punchIn &&
          p.timestamp.millisecondsSinceEpoch ==
              session.inTime.millisecondsSinceEpoch,
      orElse: () => Punch(
        id: 'in_$sessionNumber',
        employeeId: 'emp',
        locationId: session.locationId,
        punchType: PunchType.punchIn,
        timestamp: session.inTime,
        latitude: location?.latitude ?? 18.5204,
        longitude: location?.longitude ?? 73.8567,
        distanceFromCenterM: 40.0,
      ),
    );

    // Find the matching Out punch (if closed)
    Punch? outPunch;
    if (session.outTime != null) {
      outPunch = allPunches.firstWhere(
        (p) =>
            p.punchType == PunchType.punchOut &&
            p.timestamp.millisecondsSinceEpoch ==
                session.outTime!.millisecondsSinceEpoch,
        orElse: () => Punch(
          id: 'out_$sessionNumber',
          employeeId: 'emp',
          locationId: session.locationId,
          punchType: PunchType.punchOut,
          timestamp: session.outTime!,
          latitude: location?.latitude ?? 18.5204,
          longitude: location?.longitude ?? 73.8567,
          distanceFromCenterM: 42.0,
          note: session.note,
          isAutoClosed: session.isAutoClosed,
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Session Header Row
        Padding(
          padding: const EdgeInsets.symmetric(vertical: AppSpacing.xs),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(
                    width: 8.0,
                    height: 8.0,
                    decoration: BoxDecoration(
                      color: isRunning ? AppColors.secondary : AppColors.primary,
                      shape: BoxShape.circle,
                    ),
                  ),
                  const SizedBox(width: AppSpacing.xs),
                  Text(
                    'SESSION $sessionNumber',
                    style: theme.textTheme.labelMedium?.copyWith(
                      fontWeight: FontWeight.w800,
                      color: AppColors.text,
                      letterSpacing: 0.8,
                    ),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: AppSpacing.sm,
                  vertical: 3.0,
                ),
                decoration: BoxDecoration(
                  color: isRunning
                      ? AppColors.successContainer
                      : AppColors.surface,
                  borderRadius: AppSpacing.borderRadiusPill,
                  border: Border.all(
                    color: isRunning
                        ? AppColors.success
                        : AppColors.cardBorder,
                    width: 1.0,
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    if (isRunning) ...[
                      const Icon(
                        Icons.timelapse_rounded,
                        size: 13.0,
                        color: AppColors.success,
                      ),
                      const SizedBox(width: 4.0),
                      Text(
                        'Running · $durationStr',
                        style: AppTypography.tabular(
                          fontSize: 11.5,
                          fontWeight: FontWeight.w700,
                          color: AppColors.success,
                        ),
                      ),
                    ] else
                      Text(
                        durationStr,
                        style: AppTypography.tabular(
                          fontSize: 11.5,
                          fontWeight: FontWeight.w700,
                          color: AppColors.text,
                        ),
                      ),
                  ],
                ),
              ),
            ],
          ),
        ),

        // 1. Punch In item
        TimelinePunchItem(
          punch: inPunch,
          location: location,
          isFirstInSession: true,
          isLastInSession: outPunch == null,
        ),

        // 2. Punch Out item (or running state)
        if (outPunch != null)
          TimelinePunchItem(
            punch: outPunch,
            location: location,
            isFirstInSession: false,
            isLastInSession: true,
          ),
      ],
    );
  }
}
