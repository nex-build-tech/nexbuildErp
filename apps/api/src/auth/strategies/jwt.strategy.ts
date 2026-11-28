import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '../../database/database.service';
import { users, roles, rolePermissions, permissions } from '../../database/schema';
import { eq, and } from 'drizzle-orm';

export interface JwtPayload {
  sub: number;
  uuid: string;
  username: string;
  roleCode: string;
  tenantId: number;
  tenantSlug: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly databaseService: DatabaseService,
  ) {
    const secret = configService.get<string>('auth.jwtAccessSecret') || 'change_me_access_secret_min_32_chars_xx';
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload) {
    const [result] = await this.databaseService.db
      .select({
        user: users,
        role: roles,
      })
      .from(users)
      .innerJoin(roles, eq(users.roleId, roles.id))
      .where(and(eq(users.id, payload.sub), eq(users.status, 'active')))
      .limit(1);

    if (!result) {
      throw new UnauthorizedException('User not found or inactive');
    }

    const { user, role } = result;

    // Get permissions for user's role
    const userRolePermissions = await this.databaseService.db
      .select({ code: permissions.code })
      .from(rolePermissions)
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(rolePermissions.roleId, user.roleId));

    const permissionCodes = userRolePermissions.map((p) => p.code);

    return {
      id: user.id,
      uuid: user.uuid,
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      tenantId: user.tenantId,
      roleId: user.roleId,
      roleCode: role.code,
      roleName: role.name,
      profileCompleted: Boolean(
        user.profileCompleted &&
        user.fullName?.trim() &&
        user.email?.trim() &&
        user.phone?.trim(),
      ),
      permissions: permissionCodes,
    };
  }
}
