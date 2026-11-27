import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import {
  tenants,
  users,
  roles,
  sites,
  purchaseOrders,
  permissions,
  rolePermissions,
  units,
  tenantModules,
} from '../database/schema';
import { eq, desc, sql, count, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';

export interface CreateTenantDto {
  name: string;
  slug: string;
  plan?: string;
  gstin?: string;
  pan?: string;
  stateCode?: string;
  address?: string;
  primaryColor?: string;
  tagline?: string;
  logoUrl?: string;
  adminUsername: string;
  adminEmail: string;
  adminPassword?: string;
}

export interface UpdateBrandingDto {
  name?: string;
  primaryColor?: string;
  logoUrl?: string;
  tagline?: string;
  branding?: string;
}

@Injectable()
export class SuperAdminService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * List all onboarded tenants with real-time platform metrics
   */
  async getAllTenants() {
    const tenantList = await this.databaseService.db
      .select()
      .from(tenants)
      .orderBy(desc(tenants.createdAt));

    // Aggregate counts per tenant
    const enriched = await Promise.all(
      tenantList.map(async (t) => {
        const [siteCountRes] = await this.databaseService.db
          .select({ val: count() })
          .from(sites)
          .where(eq(sites.tenantId, t.id));

        const [userCountRes] = await this.databaseService.db
          .select({ val: count() })
          .from(users)
          .where(eq(users.tenantId, t.id));

        const [poCountRes] = await this.databaseService.db
          .select({ val: count() })
          .from(purchaseOrders)
          .where(eq(purchaseOrders.tenantId, t.id));

        const modules = await this.databaseService.db
          .select()
          .from(tenantModules)
          .where(eq(tenantModules.tenantId, t.id));

        return {
          id: t.id,
          uuid: t.uuid,
          name: t.name,
          slug: t.slug,
          status: t.status,
          plan: t.plan,
          gstin: t.gstin,
          pan: t.pan,
          stateCode: t.stateCode,
          address: t.address,
          primaryColor: t.primaryColor || '#c5a04e',
          logoUrl: t.logoUrl,
          tagline: t.tagline,
          mfaEnabled: t.mfaEnabled,
          createdAt: t.createdAt,
          modules: modules.map((m) => ({ moduleCode: m.moduleCode, enabled: m.enabled })),
          metrics: {
            sitesCount: Number(siteCountRes?.val || 0),
            usersCount: Number(userCountRes?.val || 0),
            posCount: Number(poCountRes?.val || 0),
          },
        };
      }),
    );

    return enriched;
  }

  /**
   * Get single tenant details
   */
  async getTenantById(id: number) {
    const [t] = await this.databaseService.db
      .select()
      .from(tenants)
      .where(eq(tenants.id, id))
      .limit(1);

    if (!t) {
      throw new NotFoundException(`Tenant with ID ${id} not found.`);
    }

    const tenantUsers = await this.databaseService.db
      .select({
        id: users.id,
        username: users.username,
        fullName: users.fullName,
        email: users.email,
        phone: users.phone,
        status: users.status,
      })
      .from(users)
      .where(eq(users.tenantId, t.id));

    return {
      ...t,
      users: tenantUsers,
    };
  }

  /**
   * Create a new tenant & provision initial roles and admin user
   */
  async createTenant(dto: CreateTenantDto) {
    const cleanSlug = dto.slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, '');

    // Check slug uniqueness
    const [existing] = await this.databaseService.db
      .select({ id: tenants.id })
      .from(tenants)
      .where(eq(tenants.slug, cleanSlug))
      .limit(1);

    if (existing) {
      throw new BadRequestException(`Tenant subdomain slug '${cleanSlug}' is already taken.`);
    }

    const tenantUuid = uuidv4();
    const primaryColor = dto.primaryColor || '#c5a04e';

    // 1. Insert tenant
    await this.databaseService.db.insert(tenants).values({
      uuid: tenantUuid,
      name: dto.name,
      slug: cleanSlug,
      status: 'active',
      plan: dto.plan || 'enterprise',
      gstin: dto.gstin || null,
      pan: dto.pan || null,
      stateCode: dto.stateCode || '27',
      address: dto.address || null,
      primaryColor,
      tagline: dto.tagline || 'Builders & Developers',
      logoUrl: dto.logoUrl || null,
    });

    const [created] = await this.databaseService.db
      .select()
      .from(tenants)
      .where(eq(tenants.uuid, tenantUuid))
      .limit(1);

    if (!created) {
      throw new BadRequestException('Failed to create tenant.');
    }

    // 2. Provision default roles for this new tenant
    const defaultRoles = [
      { code: 'boss', name: 'Owner / Boss', description: 'Complete executive control' },
      { code: 'admin', name: 'Administrator', description: 'Tenant configuration & users' },
      { code: 'store', name: 'Store Manager', description: 'Store inventory & GRN' },
      { code: 'purchase', name: 'Purchase Manager', description: 'RFQs & Purchase Orders' },
      { code: 'sitemgr', name: 'Site Incharge', description: 'Site indents & DPR' },
    ];

    const seededRoleIds: Record<string, number> = {};
    for (const r of defaultRoles) {
      await this.databaseService.db.insert(roles).values({
        uuid: uuidv4(),
        tenantId: created.id,
        name: r.name,
        code: r.code,
        description: r.description,
        isSystem: true,
      });

      const [rRow] = await this.databaseService.db
        .select({ id: roles.id })
        .from(roles)
        .where(sql`${roles.tenantId} = ${created.id} AND ${roles.code} = ${r.code}`)
        .limit(1);

      if (rRow) seededRoleIds[r.code] = rRow.id;
    }

    // 3. Map all system permissions to boss role
    const allPerms = await this.databaseService.db.select({ id: permissions.id }).from(permissions);
    if (seededRoleIds['boss'] && allPerms.length > 0) {
      for (const p of allPerms) {
        await this.databaseService.db.insert(rolePermissions).values({
          roleId: seededRoleIds['boss'],
          permissionId: p.id,
        });
      }
    }

    // 4. Create initial Admin user
    const password = dto.adminPassword || 'Admin123!';
    const passwordHash = await bcrypt.hash(password, 10);
    const adminRoleId = seededRoleIds['boss'] || seededRoleIds['admin'] || 1;

    await this.databaseService.db.insert(users).values({
      uuid: uuidv4(),
      tenantId: created.id,
      roleId: adminRoleId,
      username: dto.adminUsername.trim(),
      email: dto.adminEmail.trim(),
      passwordHash,
      fullName: `${dto.name} Director`,
      status: 'active',
    });

    // 5. Seed default Indian Units of Measure
    const unitDefs = [
      { code: 'BAG', name: 'Bags', symbol: 'bag' },
      { code: 'MT', name: 'Metric Ton', symbol: 'mt' },
      { code: 'KG', name: 'Kilograms', symbol: 'kg' },
      { code: 'LTR', name: 'Litres', symbol: 'ltr' },
      { code: 'PCS', name: 'Pieces', symbol: 'pcs' },
      { code: 'SQFT', name: 'Square Feet', symbol: 'sq.ft' },
      { code: 'CU.M', name: 'Cubic Metre', symbol: 'cu.m' },
      { code: 'SQ.M', name: 'Square Metre', symbol: 'sq.m' },
    ];
    for (const u of unitDefs) {
      await this.databaseService.db.insert(units).values({
        uuid: uuidv4(),
        tenantId: created.id,
        code: u.code,
        name: u.name,
        symbol: u.symbol,
      });
    }

    return {
      tenant: created,
      initialAdmin: {
        username: dto.adminUsername,
        temporaryPassword: password,
      },
    };
  }

  /**
   * Update Tenant Branding & Primary Theme Palette
   */
  async updateTenantBranding(id: number, dto: UpdateBrandingDto) {
    const [existing] = await this.databaseService.db
      .select()
      .from(tenants)
      .where(eq(tenants.id, id))
      .limit(1);

    if (!existing) {
      throw new NotFoundException(`Tenant with ID ${id} not found.`);
    }

    const updates: Partial<typeof tenants.$inferInsert> = {};
    if (dto.name !== undefined) updates.name = dto.name;
    if (dto.primaryColor !== undefined) updates.primaryColor = dto.primaryColor;
    if (dto.logoUrl !== undefined) updates.logoUrl = dto.logoUrl;
    if (dto.tagline !== undefined) updates.tagline = dto.tagline;
    if (dto.branding !== undefined) updates.branding = dto.branding;

    await this.databaseService.db
      .update(tenants)
      .set(updates)
      .where(eq(tenants.id, id));

    const [updated] = await this.databaseService.db
      .select()
      .from(tenants)
      .where(eq(tenants.id, id))
      .limit(1);

    return updated;
  }

  /**
   * Update Tenant Lifecycle Status
   */
  async updateTenantStatus(id: number, status: 'trial' | 'active' | 'suspended' | 'cancelled') {
    await this.databaseService.db
      .update(tenants)
      .set({ status })
      .where(eq(tenants.id, id));

    return { success: true, status };
  }

  /**
   * 1-Click Tenant Impersonation Token for SuperAdmin
   */
  async impersonateTenant(tenantId: number) {
    const [tenant] = await this.databaseService.db
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);

    if (!tenant) {
      throw new NotFoundException('Target tenant not found.');
    }

    // Find first boss or admin user of this tenant
    const [targetUser] = await this.databaseService.db
      .select({
        id: users.id,
        uuid: users.uuid,
        username: users.username,
        fullName: users.fullName,
        email: users.email,
        phone: users.phone,
        avatarUrl: users.avatarUrl,
        roleId: users.roleId,
        totpEnabled: users.totpEnabled,
      })
      .from(users)
      .where(eq(users.tenantId, tenant.id))
      .limit(1);

    if (!targetUser) {
      throw new BadRequestException('Target tenant has no active administrative users.');
    }

    const [role] = await this.databaseService.db
      .select({ id: roles.id, code: roles.code, name: roles.name })
      .from(roles)
      .where(eq(roles.id, targetUser.roleId))
      .limit(1);

    const roleCode = role?.code || 'boss';

    // Generate JWT access token scoped to this tenant
    const payload = {
      sub: targetUser.id,
      uuid: targetUser.uuid,
      username: targetUser.username,
      roleCode,
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
      isImpersonation: true,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: '2h',
    });

    return {
      accessToken,
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        plan: tenant.plan,
        primaryColor: tenant.primaryColor,
        logoUrl: tenant.logoUrl,
      },
      user: {
        ...targetUser,
        role: {
          id: role?.id || 1,
          code: roleCode,
          name: role?.name || 'Owner / Boss',
        },
      },
    };
  }

  /**
   * Get all enabled/disabled feature modules for a tenant
   */
  async getTenantModules(tenantId: number) {
    const list = await this.databaseService.db
      .select()
      .from(tenantModules)
      .where(eq(tenantModules.tenantId, tenantId));
    return list;
  }

  /**
   * Toggle or update modules for a tenant
   */
  async updateTenantModules(
    tenantId: number,
    modules: { moduleCode: string; enabled: boolean }[],
  ) {
    for (const m of modules) {
      const existing = await this.databaseService.db
        .select()
        .from(tenantModules)
        .where(
          and(
            eq(tenantModules.tenantId, tenantId),
            eq(tenantModules.moduleCode, m.moduleCode),
          ),
        )
        .limit(1);

      if (existing.length > 0 && existing[0]) {
        await this.databaseService.db
          .update(tenantModules)
          .set({ enabled: m.enabled })
          .where(eq(tenantModules.id, existing[0].id));
      } else {
        await this.databaseService.db.insert(tenantModules).values({
          tenantId,
          moduleCode: m.moduleCode,
          enabled: m.enabled,
        });
      }
    }
    return this.getTenantModules(tenantId);
  }
}
