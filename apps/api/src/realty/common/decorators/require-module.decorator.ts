import { SetMetadata } from '@nestjs/common';

export const REQUIRE_MODULE_KEY = 'requireModule';

/**
 * Marks a controller or handler as requiring a specific tenant module to be enabled.
 * Use with @UseGuards(RequireModuleGuard).
 *
 * @example
 * @RequireModule('REALTY_SALES')
 * @Controller('realty/inventory')
 */
export const RequireModule = (moduleCode: string) =>
  SetMetadata(REQUIRE_MODULE_KEY, moduleCode);
