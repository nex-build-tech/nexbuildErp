import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';

/**
 * SalesHeadGuard
 *
 * Restricts an endpoint so that ONLY the Sales Head (and platform-level
 * super-roles) may call it.  Apply this guard alongside PermissionsGuard on
 * every sales-related approval / reject / waive / transfer / cancel action.
 *
 * Allowed role codes:
 *   • sales_head  – primary approver for all sales workflows
 *   • super_admin – platform super-admin
 *   • boss        – owner / MD wildcard
 *   • admin       – tenant admin
 */
@Injectable()
export class SalesHeadGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    const allowedRoles = ['sales_head', 'super_admin', 'boss', 'admin'];

    if (!allowedRoles.includes(user.roleCode)) {
      throw new ForbiddenException(
        `Access denied: Only the Sales Head can perform this approval action. ` +
          `Your current role is '${user.roleCode || 'unknown'}'.`,
      );
    }

    return true;
  }
}
