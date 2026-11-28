import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { generateSecret, generateURI, verifySync } from 'otplib';
import * as QRCode from 'qrcode';
import { DatabaseService } from '../database/database.service';
import { users, roles, tenants, refreshTokens, auditLogs, rolePermissions, permissions, tenantModules, userSites, sites } from '../database/schema';
import { eq, and, gt, isNull, ne } from 'drizzle-orm';
import { LoginDto, UpdateProfileDto } from './dto/login.dto';
import { TenantContext } from '../common/middleware/tenant.middleware';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(dto: LoginDto, tenant: TenantContext, ipAddress?: string, userAgent?: string) {
    // 1. Find user in the specific tenant
    const [found] = await this.databaseService.db
      .select({
        user: users,
        role: roles,
      })
      .from(users)
      .innerJoin(roles, eq(users.roleId, roles.id))
      .where(
        and(
          eq(users.tenantId, tenant.id),
          eq(users.username, dto.username),
          isNull(users.deletedAt),
        ),
      )
      .limit(1);

    if (!found) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { user, role } = found;

    // 2. Check if account is locked
    if (user.status === 'locked' && user.lockedUntil && new Date() < user.lockedUntil) {
      const waitMinutes = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
      throw new ForbiddenException(`Account is locked due to multiple failed attempts. Try again in ${waitMinutes} minutes.`);
    }

    if (user.status !== 'active' && user.status !== 'locked') {
      throw new ForbiddenException('Account is inactive or disabled.');
    }

    // 3. Verify password
    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!passwordValid) {
      const attempts = user.failedLoginAttempts + 1;
      let updateData: Partial<typeof users.$inferInsert> = { failedLoginAttempts: attempts };

      if (attempts >= 5) {
        updateData = {
          failedLoginAttempts: attempts,
          status: 'locked',
          lockedUntil: new Date(Date.now() + 15 * 60 * 1000),
        };
        this.logger.warn(`User ${user.username} locked out after ${attempts} failed attempts.`);
      }

      await this.databaseService.db.update(users).set(updateData).where(eq(users.id, user.id));
      throw new UnauthorizedException('Invalid credentials');
    }

    // 4. Check Optional TOTP 2FA (User enabled or Tenant enforced)
    const is2faRequired = user.totpEnabled || Boolean(tenant.mfaEnabled);
    if (is2faRequired && user.totpSecret) {
      if (!dto.totpCode) {
        return {
          require2fa: true,
          userId: user.id,
          username: user.username,
          message: 'Two-factor authentication code required. Please enter code from your Authenticator app.',
        };
      }

      // Verify code
      const isValid = this.verifyTotpCode(user.totpSecret, user.backupCodes, dto.totpCode);
      if (!isValid) {
        throw new UnauthorizedException('Invalid 2FA Authenticator code');
      }
    }

    // 5. Reset failed attempts & update last login
    await this.databaseService.db
      .update(users)
      .set({
        failedLoginAttempts: 0,
        status: 'active',
        lockedUntil: null,
        lastLoginAt: new Date(),
      })
      .where(eq(users.id, user.id));

    // 6. Fetch permissions for the user's role
    const userRolePermissions = await this.databaseService.db
      .select({ code: permissions.code })
      .from(rolePermissions)
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(rolePermissions.roleId, user.roleId));

    const permissionCodes = userRolePermissions.map((p) => p.code);

    // 7. Generate JWT access token
    const payload = {
      sub: user.id,
      uuid: user.uuid,
      username: user.username,
      roleCode: role.code,
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: (this.configService.get<string>('auth.jwtAccessExpiresIn') || '15m') as any,
    });

    // 8. Generate Refresh Token
    const rawRefreshToken = uuidv4() + '-' + uuidv4();
    const tokenHash = await bcrypt.hash(rawRefreshToken, 8);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.databaseService.db.insert(refreshTokens).values({
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    // 9. Record audit log
    await this.databaseService.db.insert(auditLogs).values({
      tenantId: tenant.id,
      userId: user.id,
      action: 'auth.login',
      entity: 'user',
      entityId: String(user.id),
      diffJson: { username: user.username, role: role.code },
      ipAddress: ipAddress || '127.0.0.1',
      userAgent: userAgent || 'unknown',
    });

    const assignedSites = await this.getUserAssignedSites(tenant.id, user.id);

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      user: {
        uuid: user.uuid,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        totpEnabled: user.totpEnabled,
        profileCompleted: this.isProfileComplete(user),
        profileCompletedAt: user.profileCompletedAt,
        assignedSites,
        role: {
          id: role.id,
          code: role.code,
          name: role.name,
        },
        permissions: permissionCodes,
      },
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        plan: tenant.plan,
        logoUrl: tenant.logoUrl,
        primaryColor: tenant.primaryColor,
        mfaEnabled: tenant.mfaEnabled,
        modules: await this.getTenantModulesList(tenant.id),
      },
    };
  }

  /**
   * Helper to verify TOTP code or backup code
   */
  private verifyTotpCode(secret: string, backupCodesJson: string | null | undefined, code: string): boolean {
    // 1. Check Authenticator code
    try {
      const result = verifySync({
        token: code.trim(),
        secret: secret.trim(),
      });
      if (result && (result as any).valid) return true;
    } catch {
      // continue to backup code check
    }

    // 2. Check Backup Codes
    if (backupCodesJson) {
      try {
        const backupCodes: string[] = JSON.parse(backupCodesJson);
        const matchIdx = backupCodes.findIndex((c) => c.toUpperCase() === code.trim().toUpperCase());
        if (matchIdx !== -1) {
          return true;
        }
      } catch {
        // invalid JSON
      }
    }

    return false;
  }

  /**
   * Verify TOTP during 2-step login
   */
  async verifyTotpLogin(userId: number, code: string) {
    const [found] = await this.databaseService.db
      .select({
        user: users,
        role: roles,
        tenant: tenants,
      })
      .from(users)
      .innerJoin(roles, eq(users.roleId, roles.id))
      .innerJoin(tenants, eq(users.tenantId, tenants.id))
      .where(and(eq(users.id, userId), eq(users.status, 'active')))
      .limit(1);

    if (!found || !found.user.totpSecret) {
      throw new UnauthorizedException('2FA is not configured or user not found');
    }

    const { user, role, tenant } = found;
    const isValid = this.verifyTotpCode(user.totpSecret!, user.backupCodes, code);
    if (!isValid) {
      throw new UnauthorizedException('Invalid 2FA Authenticator code');
    }

    // Issue tokens
    const payload = {
      sub: user.id,
      uuid: user.uuid,
      username: user.username,
      roleCode: role.code,
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: (this.configService.get<string>('auth.jwtAccessExpiresIn') || '15m') as any,
    });

    const rawRefreshToken = uuidv4() + '-' + uuidv4();
    const tokenHash = await bcrypt.hash(rawRefreshToken, 8);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.databaseService.db.insert(refreshTokens).values({
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    const userRolePermissions = await this.databaseService.db
      .select({ code: permissions.code })
      .from(rolePermissions)
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(rolePermissions.roleId, user.roleId));

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      user: {
        uuid: user.uuid,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        totpEnabled: user.totpEnabled,
        role: {
          id: role.id,
          code: role.code,
          name: role.name,
        },
        permissions: userRolePermissions.map((p) => p.code),
      },
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        plan: tenant.plan,
        logoUrl: tenant.logoUrl,
        primaryColor: tenant.primaryColor,
        modules: await this.getTenantModulesList(tenant.id),
      },
    };
  }

  /**
   * 2FA Setup: Generate secret and QR code for scanning
   */
  async generateTotpSecret(userId: number) {
    const [user] = await this.databaseService.db
      .select({
        id: users.id,
        email: users.email,
        username: users.username,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const secret = generateSecret();
    const otpauthUrl = generateURI({ secret, label: user.email, issuer: 'Kings Builders ERP' });
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

    return {
      secret,
      otpauthUrl,
      qrCodeDataUrl,
    };
  }

  /**
   * 2FA Activation: Verify token and activate TOTP
   */
  async enableTotp(userId: number, secret: string, token: string) {
    const result = verifySync({ token: token.trim(), secret: secret.trim() });
    if (!result || !(result as any).valid) {
      throw new BadRequestException('Invalid verification code from Authenticator app');
    }

    // Generate 5 recovery backup codes
    const backupCodes = Array.from({ length: 5 }, () =>
      `KB-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`
    );

    await this.databaseService.db
      .update(users)
      .set({
        totpSecret: secret.trim(),
        totpEnabled: true,
        backupCodes: JSON.stringify(backupCodes),
      })
      .where(eq(users.id, userId));

    return {
      success: true,
      message: 'Two-factor authentication enabled successfully',
      backupCodes,
    };
  }

  /**
   * 2FA Disable: Require user password to disable
   */
  async disableTotp(userId: number, passwordConfirm: string) {
    const [user] = await this.databaseService.db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const passwordValid = await bcrypt.compare(passwordConfirm, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Incorrect password confirmation');
    }

    await this.databaseService.db
      .update(users)
      .set({
        totpSecret: null,
        totpEnabled: false,
        backupCodes: null,
      })
      .where(eq(users.id, userId));

    return {
      success: true,
      message: 'Two-factor authentication disabled',
    };
  }

  async refresh(rawRefreshToken: string) {
    if (!rawRefreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }

    const tokens = await this.databaseService.db
      .select()
      .from(refreshTokens)
      .where(and(gt(refreshTokens.expiresAt, new Date()), isNull(refreshTokens.revokedAt)));

    let matchedToken: typeof refreshTokens.$inferSelect | null = null;
    for (const t of tokens) {
      const isMatch = await bcrypt.compare(rawRefreshToken, t.tokenHash);
      if (isMatch) {
        matchedToken = t;
        break;
      }
    }

    if (!matchedToken) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    await this.databaseService.db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(eq(refreshTokens.id, matchedToken.id));

    const [result] = await this.databaseService.db
      .select({
        user: users,
        role: roles,
        tenant: tenants,
      })
      .from(users)
      .innerJoin(roles, eq(users.roleId, roles.id))
      .innerJoin(tenants, eq(users.tenantId, tenants.id))
      .where(and(eq(users.id, matchedToken.userId), eq(users.status, 'active')))
      .limit(1);

    if (!result) {
      throw new UnauthorizedException('User or tenant not active');
    }

    const { user, role, tenant } = result;

    const payload = {
      sub: user.id,
      uuid: user.uuid,
      username: user.username,
      roleCode: role.code,
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
    };

    const newAccessToken = await this.jwtService.signAsync(payload, {
      expiresIn: (this.configService.get<string>('auth.jwtAccessExpiresIn') || '15m') as any,
    });

    const newRawRefreshToken = uuidv4() + '-' + uuidv4();
    const tokenHash = await bcrypt.hash(newRawRefreshToken, 8);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.databaseService.db.insert(refreshTokens).values({
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRawRefreshToken,
    };
  }

  async logout(userId: number) {
    await this.databaseService.db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(and(eq(refreshTokens.userId, userId), isNull(refreshTokens.revokedAt)));

    return { message: 'Logged out successfully' };
  }

  async getMe(userId: number) {
    const [result] = await this.databaseService.db
      .select({
        user: users,
        role: roles,
        tenant: tenants,
      })
      .from(users)
      .innerJoin(roles, eq(users.roleId, roles.id))
      .innerJoin(tenants, eq(users.tenantId, tenants.id))
      .where(and(eq(users.id, userId), isNull(users.deletedAt)))
      .limit(1);

    if (!result) {
      throw new NotFoundException('User profile not found');
    }

    const { user, role, tenant } = result;

    const userRolePermissions = await this.databaseService.db
      .select({ code: permissions.code })
      .from(rolePermissions)
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(rolePermissions.roleId, user.roleId));

    const assignedSites = await this.getUserAssignedSites(tenant.id, user.id);

    return {
      user: {
        id: user.id,
        uuid: user.uuid,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        totpEnabled: user.totpEnabled,
        profileCompleted: this.isProfileComplete(user),
        profileCompletedAt: user.profileCompletedAt,
        assignedSites,
        role: {
          id: role.id,
          code: role.code,
          name: role.name,
        },
        permissions: userRolePermissions.map((p) => p.code),
      },
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        plan: tenant.plan,
        tagline: tenant.tagline,
        gstin: tenant.gstin,
        stateCode: tenant.stateCode,
        address: tenant.address,
        logoUrl: tenant.logoUrl,
        primaryColor: tenant.primaryColor,
        mfaEnabled: tenant.mfaEnabled,
        modules: await this.getTenantModulesList(tenant.id),
      },
    };
  }

  /**
   * Complete or update user profile on first login
   */
  async updateProfile(userId: number, dto: UpdateProfileDto) {
    const [existing] = await this.databaseService.db
      .select()
      .from(users)
      .where(and(eq(users.id, userId), isNull(users.deletedAt)))
      .limit(1);

    if (!existing) {
      throw new NotFoundException('User not found');
    }

    const fullName = dto.fullName.trim();
    const phone = dto.phone.trim();
    const email = dto.email.trim().toLowerCase();

    if (!fullName || !phone || !email) {
      throw new BadRequestException('Full name, phone, and email are required to complete profile setup.');
    }

    if (existing.tenantId !== null) {
      const [duplicate] = await this.databaseService.db
        .select({ id: users.id })
        .from(users)
        .where(
          and(
            eq(users.tenantId, existing.tenantId),
            eq(users.email, email),
            ne(users.id, userId),
            isNull(users.deletedAt),
          ),
        )
        .limit(1);

      if (duplicate) {
        throw new BadRequestException('Email address is already in use by another account in this organization.');
      }
    }

    const now = new Date();
    await this.databaseService.db
      .update(users)
      .set({
        fullName,
        phone,
        email,
        ...(dto.avatarUrl !== undefined ? { avatarUrl: dto.avatarUrl.trim() || null } : {}),
        profileCompleted: true,
        profileCompletedAt: existing.profileCompletedAt ?? now,
        updatedAt: now,
      })
      .where(eq(users.id, userId));

    if (existing.tenantId !== null) {
      await this.databaseService.db.insert(auditLogs).values({
        tenantId: existing.tenantId,
        userId,
        action: 'auth.profile_complete',
        entity: 'user',
        entityId: String(userId),
        diffJson: { fullName, phone, email },
      });
    }

    return this.getMe(userId);
  }

  /**
   * Determines whether a user has completed mandatory profile setup
   */
  private isProfileComplete(user: typeof users.$inferSelect): boolean {
    return Boolean(
      user.profileCompleted &&
      user.fullName?.trim() &&
      user.email?.trim() &&
      user.phone?.trim(),
    );
  }

  /**
   * Returns sites assigned to the user via user_sites
   */
  private async getUserAssignedSites(tenantId: number, userId: number) {
    try {
      return await this.databaseService.db
        .select({
          id: sites.id,
          code: sites.code,
          name: sites.name,
          companyId: sites.companyId,
          latitude: sites.latitude,
          longitude: sites.longitude,
          geofenceRadius: sites.geofenceRadius,
          status: sites.status,
        })
        .from(userSites)
        .innerJoin(sites, eq(userSites.siteId, sites.id))
        .where(
          and(
            eq(userSites.userId, userId),
            eq(sites.tenantId, tenantId),
            isNull(sites.deletedAt),
          ),
        );
    } catch {
      return [];
    }
  }

  /**
   * Helper to fetch enabled module codes for a tenant
   */
  private async getTenantModulesList(tenantId: number) {
    try {
      const rows = await this.databaseService.db
        .select({ moduleCode: tenantModules.moduleCode, enabled: tenantModules.enabled })
        .from(tenantModules)
        .where(eq(tenantModules.tenantId, tenantId));
      return rows.map((r) => ({ moduleCode: r.moduleCode, enabled: Boolean(r.enabled) }));
    } catch {
      return [];
    }
  }
}
