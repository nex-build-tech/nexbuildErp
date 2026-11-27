import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class SuperAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    // Strictly enforce super_admin role
    if (user.roleCode !== 'super_admin') {
      throw new ForbiddenException(
        `Access denied: Platform SuperAdmin role required. Your current role is '${user.roleCode || 'unknown'}'.`
      );
    }

    return true;
  }
}
