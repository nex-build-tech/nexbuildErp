import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRE_MODULE_KEY } from '../decorators/require-module.decorator';
import { DatabaseService } from '../../../database/database.service';
import { tenantModules } from '../../../database/schema';
import { and, eq } from 'drizzle-orm';

@Injectable()
export class RequireModuleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly databaseService: DatabaseService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const moduleCode = this.reflector.getAllAndOverride<string | undefined>(
      REQUIRE_MODULE_KEY,
      [context.getHandler(), context.getClass()],
    );

    // No module restriction — allow through
    if (!moduleCode) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      user?: { roleCode?: string };
      tenant?: { id?: number };
    }>();

    const user = request.user;
    const tenant = request.tenant;

    // boss / admin bypass the module check
    if (user?.roleCode === 'boss' || user?.roleCode === 'admin') {
      return true;
    }

    if (!tenant?.id) {
      throw new ForbiddenException('Tenant context is missing.');
    }

    const [row] = await this.databaseService.db
      .select()
      .from(tenantModules)
      .where(
        and(
          eq(tenantModules.tenantId, tenant.id),
          eq(tenantModules.moduleCode, moduleCode),
        ),
      )
      .limit(1);

    if (!row || !row.enabled) {
      throw new ForbiddenException(
        `Module '${moduleCode}' is not enabled for this tenant.`,
      );
    }

    return true;
  }
}
