import { Injectable, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseService } from '../database/database.service';
import {
  sites,
  companies,
  items,
  categories,
  units,
  warehouses,
  vendors,
  contractors,
  documentSeries,
  tenants,
} from '../database/schema';
import { eq, and, desc, isNull, like, or } from 'drizzle-orm';
import { TenantContext } from '../common/middleware/tenant.middleware';

@Injectable()
export class MastersService {
  constructor(private readonly databaseService: DatabaseService) {}

  // ── SITES ────────────────────────────────────────────────────────────────
  async getSites(tenant: TenantContext, search?: string) {
    const conditions = [eq(sites.tenantId, tenant.id), isNull(sites.deletedAt)];
    if (search) {
      conditions.push(or(like(sites.name, `%${search}%`), like(sites.code, `%${search}%`))!);
    }
    return this.databaseService.db
      .select({
        id: sites.id,
        uuid: sites.uuid,
        tenantId: sites.tenantId,
        companyId: sites.companyId,
        companyName: companies.name,
        companyCode: companies.code,
        code: sites.code,
        name: sites.name,
        clientName: sites.clientName,
        address: sites.address,
        city: sites.city,
        stateCode: sites.stateCode,
        pincode: sites.pincode,
        latitude: sites.latitude,
        longitude: sites.longitude,
        geofenceRadius: sites.geofenceRadius,
        status: sites.status,
        startDate: sites.startDate,
        targetDate: sites.targetDate,
        createdAt: sites.createdAt,
        updatedAt: sites.updatedAt,
      })
      .from(sites)
      .leftJoin(companies, eq(sites.companyId, companies.id))
      .where(and(...conditions))
      .orderBy(desc(sites.createdAt));
  }

  async getSiteById(tenant: TenantContext, id: number) {
    const [row] = await this.databaseService.db
      .select({
        id: sites.id,
        uuid: sites.uuid,
        tenantId: sites.tenantId,
        companyId: sites.companyId,
        companyName: companies.name,
        companyCode: companies.code,
        code: sites.code,
        name: sites.name,
        clientName: sites.clientName,
        address: sites.address,
        city: sites.city,
        stateCode: sites.stateCode,
        pincode: sites.pincode,
        latitude: sites.latitude,
        longitude: sites.longitude,
        geofenceRadius: sites.geofenceRadius,
        status: sites.status,
        startDate: sites.startDate,
        targetDate: sites.targetDate,
        createdAt: sites.createdAt,
        updatedAt: sites.updatedAt,
      })
      .from(sites)
      .leftJoin(companies, eq(sites.companyId, companies.id))
      .where(and(eq(sites.tenantId, tenant.id), eq(sites.id, id)))
      .limit(1);

    if (!row) throw new NotFoundException('Site not found');
    return row;
  }

  async createSite(tenant: TenantContext, data: any) {
    const uuid = uuidv4();
    await this.databaseService.db.insert(sites).values({
      uuid,
      tenantId: tenant.id,
      companyId: data.companyId ? Number(data.companyId) : null,
      code: data.code.toUpperCase(),
      name: data.name,
      clientName: data.clientName,
      address: data.address || '',
      city: data.city || 'Mumbai',
      stateCode: data.stateCode || '27',
      pincode: data.pincode,
      status: data.status || 'active',
      latitude: data.latitude ? String(data.latitude) : null,
      longitude: data.longitude ? String(data.longitude) : null,
      geofenceRadius: data.geofenceRadius ? Number(data.geofenceRadius) : 200,
    });
    const [created] = await this.databaseService.db
      .select({ id: sites.id })
      .from(sites)
      .where(and(eq(sites.tenantId, tenant.id), eq(sites.uuid, uuid)))
      .limit(1);

    if (!created) throw new NotFoundException('Failed to create site');
    return this.getSiteById(tenant, created.id);
  }

  async updateSite(tenant: TenantContext, id: number, data: any) {
    const updatePayload: Record<string, any> = { updatedAt: new Date() };
    if (data.name !== undefined) updatePayload.name = data.name;
    if (data.code !== undefined) updatePayload.code = data.code.toUpperCase();
    if (data.companyId !== undefined) updatePayload.companyId = data.companyId ? Number(data.companyId) : null;
    if (data.clientName !== undefined) updatePayload.clientName = data.clientName;
    if (data.address !== undefined) updatePayload.address = data.address;
    if (data.city !== undefined) updatePayload.city = data.city;
    if (data.stateCode !== undefined) updatePayload.stateCode = data.stateCode;
    if (data.pincode !== undefined) updatePayload.pincode = data.pincode;
    if (data.status !== undefined) updatePayload.status = data.status;
    if (data.latitude !== undefined) updatePayload.latitude = data.latitude ? String(data.latitude) : null;
    if (data.longitude !== undefined) updatePayload.longitude = data.longitude ? String(data.longitude) : null;
    if (data.geofenceRadius !== undefined) updatePayload.geofenceRadius = Number(data.geofenceRadius);

    await this.databaseService.db
      .update(sites)
      .set(updatePayload)
      .where(and(eq(sites.tenantId, tenant.id), eq(sites.id, id)));

    return this.getSiteById(tenant, id);
  }

  async deleteSite(tenant: TenantContext, id: number) {
    await this.databaseService.db
      .update(sites)
      .set({ deletedAt: new Date(), status: 'inactive' })
      .where(and(eq(sites.tenantId, tenant.id), eq(sites.id, id)));
    return { success: true, message: 'Site deactivated successfully' };
  }

  // ── ITEMS ────────────────────────────────────────────────────────────────
  async getItems(tenant: TenantContext, search?: string, categoryId?: number) {
    const conditions = [eq(items.tenantId, tenant.id), isNull(items.deletedAt)];
    if (categoryId) {
      conditions.push(eq(items.categoryId, categoryId));
    }
    if (search) {
      conditions.push(or(like(items.name, `%${search}%`), like(items.code, `%${search}%`))!);
    }

    return this.databaseService.db
      .select({
        id: items.id,
        uuid: items.uuid,
        code: items.code,
        name: items.name,
        description: items.description,
        hsnCode: items.hsnCode,
        gstRate: items.gstRate,
        defaultRate: items.defaultRate,
        reorderLevel: items.reorderLevel,
        brand: items.brand,
        status: items.status,
        category: {
          id: categories.id,
          name: categories.name,
          code: categories.code,
        },
        unit: {
          id: units.id,
          name: units.name,
          code: units.code,
          symbol: units.symbol,
        },
      })
      .from(items)
      .innerJoin(categories, eq(items.categoryId, categories.id))
      .innerJoin(units, eq(items.unitId, units.id))
      .where(and(...conditions))
      .orderBy(desc(items.createdAt));
  }

  async createItem(tenant: TenantContext, data: any) {
    const uuid = uuidv4();
    await this.databaseService.db.insert(items).values({
      uuid,
      tenantId: tenant.id,
      categoryId: data.categoryId,
      unitId: data.unitId,
      code: data.code.toUpperCase(),
      name: data.name,
      description: data.description || data.name,
      hsnCode: data.hsnCode,
      gstRate: String(data.gstRate || '18'),
      defaultRate: String(data.defaultRate || '0.0000'),
      reorderLevel: String(data.reorderLevel || '0.000'),
      brand: data.brand,
      status: 'active',
    });
    const [created] = await this.databaseService.db
      .select()
      .from(items)
      .where(and(eq(items.tenantId, tenant.id), eq(items.uuid, uuid)))
      .limit(1);
    return created;
  }

  // ── CATEGORIES ───────────────────────────────────────────────────────────
  async getCategories(tenant: TenantContext) {
    return this.databaseService.db
      .select()
      .from(categories)
      .where(eq(categories.tenantId, tenant.id))
      .orderBy(categories.name);
  }

  // ── UNITS ────────────────────────────────────────────────────────────────
  async getUnits(tenant: TenantContext) {
    return this.databaseService.db
      .select()
      .from(units)
      .where(eq(units.tenantId, tenant.id))
      .orderBy(units.name);
  }

  // ── WAREHOUSES ───────────────────────────────────────────────────────────
  async getWarehouses(tenant: TenantContext) {
    return this.databaseService.db
      .select()
      .from(warehouses)
      .where(eq(warehouses.tenantId, tenant.id))
      .orderBy(desc(warehouses.isCentral), warehouses.name);
  }

  // ── VENDORS ──────────────────────────────────────────────────────────────
  async getVendors(tenant: TenantContext, search?: string) {
    const conditions = [eq(vendors.tenantId, tenant.id), isNull(vendors.deletedAt)];
    if (search) {
      conditions.push(or(like(vendors.name, `%${search}%`), like(vendors.code, `%${search}%`))!);
    }
    return this.databaseService.db
      .select()
      .from(vendors)
      .where(and(...conditions))
      .orderBy(desc(vendors.createdAt));
  }

  async createVendor(tenant: TenantContext, data: any) {
    const uuid = uuidv4();
    await this.databaseService.db.insert(vendors).values({
      uuid,
      tenantId: tenant.id,
      code: data.code.toUpperCase(),
      name: data.name,
      contactPerson: data.contactPerson,
      email: data.email,
      phone: data.phone,
      gstin: data.gstin,
      pan: data.pan,
      stateCode: data.stateCode || '27',
      address: data.address,
      city: data.city || 'Mumbai',
      bankName: data.bankName,
      bankAccountNo: data.bankAccountNo,
      bankIfsc: data.bankIfsc,
      paymentTerms: data.paymentTerms || '30 Days Credit',
      status: 'active',
    });
    const [created] = await this.databaseService.db
      .select()
      .from(vendors)
      .where(and(eq(vendors.tenantId, tenant.id), eq(vendors.uuid, uuid)))
      .limit(1);
    return created;
  }

  // ── CONTRACTORS ──────────────────────────────────────────────────────────
  async getContractors(tenant: TenantContext) {
    return this.databaseService.db
      .select()
      .from(contractors)
      .where(eq(contractors.tenantId, tenant.id))
      .orderBy(contractors.name);
  }

  // ── DOCUMENT SERIES ──────────────────────────────────────────────────────
  async getDocumentSeries(tenant: TenantContext) {
    return this.databaseService.db
      .select()
      .from(documentSeries)
      .where(eq(documentSeries.tenantId, tenant.id));
  }

  // ── TENANT BRANDING & 2FA POLICIES ───────────────────────────────────────
  async getTenantBranding(tenant: TenantContext) {
    const [t] = await this.databaseService.db
      .select({
        id: tenants.id,
        name: tenants.name,
        slug: tenants.slug,
        tagline: tenants.tagline,
        gstin: tenants.gstin,
        stateCode: tenants.stateCode,
        address: tenants.address,
        logoUrl: tenants.logoUrl,
        primaryColor: tenants.primaryColor,
        mfaEnabled: tenants.mfaEnabled,
      })
      .from(tenants)
      .where(eq(tenants.id, tenant.id))
      .limit(1);

    return t;
  }

  async updateTenantBranding(tenant: TenantContext, data: {
    logoUrl?: string;
    primaryColor?: string;
    tagline?: string;
    mfaEnabled?: boolean;
    address?: string;
  }) {
    const updatePayload: Record<string, any> = {};
    if (data.logoUrl !== undefined) updatePayload.logoUrl = data.logoUrl;
    if (data.primaryColor !== undefined) updatePayload.primaryColor = data.primaryColor;
    if (data.tagline !== undefined) updatePayload.tagline = data.tagline;
    if (data.mfaEnabled !== undefined) updatePayload.mfaEnabled = Boolean(data.mfaEnabled);
    if (data.address !== undefined) updatePayload.address = data.address;

    await this.databaseService.db
      .update(tenants)
      .set(updatePayload)
      .where(eq(tenants.id, tenant.id));

    return this.getTenantBranding(tenant);
  }
}
