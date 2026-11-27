import { Injectable, NestMiddleware, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { DatabaseService } from '../../database/database.service';
import { tenants } from '../../database/schema';
import { eq } from 'drizzle-orm';

export interface TenantContext {
  id: number;
  uuid: string;
  name: string;
  slug: string;
  status: string;
  plan: string;
  gstin?: string | null;
  pan?: string | null;
  stateCode?: string | null;
  address?: string | null;
  logoUrl?: string | null;
  primaryColor?: string | null;
  tagline?: string | null;
  mfaEnabled?: boolean | null;
  branding?: string | null;
}

declare global {
  namespace Express {
    interface Request {
      tenant?: TenantContext;
    }
  }
}

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private readonly databaseService: DatabaseService) {}

  async use(req: Request, _res: Response, next: NextFunction) {
    // 1. Resolve tenant slug from Header (X-Tenant), Host header, or default to 'kings' in dev
    let slug = (req.headers['x-tenant'] as string)?.toLowerCase()?.trim();

    if (!slug) {
      const host = req.headers.host || '';
      const parts = host.split('.');
      if (parts.length > 2 && parts[0] && parts[0] !== 'www' && parts[0] !== 'admin' && parts[0] !== 'api') {
        slug = parts[0];
      }
    }

    // Default to 'kings' in local development if unspecified
    if (!slug || slug === 'localhost') {
      slug = 'kings';
    }

    try {
      const [tenant] = await this.databaseService.db
        .select()
        .from(tenants)
        .where(eq(tenants.slug, slug))
        .limit(1);

      if (!tenant) {
        throw new NotFoundException(`Tenant '${slug}' not found.`);
      }

      if (tenant.status === 'suspended' || tenant.status === 'cancelled') {
        throw new ForbiddenException(`Tenant '${slug}' is ${tenant.status}.`);
      }

      req.tenant = {
        id: tenant.id,
        uuid: tenant.uuid,
        name: tenant.name,
        slug: tenant.slug,
        status: tenant.status,
        plan: tenant.plan,
        gstin: tenant.gstin,
        pan: tenant.pan,
        stateCode: tenant.stateCode,
        address: tenant.address,
        logoUrl: tenant.logoUrl,
        primaryColor: tenant.primaryColor,
        tagline: tenant.tagline,
        mfaEnabled: tenant.mfaEnabled,
        branding: tenant.branding,
      };

      next();
    } catch (error) {
      next(error);
    }
  }
}
