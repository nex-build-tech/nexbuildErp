import { Injectable, BadRequestException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseService } from '../database/database.service';
import {
  labourAttendance,
  contractors,
  sites,
  users,
} from '../database/schema';
import { eq, and, desc, sql, gte, lte } from 'drizzle-orm';
import { TenantContext } from '../common/middleware/tenant.middleware';

@Injectable()
export class LabourService {
  constructor(private readonly databaseService: DatabaseService) {}

  async getAttendance(
    tenant: TenantContext,
    filter?: { siteId?: number; date?: string; contractorId?: number; shift?: string }
  ) {
    const conditions = [eq(labourAttendance.tenantId, tenant.id)];
    if (filter?.siteId) {
      conditions.push(eq(labourAttendance.siteId, filter.siteId));
    }
    if (filter?.contractorId) {
      conditions.push(eq(labourAttendance.contractorId, filter.contractorId));
    }
    if (filter?.shift) {
      conditions.push(eq(labourAttendance.shift, filter.shift));
    }

    if (filter?.date) {
      const d = new Date(filter.date);
      const startOfDay = new Date(d.setHours(0, 0, 0, 0));
      const endOfDay = new Date(d.setHours(23, 59, 59, 999));
      conditions.push(gte(labourAttendance.attendanceDate, startOfDay));
      conditions.push(lte(labourAttendance.attendanceDate, endOfDay));
    }

    return this.databaseService.db
      .select({
        id: labourAttendance.id,
        uuid: labourAttendance.uuid,
        siteId: labourAttendance.siteId,
        siteName: sites.name,
        contractorId: labourAttendance.contractorId,
        contractorName: contractors.name,
        contractorTrade: contractors.trade,
        attendanceDate: labourAttendance.attendanceDate,
        shift: labourAttendance.shift,
        tradeCategory: labourAttendance.tradeCategory,
        skilledMale: labourAttendance.skilledMale,
        skilledFemale: labourAttendance.skilledFemale,
        semiSkilledMale: labourAttendance.semiSkilledMale,
        semiSkilledFemale: labourAttendance.semiSkilledFemale,
        unskilledMale: labourAttendance.unskilledMale,
        unskilledFemale: labourAttendance.unskilledFemale,
        supervisors: labourAttendance.supervisors,
        totalWorkers: labourAttendance.totalWorkers,
        overtimeHours: labourAttendance.overtimeHours,
        workLocation: labourAttendance.workLocation,
        remarks: labourAttendance.remarks,
        recordedById: labourAttendance.recordedById,
        recordedByName: users.fullName,
        createdAt: labourAttendance.createdAt,
      })
      .from(labourAttendance)
      .leftJoin(sites, eq(labourAttendance.siteId, sites.id))
      .leftJoin(contractors, eq(labourAttendance.contractorId, contractors.id))
      .leftJoin(users, eq(labourAttendance.recordedById, users.id))
      .where(and(...conditions))
      .orderBy(desc(labourAttendance.attendanceDate), desc(labourAttendance.id));
  }

  async getAttendanceSummary(
    tenant: TenantContext,
    filter?: { siteId?: number; from?: string; to?: string }
  ) {
    const conditions = [eq(labourAttendance.tenantId, tenant.id)];
    if (filter?.siteId) {
      conditions.push(eq(labourAttendance.siteId, filter.siteId));
    }
    if (filter?.from) {
      conditions.push(gte(labourAttendance.attendanceDate, new Date(filter.from)));
    }
    if (filter?.to) {
      conditions.push(lte(labourAttendance.attendanceDate, new Date(filter.to)));
    }

    const records = await this.databaseService.db
      .select({
        totalHeads: sql<number>`sum(${labourAttendance.totalWorkers})`.as('totalHeads'),
        skilled: sql<number>`sum(${labourAttendance.skilledMale} + ${labourAttendance.skilledFemale})`.as('skilled'),
        semiSkilled: sql<number>`sum(${labourAttendance.semiSkilledMale} + ${labourAttendance.semiSkilledFemale})`.as('semiSkilled'),
        unskilled: sql<number>`sum(${labourAttendance.unskilledMale} + ${labourAttendance.unskilledFemale})`.as('unskilled'),
        supervisors: sql<number>`sum(${labourAttendance.supervisors})`.as('supervisors'),
        overtimeHours: sql<number>`sum(${labourAttendance.overtimeHours})`.as('overtimeHours'),
      })
      .from(labourAttendance)
      .where(and(...conditions));

    const contractorBreakdown = await this.databaseService.db
      .select({
        contractorId: labourAttendance.contractorId,
        contractorName: contractors.name,
        totalHeads: sql<number>`sum(${labourAttendance.totalWorkers})`.as('totalHeads'),
      })
      .from(labourAttendance)
      .leftJoin(contractors, eq(labourAttendance.contractorId, contractors.id))
      .where(and(...conditions))
      .groupBy(labourAttendance.contractorId, contractors.name);

    return {
      totals: records[0] || {
        totalHeads: 0,
        skilled: 0,
        semiSkilled: 0,
        unskilled: 0,
        supervisors: 0,
        overtimeHours: 0,
      },
      contractors: contractorBreakdown,
    };
  }

  async bulkRecordAttendance(
    tenant: TenantContext,
    user: any,
    payload: {
      siteId: number;
      attendanceDate: string;
      shift: string;
      entries: Array<{
        contractorId?: number;
        tradeCategory: string;
        skilledMale: number;
        skilledFemale: number;
        semiSkilledMale: number;
        semiSkilledFemale: number;
        unskilledMale: number;
        unskilledFemale: number;
        supervisors: number;
        overtimeHours?: number;
        workLocation?: string;
        remarks?: string;
      }>;
    }
  ) {
    if (!payload.entries || payload.entries.length === 0) {
      throw new BadRequestException('Attendance entries list cannot be empty');
    }

    const attendanceDate = payload.attendanceDate
      ? new Date(payload.attendanceDate)
      : new Date();

    const createdRows = [];

    for (const ent of payload.entries) {
      const sm = Number(ent.skilledMale) || 0;
      const sf = Number(ent.skilledFemale) || 0;
      const ssm = Number(ent.semiSkilledMale) || 0;
      const ssf = Number(ent.semiSkilledFemale) || 0;
      const um = Number(ent.unskilledMale) || 0;
      const uf = Number(ent.unskilledFemale) || 0;
      const sup = Number(ent.supervisors) || 0;
      const totalWorkers = sm + sf + ssm + ssf + um + uf + sup;

      if (totalWorkers === 0) continue; // Skip zero attendance lines

      const uuid = uuidv4();
      await this.databaseService.db.insert(labourAttendance).values({
        uuid,
        tenantId: tenant.id,
        siteId: Number(payload.siteId),
        contractorId: ent.contractorId ? Number(ent.contractorId) : null,
        attendanceDate,
        shift: payload.shift || 'Day',
        tradeCategory: ent.tradeCategory || 'General Civil',
        skilledMale: sm,
        skilledFemale: sf,
        semiSkilledMale: ssm,
        semiSkilledFemale: ssf,
        unskilledMale: um,
        unskilledFemale: uf,
        supervisors: sup,
        totalWorkers,
        overtimeHours: (Number(ent.overtimeHours) || 0).toFixed(2),
        workLocation: ent.workLocation || null,
        remarks: ent.remarks || null,
        recordedById: user.id,
      });

      createdRows.push(uuid);
    }

    return {
      success: true,
      count: createdRows.length,
      siteId: payload.siteId,
      attendanceDate,
    };
  }
}
