import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
  ParseIntPipe,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesService, CreateRoleDto, UpdateRoleDto } from './roles.service';

interface AuthenticatedRequest {
  user: {
    tenantId: number;
    userId: number;
    email: string;
    roleCode?: string;
    roles?: string[];
  };
}

@ApiTags('roles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  /**
   * Helper to verify caller is super_admin or admin
   */
  private checkAdminAccess(req: AuthenticatedRequest) {
    const roleCode = (req.user?.roleCode || '').toLowerCase();
    const isAllowed =
      roleCode === 'super_admin' ||
      roleCode === 'admin' ||
      roleCode === 'boss' ||
      (req.user?.roles &&
        req.user.roles.some((r) => ['super_admin', 'admin', 'boss'].includes(r.toLowerCase())));

    if (!isAllowed) {
      throw new ForbiddenException(
        'Access Denied: Only Platform Super Admin and Tenant Administrators can manage roles and permissions.',
      );
    }
    return roleCode === 'super_admin';
  }

  @Get()
  @ApiOperation({ summary: 'List all roles with user count and permission count (Admin only)' })
  async getRoles(@Req() req: AuthenticatedRequest) {
    const isSuperAdmin = this.checkAdminAccess(req);
    return this.rolesService.getRoles(req.user.tenantId, isSuperAdmin);
  }

  @Get('permissions')
  @ApiOperation({ summary: 'List all system permissions grouped by module (Admin only)' })
  async getAllPermissions(@Req() req: AuthenticatedRequest) {
    this.checkAdminAccess(req);
    return this.rolesService.getAllPermissions();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get details of a role with assigned permission codes (Admin only)' })
  async getRoleById(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const isSuperAdmin = this.checkAdminAccess(req);
    return this.rolesService.getRoleById(req.user.tenantId, id, isSuperAdmin);
  }

  @Post()
  @ApiOperation({ summary: 'Create new custom role for tenant (Admin only)' })
  async createRole(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateRoleDto,
  ) {
    this.checkAdminAccess(req);
    return this.rolesService.createRole(req.user.tenantId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update role details or assigned permissions (Admin only)' })
  async updateRole(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRoleDto,
  ) {
    const isSuperAdmin = this.checkAdminAccess(req);
    return this.rolesService.updateRole(req.user.tenantId, id, dto, isSuperAdmin);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete custom role (Admin only)' })
  async deleteRole(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const isSuperAdmin = this.checkAdminAccess(req);
    return this.rolesService.deleteRole(req.user.tenantId, id, isSuperAdmin);
  }
}
