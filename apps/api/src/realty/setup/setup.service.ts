import {
  Injectable,
  NotFoundException,
  BadRequestException,
  OnModuleInit,
} from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import {
  reProjectSettings,
  rePhases,
  reWings,
  reFloors,
  reUnitTypes,
  reUnits,
  reParkingSlots,
  reChargeHeads,
  rePayStages,
  reSchemes,
  reSchemeStages,
  reSalesDropdownMasters,
  sites,
  companies,
} from '../../database/schema';
import { eq, and, asc, desc, sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { validateSchemeStages, SchemeStageInput } from './scheme-validation.util';

@Injectable()
export class SetupService implements OnModuleInit {
  constructor(private readonly dbService: DatabaseService) {}

  async onModuleInit() {
    try {
      await this.dbService.db.execute(sql`
        CREATE TABLE IF NOT EXISTS re_sales_dropdown_masters (
          id BIGINT AUTO_INCREMENT PRIMARY KEY,
          uuid VARCHAR(36) NOT NULL UNIQUE,
          tenant_id BIGINT NOT NULL,
          category VARCHAR(50) NOT NULL,
          code VARCHAR(50) NOT NULL,
          name VARCHAR(100) NOT NULL,
          description TEXT,
          color VARCHAR(30) DEFAULT 'primary',
          sequence INT NOT NULL DEFAULT 0,
          active TINYINT(1) NOT NULL DEFAULT 1,
          is_default TINYINT(1) NOT NULL DEFAULT 0,
          metadata JSON,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX re_sales_dm_cat_idx (tenant_id, category),
          UNIQUE KEY re_sales_dm_uniq_idx (tenant_id, category, code)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      await this.dbService.db.execute(sql`
        CREATE TABLE IF NOT EXISTS companies (
          id BIGINT AUTO_INCREMENT PRIMARY KEY,
          uuid VARCHAR(36) NOT NULL UNIQUE,
          tenant_id BIGINT NOT NULL,
          code VARCHAR(50) NOT NULL,
          name VARCHAR(255) NOT NULL,
          legal_name VARCHAR(255),
          cin VARCHAR(25),
          gstin VARCHAR(15),
          pan VARCHAR(10),
          address TEXT,
          city VARCHAR(100) DEFAULT 'Mumbai',
          state_code VARCHAR(2) DEFAULT '27',
          pincode VARCHAR(10),
          email VARCHAR(150),
          phone VARCHAR(20),
          bank_name VARCHAR(100),
          bank_account_no VARCHAR(50),
          bank_ifsc VARCHAR(20),
          bank_branch VARCHAR(100),
          logo_url TEXT,
          status ENUM('active', 'inactive') DEFAULT 'active' NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
          deleted_at TIMESTAMP NULL,
          INDEX company_tenant_idx (tenant_id),
          UNIQUE KEY tenant_company_code_idx (tenant_id, code)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      const existing = await this.dbService.db
        .select({ count: sql<number>`count(*)` })
        .from(reSalesDropdownMasters);
      if (Number(existing[0]?.count || 0) === 0) {
        await this.seedDefaultSalesMasters(1);
      }
    } catch (err) {
      console.error('Failed to initialize re_sales_dropdown_masters:', err);
    }
  }

  // ═════════════════════════════════════════════════════════════════════════
  // 1. PROJECT SETTINGS
  // ═════════════════════════════════════════════════════════════════════════
  async getProjectSettings(tenantId: number, siteId: number) {
    const [site] = await this.dbService.db
      .select()
      .from(sites)
      .where(and(eq(sites.tenantId, tenantId), eq(sites.id, siteId)))
      .limit(1);

    if (!site) {
      throw new NotFoundException(`Site ID ${siteId} not found for this tenant`);
    }

    const [settings] = await this.dbService.db
      .select()
      .from(reProjectSettings)
      .where(eq(reProjectSettings.siteId, siteId))
      .limit(1);

    return {
      site,
      settings: settings || null,
    };
  }

  async upsertProjectSettings(tenantId: number, siteId: number, data: Partial<typeof reProjectSettings.$inferInsert>) {
    const [site] = await this.dbService.db
      .select()
      .from(sites)
      .where(and(eq(sites.tenantId, tenantId), eq(sites.id, siteId)))
      .limit(1);

    if (!site) {
      throw new NotFoundException(`Site ID ${siteId} not found`);
    }

    const [existing] = await this.dbService.db
      .select()
      .from(reProjectSettings)
      .where(eq(reProjectSettings.siteId, siteId))
      .limit(1);

    if (existing) {
      await this.dbService.db
        .update(reProjectSettings)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(reProjectSettings.id, existing.id));

      const [updated] = await this.dbService.db
        .select()
        .from(reProjectSettings)
        .where(eq(reProjectSettings.id, existing.id));
      return updated;
    } else {
      await this.dbService.db.insert(reProjectSettings).values({
        uuid: uuidv4(),
        siteId,
        reraNo: data.reraNo,
        launchDate: data.launchDate,
        possessionDate: data.possessionDate,
        stampDutyPct: data.stampDutyPct ? String(data.stampDutyPct) : '6.0000',
        metroCessPct: data.metroCessPct ? String(data.metroCessPct) : '0.0000',
        registrationPct: data.registrationPct ? String(data.registrationPct) : '1.0000',
        registrationCap: data.registrationCap ? String(data.registrationCap) : '30000.00',
        interestRatePa: data.interestRatePa ? String(data.interestRatePa) : undefined,
        interestGraceDays: data.interestGraceDays ?? 10,
        gstRateUnderConstruction: data.gstRateUnderConstruction ? String(data.gstRateUnderConstruction) : '5.0000',
        holdHoursDefault: data.holdHoursDefault ?? 48,
        cpTagValidityDays: data.cpTagValidityDays ?? 60,
        letterheadHtml: data.letterheadHtml,
        bankDetailsText: data.bankDetailsText,
      });

      const [created] = await this.dbService.db
        .select()
        .from(reProjectSettings)
        .where(eq(reProjectSettings.siteId, siteId));
      return created;
    }
  }

  // ═════════════════════════════════════════════════════════════════════════
  // 2. PHASES, WINGS & FLOORS
  // ═════════════════════════════════════════════════════════════════════════
  async getPhases(tenantId: number, siteId?: number) {
    if (siteId) {
      return this.dbService.db
        .select()
        .from(rePhases)
        .where(and(eq(rePhases.tenantId, tenantId), eq(rePhases.siteId, siteId)))
        .orderBy(asc(rePhases.name));
    }
    return this.dbService.db
      .select()
      .from(rePhases)
      .where(eq(rePhases.tenantId, tenantId))
      .orderBy(asc(rePhases.name));
  }

  async createPhase(tenantId: number, data: { siteId: number; name: string }, userId?: number) {
    const uuid = uuidv4();
    await this.dbService.db.insert(rePhases).values({
      uuid,
      tenantId,
      siteId: data.siteId,
      name: data.name,
      createdBy: userId,
    });
    const [created] = await this.dbService.db
      .select()
      .from(rePhases)
      .where(and(eq(rePhases.tenantId, tenantId), eq(rePhases.uuid, uuid)));
    return created;
  }

  async getWings(tenantId: number, phaseId?: number) {
    if (phaseId) {
      return this.dbService.db
        .select()
        .from(reWings)
        .where(and(eq(reWings.tenantId, tenantId), eq(reWings.phaseId, phaseId)))
        .orderBy(asc(reWings.name));
    }
    return this.dbService.db
      .select()
      .from(reWings)
      .where(eq(reWings.tenantId, tenantId))
      .orderBy(asc(reWings.name));
  }

  async createWing(
    tenantId: number,
    data: { phaseId: number; name: string; totalFloors: number; generateFloors?: boolean; groundFloor?: boolean },
    userId?: number,
  ) {
    const uuid = uuidv4();
    await this.dbService.db.insert(reWings).values({
      uuid,
      tenantId,
      phaseId: data.phaseId,
      name: data.name,
      totalFloors: data.totalFloors,
      createdBy: userId,
    });
    const [wing] = await this.dbService.db
      .select()
      .from(reWings)
      .where(and(eq(reWings.tenantId, tenantId), eq(reWings.uuid, uuid)));

    if (!wing) throw new BadRequestException('Failed to create wing');

    if (data.generateFloors !== false) {
      const floorsToInsert = [];
      if (data.groundFloor !== false) {
        floorsToInsert.push({
          uuid: uuidv4(),
          tenantId,
          wingId: wing.id,
          name: 'Ground Floor',
          levelNo: 0,
          createdBy: userId,
        });
      }
      for (let level = 1; level <= data.totalFloors; level++) {
        floorsToInsert.push({
          uuid: uuidv4(),
          tenantId,
          wingId: wing.id,
          name: `Floor ${level}`,
          levelNo: level,
          createdBy: userId,
        });
      }
      if (floorsToInsert.length > 0) {
        await this.dbService.db.insert(reFloors).values(floorsToInsert);
      }
    }

    return wing;
  }

  async getFloors(tenantId: number, wingId?: number) {
    if (wingId) {
      return this.dbService.db
        .select()
        .from(reFloors)
        .where(and(eq(reFloors.tenantId, tenantId), eq(reFloors.wingId, wingId)))
        .orderBy(asc(reFloors.levelNo));
    }
    return this.dbService.db
      .select()
      .from(reFloors)
      .where(eq(reFloors.tenantId, tenantId))
      .orderBy(asc(reFloors.levelNo));
  }

  async createBulkStructure(
    tenantId: number,
    data: {
      siteId: number;
      phaseName: string;
      wingName: string;
      totalFloors: number;
      groundFloor?: boolean;
    },
    userId?: number,
  ) {
    let [phase] = await this.dbService.db
      .select()
      .from(rePhases)
      .where(and(eq(rePhases.tenantId, tenantId), eq(rePhases.siteId, data.siteId), eq(rePhases.name, data.phaseName)))
      .limit(1);

    if (!phase) {
      phase = await this.createPhase(tenantId, { siteId: data.siteId, name: data.phaseName }, userId);
    }
    if (!phase) {
      throw new BadRequestException('Failed to create or locate phase');
    }

    const wing = await this.createWing(
      tenantId,
      {
        phaseId: phase.id,
        name: data.wingName,
        totalFloors: data.totalFloors,
        generateFloors: true,
        groundFloor: data.groundFloor ?? true,
      },
      userId,
    );

    const generatedFloors = await this.getFloors(tenantId, wing.id);

    return {
      phase,
      wing,
      floors: generatedFloors,
    };
  }

  // ═════════════════════════════════════════════════════════════════════════
  // 3. UNIT TYPES
  // ═════════════════════════════════════════════════════════════════════════
  async getUnitTypes(tenantId: number) {
    return this.dbService.db
      .select()
      .from(reUnitTypes)
      .where(eq(reUnitTypes.tenantId, tenantId))
      .orderBy(asc(reUnitTypes.code));
  }

  async createUnitType(
    tenantId: number,
    data: {
      code: string;
      name: string;
      category: 'RES' | 'COM';
      defaultCarpetArea?: number | string;
    },
    userId?: number,
  ) {
    const uuid = uuidv4();
    await this.dbService.db.insert(reUnitTypes).values({
      uuid,
      tenantId,
      code: data.code,
      name: data.name,
      category: data.category,
      defaultCarpetArea: data.defaultCarpetArea ? String(data.defaultCarpetArea) : undefined,
      createdBy: userId,
    });
    const [created] = await this.dbService.db
      .select()
      .from(reUnitTypes)
      .where(and(eq(reUnitTypes.tenantId, tenantId), eq(reUnitTypes.uuid, uuid)));
    return created;
  }

  async updateUnitType(tenantId: number, id: number, data: Partial<typeof reUnitTypes.$inferInsert>) {
    await this.dbService.db
      .update(reUnitTypes)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(and(eq(reUnitTypes.tenantId, tenantId), eq(reUnitTypes.id, id)));

    const [updated] = await this.dbService.db
      .select()
      .from(reUnitTypes)
      .where(and(eq(reUnitTypes.tenantId, tenantId), eq(reUnitTypes.id, id)));
    return updated;
  }

  // ═════════════════════════════════════════════════════════════════════════
  // 4. UNITS & BULK GENERATOR
  // ═════════════════════════════════════════════════════════════════════════
  async getUnits(
    tenantId: number,
    query: { siteId?: number | undefined; wingId?: number | undefined; floorId?: number | undefined; status?: string | undefined },
  ) {
    const conditions = [eq(reUnits.tenantId, tenantId)];
    if (query.siteId) conditions.push(eq(reUnits.siteId, query.siteId));
    if (query.wingId) conditions.push(eq(reUnits.wingId, query.wingId));
    if (query.floorId) conditions.push(eq(reUnits.floorId, query.floorId));
    if (query.status) conditions.push(eq(reUnits.status, query.status as any));

    return this.dbService.db
      .select()
      .from(reUnits)
      .where(and(...conditions))
      .orderBy(asc(reUnits.unitNo));
  }

  async createUnit(tenantId: number, data: typeof reUnits.$inferInsert, userId?: number) {
    const uuid = uuidv4();
    await this.dbService.db.insert(reUnits).values({
      ...data,
      uuid,
      tenantId,
      createdBy: userId,
    });
    const [created] = await this.dbService.db
      .select()
      .from(reUnits)
      .where(and(eq(reUnits.tenantId, tenantId), eq(reUnits.uuid, uuid)));
    return created;
  }

  async bulkGenerateUnits(
    tenantId: number,
    data: {
      siteId: number;
      wingId: number;
      units: Array<{
        floorId: number;
        unitNo: string;
        unitTypeId: number;
        carpetArea?: number;
        balconyArea?: number;
        saleableArea?: number;
        facing?: string;
        baseRate?: number;
        floorRiseRate?: number;
        plcAmount?: number;
      }>;
    },
    userId?: number,
  ) {
    if (!data.units || data.units.length === 0) {
      throw new BadRequestException('No units provided for generation');
    }

    const rowsToInsert = data.units.map((u) => ({
      uuid: uuidv4(),
      tenantId,
      siteId: data.siteId,
      wingId: data.wingId,
      floorId: u.floorId,
      unitNo: u.unitNo,
      unitTypeId: u.unitTypeId,
      carpetArea: u.carpetArea ? String(u.carpetArea) : undefined,
      balconyArea: u.balconyArea ? String(u.balconyArea) : undefined,
      saleableArea: u.saleableArea ? String(u.saleableArea) : undefined,
      facing: u.facing,
      baseRate: u.baseRate ? String(u.baseRate) : undefined,
      floorRiseRate: u.floorRiseRate ? String(u.floorRiseRate) : undefined,
      plcAmount: u.plcAmount ? String(u.plcAmount) : undefined,
      status: 'available' as const,
      createdBy: userId,
    }));

    await this.dbService.db.insert(reUnits).values(rowsToInsert);

    return {
      success: true,
      count: rowsToInsert.length,
    };
  }

  // ═════════════════════════════════════════════════════════════════════════
  // 5. PARKING SLOTS
  // ═════════════════════════════════════════════════════════════════════════
  async getParkingSlots(tenantId: number, query: { siteId?: number | undefined; wingId?: number | undefined; status?: string | undefined }) {
    const conditions = [eq(reParkingSlots.tenantId, tenantId)];
    if (query.siteId) conditions.push(eq(reParkingSlots.siteId, query.siteId));
    if (query.wingId) conditions.push(eq(reParkingSlots.wingId, query.wingId));
    if (query.status) conditions.push(eq(reParkingSlots.status, query.status as any));

    return this.dbService.db
      .select()
      .from(reParkingSlots)
      .where(and(...conditions))
      .orderBy(asc(reParkingSlots.slotNo));
  }

  async createParkingSlot(
    tenantId: number,
    data: {
      siteId: number;
      wingId?: number;
      type: 'open' | 'stilt' | 'podium' | 'basement';
      slotNo: string;
      price: number;
    },
    userId?: number,
  ) {
    const uuid = uuidv4();
    await this.dbService.db.insert(reParkingSlots).values({
      uuid,
      tenantId,
      siteId: data.siteId,
      wingId: data.wingId,
      type: data.type,
      slotNo: data.slotNo,
      price: String(data.price),
      status: 'available',
      createdBy: userId,
    });
    const [created] = await this.dbService.db
      .select()
      .from(reParkingSlots)
      .where(and(eq(reParkingSlots.tenantId, tenantId), eq(reParkingSlots.uuid, uuid)));
    return created;
  }

  async bulkGenerateParkingSlots(
    tenantId: number,
    data: {
      siteId: number;
      wingId?: number;
      type: 'open' | 'stilt' | 'podium' | 'basement';
      prefix: string;
      from: number;
      to: number;
      price: number;
    },
    userId?: number,
  ) {
    const slots = [];
    for (let i = data.from; i <= data.to; i++) {
      const padNum = String(i).padStart(2, '0');
      slots.push({
        uuid: uuidv4(),
        tenantId,
        siteId: data.siteId,
        wingId: data.wingId,
        type: data.type,
        slotNo: `${data.prefix}-${padNum}`,
        price: String(data.price),
        status: 'available' as const,
        createdBy: userId,
      });
    }

    if (slots.length > 0) {
      await this.dbService.db.insert(reParkingSlots).values(slots);
    }

    return {
      success: true,
      count: slots.length,
    };
  }

  // ═════════════════════════════════════════════════════════════════════════
  // 6. CHARGE HEADS & PRICE LIST
  // ═════════════════════════════════════════════════════════════════════════
  async getChargeHeads(tenantId: number) {
    return this.dbService.db
      .select()
      .from(reChargeHeads)
      .where(eq(reChargeHeads.tenantId, tenantId))
      .orderBy(asc(reChargeHeads.sequence));
  }

  async createChargeHead(
    tenantId: number,
    data: {
      code: string;
      name: string;
      calcType: 'fixed' | 'per_sqft' | 'pct_of_agreement' | 'per_month';
      defaultValue?: number;
      gstApplicable?: boolean;
      gstRate?: number;
      sequence?: number;
    },
    userId?: number,
  ) {
    const uuid = uuidv4();
    await this.dbService.db.insert(reChargeHeads).values({
      uuid,
      tenantId,
      code: data.code,
      name: data.name,
      calcType: data.calcType,
      defaultValue: data.defaultValue ? String(data.defaultValue) : '0.00',
      gstApplicable: data.gstApplicable ?? false,
      gstRate: data.gstRate ? String(data.gstRate) : undefined,
      sequence: data.sequence ?? 0,
      createdBy: userId,
    });
    const [created] = await this.dbService.db
      .select()
      .from(reChargeHeads)
      .where(and(eq(reChargeHeads.tenantId, tenantId), eq(reChargeHeads.uuid, uuid)));
    return created;
  }

  async updateChargeHead(tenantId: number, id: number, data: Partial<typeof reChargeHeads.$inferInsert>) {
    await this.dbService.db
      .update(reChargeHeads)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(and(eq(reChargeHeads.tenantId, tenantId), eq(reChargeHeads.id, id)));

    const [updated] = await this.dbService.db
      .select()
      .from(reChargeHeads)
      .where(and(eq(reChargeHeads.tenantId, tenantId), eq(reChargeHeads.id, id)));
    return updated;
  }

  async deleteChargeHead(tenantId: number, id: number) {
    await this.dbService.db
      .delete(reChargeHeads)
      .where(and(eq(reChargeHeads.tenantId, tenantId), eq(reChargeHeads.id, id)));
    return { success: true };
  }

  // ═════════════════════════════════════════════════════════════════════════
  // 7. PAY STAGES & SCHEMES (100% RULE & COPY SCHEME)
  // ═════════════════════════════════════════════════════════════════════════
  async getPayStages(tenantId: number, siteId?: number) {
    if (siteId) {
      return this.dbService.db
        .select()
        .from(rePayStages)
        .where(and(eq(rePayStages.tenantId, tenantId), eq(rePayStages.siteId, siteId)))
        .orderBy(asc(rePayStages.sequence), asc(rePayStages.code));
    }
    return this.dbService.db
      .select()
      .from(rePayStages)
      .where(eq(rePayStages.tenantId, tenantId))
      .orderBy(asc(rePayStages.sequence), asc(rePayStages.code));
  }

  async createPayStage(tenantId: number, data: typeof rePayStages.$inferInsert, userId?: number) {
    const uuid = uuidv4();
    await this.dbService.db.insert(rePayStages).values({
      ...data,
      uuid,
      tenantId,
      createdBy: userId,
    });
    const [created] = await this.dbService.db
      .select()
      .from(rePayStages)
      .where(and(eq(rePayStages.tenantId, tenantId), eq(rePayStages.uuid, uuid)));
    return created;
  }

  async updatePayStage(tenantId: number, id: number, data: Partial<typeof rePayStages.$inferInsert>) {
    await this.dbService.db
      .update(rePayStages)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(and(eq(rePayStages.tenantId, tenantId), eq(rePayStages.id, id)));

    const [updated] = await this.dbService.db
      .select()
      .from(rePayStages)
      .where(and(eq(rePayStages.tenantId, tenantId), eq(rePayStages.id, id)));
    return updated;
  }

  async getSchemes(tenantId: number, siteId?: number) {
    if (siteId) {
      return this.dbService.db
        .select()
        .from(reSchemes)
        .where(and(eq(reSchemes.tenantId, tenantId), eq(reSchemes.siteId, siteId)))
        .orderBy(desc(reSchemes.createdAt));
    }
    return this.dbService.db
      .select()
      .from(reSchemes)
      .where(eq(reSchemes.tenantId, tenantId))
      .orderBy(desc(reSchemes.createdAt));
  }

  async getSchemeById(tenantId: number, id: number) {
    const [scheme] = await this.dbService.db
      .select()
      .from(reSchemes)
      .where(and(eq(reSchemes.tenantId, tenantId), eq(reSchemes.id, id)))
      .limit(1);

    if (!scheme) {
      throw new NotFoundException(`Scheme ID ${id} not found`);
    }

    const stages = await this.dbService.db
      .select({
        schemeId: reSchemeStages.schemeId,
        payStageId: reSchemeStages.payStageId,
        pct: reSchemeStages.pct,
        code: rePayStages.code,
        name: rePayStages.name,
        sequence: rePayStages.sequence,
        isConstructionLinked: rePayStages.isConstructionLinked,
        status: rePayStages.status,
      })
      .from(reSchemeStages)
      .innerJoin(rePayStages, eq(reSchemeStages.payStageId, rePayStages.id))
      .where(eq(reSchemeStages.schemeId, id))
      .orderBy(asc(rePayStages.sequence), asc(rePayStages.code));

    return {
      ...scheme,
      stages,
    };
  }

  async createScheme(
    tenantId: number,
    data: {
      siteId: number;
      name: string;
      gstMode: 'with' | 'without';
      unitTypeIds?: number[] | undefined;
      floorFrom?: number | undefined;
      floorTo?: number | undefined;
      stampByBuilder?: boolean | undefined;
      registrationByBuilder?: boolean | undefined;
      maxDiscountPct?: number | undefined;
      stages: SchemeStageInput[];
    },
    userId?: number,
  ) {
    const validation = validateSchemeStages(data.stages);
    if (!validation.valid) {
      throw new BadRequestException(validation.error);
    }

    const uuid = uuidv4();
    await this.dbService.db.insert(reSchemes).values({
      uuid,
      tenantId,
      siteId: data.siteId,
      name: data.name,
      gstMode: data.gstMode,
      unitTypeIds: data.unitTypeIds || [],
      floorFrom: data.floorFrom,
      floorTo: data.floorTo,
      stampByBuilder: data.stampByBuilder ?? false,
      registrationByBuilder: data.registrationByBuilder ?? false,
      maxDiscountPct: data.maxDiscountPct ? String(data.maxDiscountPct) : undefined,
      active: true,
      createdBy: userId,
    });

    const [scheme] = await this.dbService.db
      .select()
      .from(reSchemes)
      .where(and(eq(reSchemes.tenantId, tenantId), eq(reSchemes.uuid, uuid)));

    if (!scheme) throw new BadRequestException('Failed to create scheme');

    const stageRows = data.stages.map((s) => ({
      schemeId: scheme.id,
      payStageId: s.payStageId,
      pct: String(s.pct),
    }));

    await this.dbService.db.insert(reSchemeStages).values(stageRows);

    return this.getSchemeById(tenantId, scheme.id);
  }

  async copyScheme(tenantId: number, id: number, newName: string, userId?: number) {
    const original = await this.getSchemeById(tenantId, id);

    const stagesInput: SchemeStageInput[] = original.stages.map((s) => ({
      payStageId: s.payStageId,
      pct: s.pct,
    }));

    return this.createScheme(
      tenantId,
      {
        siteId: original.siteId,
        name: newName || `${original.name} (Copy)`,
        gstMode: original.gstMode,
        unitTypeIds: (original.unitTypeIds as number[]) || [],
        floorFrom: original.floorFrom ?? undefined,
        floorTo: original.floorTo ?? undefined,
        stampByBuilder: original.stampByBuilder,
        registrationByBuilder: original.registrationByBuilder,
        maxDiscountPct: original.maxDiscountPct ? Number(original.maxDiscountPct) : undefined,
        stages: stagesInput,
      },
      userId,
    );
  }

  async updateScheme(
    tenantId: number,
    id: number,
    data: Partial<typeof reSchemes.$inferInsert> & { stages?: SchemeStageInput[] },
  ) {
    const [existing] = await this.dbService.db
      .select()
      .from(reSchemes)
      .where(and(eq(reSchemes.tenantId, tenantId), eq(reSchemes.id, id)))
      .limit(1);

    if (!existing) {
      throw new NotFoundException(`Scheme ID ${id} not found`);
    }

    if (data.stages) {
      const validation = validateSchemeStages(data.stages);
      if (!validation.valid) {
        throw new BadRequestException(validation.error);
      }

      await this.dbService.db.delete(reSchemeStages).where(eq(reSchemeStages.schemeId, id));

      const stageRows = data.stages.map((s) => ({
        schemeId: id,
        payStageId: s.payStageId,
        pct: String(s.pct),
      }));
      await this.dbService.db.insert(reSchemeStages).values(stageRows);
    }

    const { stages, ...schemeData } = data;
    if (Object.keys(schemeData).length > 0) {
      await this.dbService.db
        .update(reSchemes)
        .set({
          ...schemeData,
          updatedAt: new Date(),
        })
        .where(eq(reSchemes.id, id));
    }

    return this.getSchemeById(tenantId, id);
  }

  // ═════════════════════════════════════════════════════════════════════════
  // 8. SALES DROPDOWN MASTERS
  // ═════════════════════════════════════════════════════════════════════════
  async getSalesMasters(tenantId: number, category?: string) {
    const conditions = [eq(reSalesDropdownMasters.tenantId, tenantId)];
    if (category) {
      conditions.push(eq(reSalesDropdownMasters.category, category));
    }
    return this.dbService.db
      .select()
      .from(reSalesDropdownMasters)
      .where(and(...conditions))
      .orderBy(asc(reSalesDropdownMasters.sequence), asc(reSalesDropdownMasters.name));
  }

  async createSalesMaster(
    tenantId: number,
    data: {
      category: string;
      code: string;
      name: string;
      description?: string;
      color?: string;
      sequence?: number;
      active?: boolean;
      metadata?: any;
    },
  ) {
    const uuid = uuidv4();
    await this.dbService.db.insert(reSalesDropdownMasters).values({
      uuid,
      tenantId,
      category: data.category,
      code: data.code.toLowerCase().trim().replace(/[^a-z0-9_]/g, '_'),
      name: data.name.trim(),
      description: data.description,
      color: data.color || 'primary',
      sequence: data.sequence ?? 0,
      active: data.active ?? true,
      metadata: data.metadata,
    });
    const [created] = await this.dbService.db
      .select()
      .from(reSalesDropdownMasters)
      .where(and(eq(reSalesDropdownMasters.tenantId, tenantId), eq(reSalesDropdownMasters.uuid, uuid)));
    return created;
  }

  async updateSalesMaster(
    tenantId: number,
    id: number,
    data: {
      name?: string;
      description?: string;
      color?: string;
      sequence?: number;
      active?: boolean;
      metadata?: any;
    },
  ) {
    await this.dbService.db
      .update(reSalesDropdownMasters)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(and(eq(reSalesDropdownMasters.tenantId, tenantId), eq(reSalesDropdownMasters.id, id)));
    const [updated] = await this.dbService.db
      .select()
      .from(reSalesDropdownMasters)
      .where(and(eq(reSalesDropdownMasters.tenantId, tenantId), eq(reSalesDropdownMasters.id, id)));
    return updated;
  }

  async deleteSalesMaster(tenantId: number, id: number) {
    await this.dbService.db
      .delete(reSalesDropdownMasters)
      .where(and(eq(reSalesDropdownMasters.tenantId, tenantId), eq(reSalesDropdownMasters.id, id)));
    return { success: true, id };
  }

  async seedDefaultSalesMasters(tenantId: number) {
    const defaults = [
      // 1. Lead Stages
      { category: 'lead_stage', code: 'new', name: 'New Inquiry', color: 'primary', sequence: 1 },
      { category: 'lead_stage', code: 'contacted', name: 'Contacted', color: 'info', sequence: 2 },
      { category: 'lead_stage', code: 'site_visit_scheduled', name: 'Site Visit Scheduled', color: 'warning', sequence: 3 },
      { category: 'lead_stage', code: 'site_visit_done', name: 'Site Visit Completed', color: 'secondary', sequence: 4 },
      { category: 'lead_stage', code: 'negotiation', name: 'Negotiation / Price Offer', color: 'purple', sequence: 5 },
      { category: 'lead_stage', code: 'booked', name: 'Deal Closed / Booked', color: 'success', sequence: 6 },
      { category: 'lead_stage', code: 'lost', name: 'Lost / Disqualified', color: 'danger', sequence: 7 },

      // 2. Lead Sources
      { category: 'lead_source', code: 'walk_in', name: 'Direct Walk-in', color: 'success', sequence: 1 },
      { category: 'lead_source', code: 'google_ads', name: 'Google Ads (Search & PPC)', color: 'primary', sequence: 2 },
      { category: 'lead_source', code: 'magicbricks', name: 'MagicBricks Portal', color: 'danger', sequence: 3 },
      { category: 'lead_source', code: '99acres', name: '99acres Portal', color: 'info', sequence: 4 },
      { category: 'lead_source', code: 'facebook_ads', name: 'Meta / Instagram Ads', color: 'blue', sequence: 5 },
      { category: 'lead_source', code: 'channel_partner', name: 'Channel Partner (CP Broker)', color: 'purple', sequence: 6 },
      { category: 'lead_source', code: 'referral', name: 'Customer Referral', color: 'amber', sequence: 7 },
      { category: 'lead_source', code: 'newspaper', name: 'Newspaper Print Campaign', color: 'gray', sequence: 8 },
      { category: 'lead_source', code: 'hoarding', name: 'Outdoor Hoarding / Billboard', color: 'emerald', sequence: 9 },

      // 3. Purchase Purposes
      { category: 'purchase_purpose', code: 'end_use', name: 'Self / End Use (Primary Home)', color: 'primary', sequence: 1 },
      { category: 'purchase_purpose', code: 'investment', name: 'Pure Investment (Capital Gain)', color: 'success', sequence: 2 },
      { category: 'purchase_purpose', code: 'rental_income', name: 'Rental Income / Yield', color: 'info', sequence: 3 },
      { category: 'purchase_purpose', code: 'second_home', name: 'Second Home / Vacation', color: 'amber', sequence: 4 },

      // 4. Interaction / Follow-up Types
      { category: 'interaction_type', code: 'call', name: 'Phone Call', color: 'primary', sequence: 1 },
      { category: 'interaction_type', code: 'whatsapp', name: 'WhatsApp Chat', color: 'success', sequence: 2 },
      { category: 'interaction_type', code: 'meeting', name: 'In-Person Sales Lounge Meeting', color: 'indigo', sequence: 3 },
      { category: 'interaction_type', code: 'email', name: 'Email Correspondence', color: 'blue', sequence: 4 },
      { category: 'interaction_type', code: 'video_call', name: 'Virtual Video Tour', color: 'purple', sequence: 5 },
      { category: 'interaction_type', code: 'site_visit', name: 'Site / Sample Flat Tour', color: 'emerald', sequence: 6 },

      // 5. Loss / Disqualification Reasons
      { category: 'loss_reason', code: 'budget_mismatch', name: 'High Price / Budget Out of Range', color: 'danger', sequence: 1 },
      { category: 'loss_reason', code: 'location_connectivity', name: 'Location / Distant Commute', color: 'warning', sequence: 2 },
      { category: 'loss_reason', code: 'layout_size', name: 'Carpet Area / Floor Plan Layout Disliked', color: 'amber', sequence: 3 },
      { category: 'loss_reason', code: 'delayed_possession', name: 'Possession Date Too Far', color: 'orange', sequence: 4 },
      { category: 'loss_reason', code: 'competitor', name: 'Booked with Competitor Developer', color: 'purple', sequence: 5 },
      { category: 'loss_reason', code: 'loan_rejected', name: 'Bank Home Loan Rejected', color: 'red', sequence: 6 },
      { category: 'loss_reason', code: 'vaastu', name: 'Vaastu / Facing Non-Compliant', color: 'gray', sequence: 7 },

      // 6. Site Visit Ratings
      { category: 'visit_rating', code: '5_star', name: '5 Stars - Extremely High (Ready to Book)', color: 'success', sequence: 1 },
      { category: 'visit_rating', code: '4_star', name: '4 Stars - Very Interested (Family Review)', color: 'primary', sequence: 2 },
      { category: 'visit_rating', code: '3_star', name: '3 Stars - Moderate (Comparing Projects)', color: 'warning', sequence: 3 },
      { category: 'visit_rating', code: '2_star', name: '2 Stars - Casual / Exploring Market', color: 'amber', sequence: 4 },
      { category: 'visit_rating', code: '1_star', name: '1 Star - Not Interested / Low Fit', color: 'danger', sequence: 5 },

      // 7. Unit Configurations
      { category: 'unit_type', code: '1RK', name: '1 RK Compact', color: 'gray', sequence: 1, metadata: { carpet: 203, category: 'RES' } },
      { category: 'unit_type', code: '1BHK', name: '1 BHK Smart', color: 'blue', sequence: 2, metadata: { carpet: 300, category: 'RES' } },
      { category: 'unit_type', code: '2BHK', name: '2 BHK Deluxe', color: 'primary', sequence: 3, metadata: { carpet: 650, category: 'RES' } },
      { category: 'unit_type', code: '3BHK', name: '3 BHK Premium Luxury', color: 'purple', sequence: 4, metadata: { carpet: 1050, category: 'RES' } },
      { category: 'unit_type', code: '4BHK', name: '4 BHK Sky Penthouse', color: 'amber', sequence: 5, metadata: { carpet: 1850, category: 'RES' } },
      { category: 'unit_type', code: 'COMM_SHOP', name: 'Retail Commercial Shop', color: 'emerald', sequence: 6, metadata: { carpet: 350, category: 'COM' } },
      { category: 'unit_type', code: 'COMM_OFFICE', name: 'Corporate Office Space', color: 'indigo', sequence: 7, metadata: { carpet: 850, category: 'COM' } },

      // 8. CP Tiers
      { category: 'cp_tier', code: 'silver', name: 'Silver Tier (Base 2.0%)', color: 'gray', sequence: 1, metadata: { pct: 2.0 } },
      { category: 'cp_tier', code: 'gold', name: 'Gold Tier (Preferred 2.5%)', color: 'amber', sequence: 2, metadata: { pct: 2.5 } },
      { category: 'cp_tier', code: 'platinum', name: 'Platinum Tier (Elite 3.0%)', color: 'purple', sequence: 3, metadata: { pct: 3.0 } },

      // 9. Booking Statuses
      { category: 'booking_status', code: 'booked', name: 'Booked (Token Advance Received)', color: 'primary', sequence: 1 },
      { category: 'booking_status', code: 'pending_approval', name: 'Pending Management Approval', color: 'warning', sequence: 2 },
      { category: 'booking_status', code: 'agreement', name: 'Agreement For Sale Executed', color: 'indigo', sequence: 3 },
      { category: 'booking_status', code: 'registered', name: 'Registered with Sub-Registrar', color: 'purple', sequence: 4 },
      { category: 'booking_status', code: 'possession', name: 'Key Handover & Possession Given', color: 'success', sequence: 5 },
      { category: 'booking_status', code: 'cancelled', name: 'Booking Cancelled / Refunded', color: 'danger', sequence: 6 },
    ];

    for (const d of defaults) {
      await this.dbService.db.insert(reSalesDropdownMasters).values({
        uuid: uuidv4(),
        tenantId,
        category: d.category,
        code: d.code,
        name: d.name,
        color: d.color,
        sequence: d.sequence,
        active: true,
        isDefault: true,
        metadata: (d as any).metadata,
      });
    }
  }

  // ═════════════════════════════════════════════════════════════════════════
  // 11. COMPANIES (Subsidiaries / Legal Entities under Tenant)
  // ═════════════════════════════════════════════════════════════════════════
  async getCompanies(tenantId: number) {
    const companyList = await this.dbService.db
      .select()
      .from(companies)
      .where(eq(companies.tenantId, tenantId))
      .orderBy(asc(companies.name));

    // Get project counts for each company
    const sitesList = await this.dbService.db
      .select({
        id: sites.id,
        name: sites.name,
        code: sites.code,
        companyId: sites.companyId,
      })
      .from(sites)
      .where(eq(sites.tenantId, tenantId));

    return companyList.map((c) => {
      const linkedSites = sitesList.filter((s) => s.companyId === c.id);
      return {
        ...c,
        projectsCount: linkedSites.length,
        projects: linkedSites,
      };
    });
  }

  async getCompanyById(tenantId: number, id: number) {
    const [c] = await this.dbService.db
      .select()
      .from(companies)
      .where(and(eq(companies.tenantId, tenantId), eq(companies.id, id)));

    if (!c) throw new NotFoundException('Company not found');

    const linkedSites = await this.dbService.db
      .select({
        id: sites.id,
        name: sites.name,
        code: sites.code,
      })
      .from(sites)
      .where(and(eq(sites.tenantId, tenantId), eq(sites.companyId, id)));

    return {
      ...c,
      projectsCount: linkedSites.length,
      projects: linkedSites,
    };
  }

  async createCompany(tenantId: number, data: any) {
    if (!data.name || !data.code) {
      throw new BadRequestException('Company name and code are required');
    }
    const cleanCode = String(data.code).toUpperCase().trim().replace(/[^A-Z0-9_]/g, '_');

    const [existing] = await this.dbService.db
      .select()
      .from(companies)
      .where(and(eq(companies.tenantId, tenantId), eq(companies.code, cleanCode)));

    if (existing) {
      throw new BadRequestException(`Company code '${cleanCode}' already exists`);
    }

    const uuid = uuidv4();
    await this.dbService.db.insert(companies).values({
      uuid,
      tenantId,
      code: cleanCode,
      name: data.name,
      legalName: data.legalName || data.name,
      cin: data.cin || null,
      gstin: data.gstin || null,
      pan: data.pan || null,
      address: data.address || null,
      city: data.city || 'Mumbai',
      stateCode: data.stateCode || '27',
      pincode: data.pincode || null,
      email: data.email || null,
      phone: data.phone || null,
      bankName: data.bankName || null,
      bankAccountNo: data.bankAccountNo || null,
      bankIfsc: data.bankIfsc || null,
      bankBranch: data.bankBranch || null,
      logoUrl: data.logoUrl || null,
      status: data.status || 'active',
    });

    const [created] = await this.dbService.db
      .select()
      .from(companies)
      .where(and(eq(companies.tenantId, tenantId), eq(companies.uuid, uuid)));

    return created;
  }

  async updateCompany(tenantId: number, id: number, data: any) {
    const [existing] = await this.dbService.db
      .select()
      .from(companies)
      .where(and(eq(companies.tenantId, tenantId), eq(companies.id, id)));

    if (!existing) throw new NotFoundException('Company not found');

    const updateValues: Record<string, any> = {};
    if (data.name !== undefined) updateValues.name = data.name;
    if (data.legalName !== undefined) updateValues.legalName = data.legalName;
    if (data.cin !== undefined) updateValues.cin = data.cin;
    if (data.gstin !== undefined) updateValues.gstin = data.gstin;
    if (data.pan !== undefined) updateValues.pan = data.pan;
    if (data.address !== undefined) updateValues.address = data.address;
    if (data.city !== undefined) updateValues.city = data.city;
    if (data.stateCode !== undefined) updateValues.stateCode = data.stateCode;
    if (data.pincode !== undefined) updateValues.pincode = data.pincode;
    if (data.email !== undefined) updateValues.email = data.email;
    if (data.phone !== undefined) updateValues.phone = data.phone;
    if (data.bankName !== undefined) updateValues.bankName = data.bankName;
    if (data.bankAccountNo !== undefined) updateValues.bankAccountNo = data.bankAccountNo;
    if (data.bankIfsc !== undefined) updateValues.bankIfsc = data.bankIfsc;
    if (data.bankBranch !== undefined) updateValues.bankBranch = data.bankBranch;
    if (data.logoUrl !== undefined) updateValues.logoUrl = data.logoUrl;
    if (data.status !== undefined) updateValues.status = data.status;

    if (Object.keys(updateValues).length > 0) {
      await this.dbService.db
        .update(companies)
        .set(updateValues)
        .where(and(eq(companies.tenantId, tenantId), eq(companies.id, id)));
    }

    const [updated] = await this.dbService.db
      .select()
      .from(companies)
      .where(and(eq(companies.tenantId, tenantId), eq(companies.id, id)));

    return updated;
  }

  async deleteCompany(tenantId: number, id: number) {
    const [c] = await this.dbService.db
      .select()
      .from(companies)
      .where(and(eq(companies.tenantId, tenantId), eq(companies.id, id)));

    if (!c) throw new NotFoundException('Company not found');

    // Check if sites are linked
    const linkedSites = await this.dbService.db
      .select({ count: sql<number>`count(*)` })
      .from(sites)
      .where(and(eq(sites.tenantId, tenantId), eq(sites.companyId, id)));

    if (Number(linkedSites[0]?.count || 0) > 0) {
      // Soft-deactivate instead of deleting
      await this.dbService.db
        .update(companies)
        .set({ status: 'inactive' })
        .where(and(eq(companies.tenantId, tenantId), eq(companies.id, id)));
      return { message: 'Company deactivated because projects are linked to it' };
    }

    await this.dbService.db
      .delete(companies)
      .where(and(eq(companies.tenantId, tenantId), eq(companies.id, id)));

    return { message: 'Company deleted successfully' };
  }
}
