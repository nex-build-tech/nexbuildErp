import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseService } from '../database/database.service';
import {
  dailyProgressReports,
  dprWorkItems,
  dprPhotos,
  dprEquipments,
  sites,
  users,
  documentSeries,
} from '../database/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { TenantContext } from '../common/middleware/tenant.middleware';

@Injectable()
export class DprService {
  constructor(private readonly databaseService: DatabaseService) {}

  private async getNextDprNumber(tenantId: number): Promise<string> {
    const fy = '26-27';
    let [series] = await this.databaseService.db
      .select()
      .from(documentSeries)
      .where(
        and(
          eq(documentSeries.tenantId, tenantId),
          eq(documentSeries.documentType, 'DPR'),
          eq(documentSeries.financialYear, fy)
        )
      )
      .limit(1);

    if (!series) {
      await this.databaseService.db.insert(documentSeries).values({
        uuid: uuidv4(),
        tenantId,
        documentType: 'DPR',
        prefix: 'KB/DPR',
        financialYear: fy,
        nextNumber: 1,
        padding: 4,
      });

      const [created] = await this.databaseService.db
        .select()
        .from(documentSeries)
        .where(
          and(
            eq(documentSeries.tenantId, tenantId),
            eq(documentSeries.documentType, 'DPR'),
            eq(documentSeries.financialYear, fy)
          )
        )
        .limit(1);
      series = created;
    }

    if (!series) {
      throw new BadRequestException('Could not allocate DPR series');
    }

    const padLength = series.padding || 4;
    const formattedNum = String(series.nextNumber).padStart(padLength, '0');
    const docNumber = `${series.prefix}/${series.financialYear}/${formattedNum}`;

    await this.databaseService.db
      .update(documentSeries)
      .set({ nextNumber: series.nextNumber + 1 })
      .where(eq(documentSeries.id, series.id));

    return docNumber;
  }

  async getDailyProgressReports(
    tenant: TenantContext,
    filter?: { siteId?: number; date?: string; status?: string }
  ) {
    const conditions = [eq(dailyProgressReports.tenantId, tenant.id)];
    if (filter?.siteId) {
      conditions.push(eq(dailyProgressReports.siteId, filter.siteId));
    }
    if (filter?.status) {
      conditions.push(eq(dailyProgressReports.status, filter.status));
    }

    const rows = await this.databaseService.db
      .select({
        id: dailyProgressReports.id,
        uuid: dailyProgressReports.uuid,
        reportNumber: dailyProgressReports.reportNumber,
        siteId: dailyProgressReports.siteId,
        siteName: sites.name,
        siteCode: sites.code,
        reportDate: dailyProgressReports.reportDate,
        weather: dailyProgressReports.weather,
        temperature: dailyProgressReports.temperature,
        shift: dailyProgressReports.shift,
        generalProgress: dailyProgressReports.generalProgress,
        delaysIssues: dailyProgressReports.delaysIssues,
        safetyNotes: dailyProgressReports.safetyNotes,
        status: dailyProgressReports.status,
        createdById: dailyProgressReports.createdById,
        createdByName: users.fullName,
        createdAt: dailyProgressReports.createdAt,
      })
      .from(dailyProgressReports)
      .leftJoin(sites, eq(dailyProgressReports.siteId, sites.id))
      .leftJoin(users, eq(dailyProgressReports.createdById, users.id))
      .where(and(...conditions))
      .orderBy(desc(dailyProgressReports.reportDate), desc(dailyProgressReports.id));

    // Fetch counts of work items and photos per DPR
    const itemCounts = await this.databaseService.db
      .select({
        dprId: dprWorkItems.dprId,
        count: sql<number>`count(*)`.as('count'),
      })
      .from(dprWorkItems)
      .groupBy(dprWorkItems.dprId);

    const photoCounts = await this.databaseService.db
      .select({
        dprId: dprPhotos.dprId,
        count: sql<number>`count(*)`.as('count'),
      })
      .from(dprPhotos)
      .groupBy(dprPhotos.dprId);

    const itemMap = new Map(itemCounts.map((i) => [i.dprId, Number(i.count)]));
    const photoMap = new Map(photoCounts.map((p) => [p.dprId, Number(p.count)]));

    return rows.map((r) => ({
      ...r,
      itemCount: itemMap.get(r.id) || 0,
      photoCount: photoMap.get(r.id) || 0,
    }));
  }

  async getDprById(tenant: TenantContext, id: number) {
    const [dpr] = await this.databaseService.db
      .select({
        id: dailyProgressReports.id,
        uuid: dailyProgressReports.uuid,
        reportNumber: dailyProgressReports.reportNumber,
        siteId: dailyProgressReports.siteId,
        siteName: sites.name,
        siteCode: sites.code,
        siteAddress: sites.address,
        reportDate: dailyProgressReports.reportDate,
        weather: dailyProgressReports.weather,
        temperature: dailyProgressReports.temperature,
        shift: dailyProgressReports.shift,
        generalProgress: dailyProgressReports.generalProgress,
        delaysIssues: dailyProgressReports.delaysIssues,
        safetyNotes: dailyProgressReports.safetyNotes,
        status: dailyProgressReports.status,
        createdById: dailyProgressReports.createdById,
        createdByName: users.fullName,
        approvedById: dailyProgressReports.approvedById,
        createdAt: dailyProgressReports.createdAt,
        updatedAt: dailyProgressReports.updatedAt,
      })
      .from(dailyProgressReports)
      .leftJoin(sites, eq(dailyProgressReports.siteId, sites.id))
      .leftJoin(users, eq(dailyProgressReports.createdById, users.id))
      .where(and(eq(dailyProgressReports.tenantId, tenant.id), eq(dailyProgressReports.id, id)))
      .limit(1);

    if (!dpr) {
      throw new NotFoundException(`DPR #${id} not found`);
    }

    let approvedByName: string | null = null;
    if (dpr.approvedById) {
      const [approver] = await this.databaseService.db
        .select({ fullName: users.fullName })
        .from(users)
        .where(eq(users.id, dpr.approvedById))
        .limit(1);
      approvedByName = approver ? approver.fullName : null;
    }

    const [items, photos, equipments] = await Promise.all([
      this.databaseService.db
        .select()
        .from(dprWorkItems)
        .where(eq(dprWorkItems.dprId, id)),
      this.databaseService.db
        .select()
        .from(dprPhotos)
        .where(eq(dprPhotos.dprId, id))
        .orderBy(desc(dprPhotos.takenAt)),
      this.databaseService.db
        .select()
        .from(dprEquipments)
        .where(eq(dprEquipments.dprId, id)),
    ]);

    return {
      ...dpr,
      approvedByName,
      items,
      photos,
      equipments,
    };
  }

  async createDpr(tenant: TenantContext, user: any, data: any) {
    const reportNumber = await this.getNextDprNumber(tenant.id);
    const uuid = uuidv4();
    const reportDate = data.reportDate ? new Date(data.reportDate) : new Date();

    await this.databaseService.db.insert(dailyProgressReports).values({
      uuid,
      tenantId: tenant.id,
      siteId: Number(data.siteId),
      reportNumber,
      reportDate,
      weather: data.weather || 'Clear / Sunny',
      temperature: data.temperature || '32°C',
      shift: data.shift || 'Day',
      generalProgress: data.generalProgress || null,
      delaysIssues: data.delaysIssues || null,
      safetyNotes: data.safetyNotes || null,
      status: data.status || 'draft',
      createdById: user.id,
    });

    const [created] = await this.databaseService.db
      .select()
      .from(dailyProgressReports)
      .where(and(eq(dailyProgressReports.tenantId, tenant.id), eq(dailyProgressReports.uuid, uuid)))
      .limit(1);

    if (!created) {
      throw new BadRequestException('Failed to create Daily Progress Report');
    }

    // Insert work items
    for (const item of data.items || []) {
      await this.databaseService.db.insert(dprWorkItems).values({
        dprId: created.id,
        activityName: item.activityName,
        locationRef: item.locationRef || 'Site Location',
        uom: item.uom || 'SQ.M',
        plannedQty: (Number(item.plannedQty) || 0).toFixed(3),
        completedQty: (Number(item.completedQty) || 0).toFixed(3),
        remarks: item.remarks || null,
      });
    }

    // Insert equipment logs
    for (const eqItem of data.equipments || []) {
      await this.databaseService.db.insert(dprEquipments).values({
        dprId: created.id,
        equipmentName: eqItem.equipmentName,
        runningHours: (Number(eqItem.runningHours) || 0).toFixed(2),
        idleHours: (Number(eqItem.idleHours) || 0).toFixed(2),
        breakdownHours: (Number(eqItem.breakdownHours) || 0).toFixed(2),
        status: eqItem.status || 'working',
        remarks: eqItem.remarks || null,
      });
    }

    // Insert photos
    for (const ph of data.photos || []) {
      await this.databaseService.db.insert(dprPhotos).values({
        dprId: created.id,
        photoUrl: ph.photoUrl,
        caption: ph.caption || null,
        activityTag: ph.activityTag || null,
        takenAt: ph.takenAt ? new Date(ph.takenAt) : new Date(),
      });
    }

    return this.getDprById(tenant, created.id);
  }

  async updateDprStatus(
    tenant: TenantContext,
    user: any,
    id: number,
    status: 'draft' | 'submitted' | 'approved'
  ) {
    const updatePayload: any = { status };
    if (status === 'approved') {
      updatePayload.approvedById = user.id;
    }

    await this.databaseService.db
      .update(dailyProgressReports)
      .set(updatePayload)
      .where(and(eq(dailyProgressReports.tenantId, tenant.id), eq(dailyProgressReports.id, id)));

    return this.getDprById(tenant, id);
  }

  async addPhotos(tenant: TenantContext, id: number, photos: Array<{ photoUrl: string; caption?: string; activityTag?: string }>) {
    const dpr = await this.getDprById(tenant, id);
    for (const ph of photos) {
      await this.databaseService.db.insert(dprPhotos).values({
        dprId: dpr.id,
        photoUrl: ph.photoUrl,
        caption: ph.caption || null,
        activityTag: ph.activityTag || null,
        takenAt: new Date(),
      });
    }
    return this.getDprById(tenant, id);
  }
}
