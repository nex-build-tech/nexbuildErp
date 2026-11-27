import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseService } from '../database/database.service';
import { roles, permissions, rolePermissions, users } from '../database/schema';
import { eq, and, asc, sql, inArray } from 'drizzle-orm';

export interface CreateRoleDto {
  name: string;
  code: string;
  description?: string;
  permissions?: string[];
}

export interface UpdateRoleDto {
  name?: string;
  description?: string;
  permissions?: string[];
}

@Injectable()
export class RolesService {
  constructor(private readonly dbService: DatabaseService) {}

  /**
   * List all roles for tenant (or all if super_admin) with user & permission counts
   */
  async getRoles(tenantId: number, isSuperAdmin: boolean = false) {
    const rolesList = await this.dbService.db
      .select({
        id: roles.id,
        uuid: roles.uuid,
        tenantId: roles.tenantId,
        code: roles.code,
        name: roles.name,
        description: roles.description,
        isSystem: roles.isSystem,
        createdAt: roles.createdAt,
        updatedAt: roles.updatedAt,
      })
      .from(roles)
      .where(isSuperAdmin ? undefined : eq(roles.tenantId, tenantId))
      .orderBy(asc(roles.name));

    // Get user counts per role
    const userCounts = await this.dbService.db
      .select({
        roleId: users.roleId,
        count: sql<number>`count(*)`.as('count'),
      })
      .from(users)
      .groupBy(users.roleId);

    const userCountMap = new Map<number, number>(
      userCounts.map((u) => [Number(u.roleId), Number(u.count)]),
    );

    // Get permission counts per role
    const permCounts = await this.dbService.db
      .select({
        roleId: rolePermissions.roleId,
        count: sql<number>`count(*)`.as('count'),
      })
      .from(rolePermissions)
      .groupBy(rolePermissions.roleId);

    const permCountMap = new Map<number, number>(
      permCounts.map((p) => [Number(p.roleId), Number(p.count)]),
    );

    return rolesList.map((r) => ({
      ...r,
      userCount: userCountMap.get(r.id) || 0,
      permissionCount: permCountMap.get(r.id) || 0,
    }));
  }

  /**
   * Get all system permissions grouped by module
   */
  async getAllPermissions() {
    const allPerms = await this.dbService.db
      .select({
        id: permissions.id,
        code: permissions.code,
        module: permissions.module,
        action: permissions.action,
        description: permissions.description,
      })
      .from(permissions)
      .orderBy(asc(permissions.module), asc(permissions.action));

    // Group by module
    const grouped: Record<string, typeof allPerms> = {};
    for (const p of allPerms) {
      const mod = p.module.toUpperCase();
      if (!grouped[mod]) grouped[mod] = [];
      grouped[mod].push(p);
    }

    return {
      total: allPerms.length,
      grouped,
      all: allPerms,
    };
  }

  /**
   * Get single role details with list of assigned permission codes
   */
  async getRoleById(tenantId: number, roleId: number, isSuperAdmin: boolean = false) {
    const [role] = await this.dbService.db
      .select()
      .from(roles)
      .where(
        isSuperAdmin
          ? eq(roles.id, roleId)
          : and(eq(roles.id, roleId), eq(roles.tenantId, tenantId)),
      )
      .limit(1);

    if (!role) {
      throw new NotFoundException(`Role with ID ${roleId} not found`);
    }

    // Fetch assigned permissions
    const assigned = await this.dbService.db
      .select({
        id: permissions.id,
        code: permissions.code,
        module: permissions.module,
        action: permissions.action,
        description: permissions.description,
      })
      .from(rolePermissions)
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(rolePermissions.roleId, roleId));

    return {
      ...role,
      permissions: assigned.map((p) => p.code),
      permissionDetails: assigned,
    };
  }

  /**
   * Create custom role for tenant
   */
  async createRole(tenantId: number, dto: CreateRoleDto) {
    const cleanCode = dto.code
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_');

    // Check code uniqueness within tenant
    const existing = await this.dbService.db
      .select({ id: roles.id })
      .from(roles)
      .where(and(eq(roles.tenantId, tenantId), eq(roles.code, cleanCode)))
      .limit(1);

    if (existing.length > 0) {
      throw new BadRequestException(
        `Role with code '${cleanCode}' already exists for this tenant.`,
      );
    }

    const uuid = uuidv4();
    await this.dbService.db.insert(roles).values({
      uuid,
      tenantId,
      name: dto.name.trim(),
      code: cleanCode,
      description: dto.description || null,
      isSystem: false,
    });

    const [created] = await this.dbService.db
      .select()
      .from(roles)
      .where(eq(roles.uuid, uuid))
      .limit(1);

    if (!created) {
      throw new BadRequestException('Failed to create role');
    }

    // Map permissions
    if (dto.permissions && dto.permissions.length > 0) {
      await this.syncRolePermissions(created.id, dto.permissions);
    }

    return this.getRoleById(tenantId, created.id);
  }

  /**
   * Update role details and assigned permissions
   */
  async updateRole(
    tenantId: number,
    roleId: number,
    dto: UpdateRoleDto,
    isSuperAdmin: boolean = false,
  ) {
    const [existing] = await this.dbService.db
      .select()
      .from(roles)
      .where(
        isSuperAdmin
          ? eq(roles.id, roleId)
          : and(eq(roles.id, roleId), eq(roles.tenantId, tenantId)),
      )
      .limit(1);

    if (!existing) {
      throw new NotFoundException(`Role with ID ${roleId} not found`);
    }

    const updatePayload: Record<string, any> = { updatedAt: new Date() };
    if (dto.name !== undefined) updatePayload.name = dto.name.trim();
    if (dto.description !== undefined) updatePayload.description = dto.description;

    await this.dbService.db
      .update(roles)
      .set(updatePayload)
      .where(eq(roles.id, roleId));

    if (dto.permissions !== undefined) {
      await this.syncRolePermissions(roleId, dto.permissions);
    }

    return this.getRoleById(tenantId, roleId, isSuperAdmin);
  }

  /**
   * Delete custom role
   */
  async deleteRole(tenantId: number, roleId: number, isSuperAdmin: boolean = false) {
    const [existing] = await this.dbService.db
      .select()
      .from(roles)
      .where(
        isSuperAdmin
          ? eq(roles.id, roleId)
          : and(eq(roles.id, roleId), eq(roles.tenantId, tenantId)),
      )
      .limit(1);

    if (!existing) {
      throw new NotFoundException(`Role with ID ${roleId} not found`);
    }

    if (existing.isSystem) {
      throw new BadRequestException('Standard system roles cannot be deleted.');
    }

    // Check if any users are currently assigned to this role
    const assignedUsers = await this.dbService.db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.roleId, roleId))
      .limit(1);

    if (assignedUsers.length > 0) {
      throw new BadRequestException(
        'Cannot delete role: active users are assigned to this role. Please reassign them first.',
      );
    }

    // Delete permissions mapping
    await this.dbService.db
      .delete(rolePermissions)
      .where(eq(rolePermissions.roleId, roleId));

    // Delete role
    await this.dbService.db.delete(roles).where(eq(roles.id, roleId));

    return { success: true, message: `Role '${existing.name}' deleted successfully.` };
  }

  /**
   * Sync permission codes to rolePermissions table
   */
  private async syncRolePermissions(roleId: number, permCodes: string[]) {
    // Delete existing
    await this.dbService.db
      .delete(rolePermissions)
      .where(eq(rolePermissions.roleId, roleId));

    if (permCodes.length === 0) return;

    // Resolve IDs
    const matchedPerms = await this.dbService.db
      .select({ id: permissions.id })
      .from(permissions)
      .where(inArray(permissions.code, permCodes));

    for (const p of matchedPerms) {
      await this.dbService.db.insert(rolePermissions).values({
        roleId,
        permissionId: p.id,
      });
    }
  }
}
