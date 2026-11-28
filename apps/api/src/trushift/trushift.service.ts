import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import { randomUUID } from 'crypto';
import { and, desc, eq, isNull, like, or } from 'drizzle-orm';
import { DatabaseService } from '../database/database.service';
import {
  auditLogs,
  companies,
  roles,
  sites,
  staffAttendanceLogs,
  users,
  userSites,
} from '../database/schema';
import { TenantContext } from '../common/middleware/tenant.middleware';
import { PunchAttendanceDto } from './dto/punch-attendance.dto';
import {
  calculateHaversineDistanceMeters,
  hasValidCoordinates,
} from './geofence.util';

const MAX_PHOTO_BYTES = 5 * 1024 * 1024; // 5 MB
const PHOTO_FILENAME_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$/;

@Injectable()
export class TrushiftService {
  private readonly uploadsDir = path.resolve(process.cwd(), 'uploads', 'attendance');

  constructor(private readonly databaseService: DatabaseService) {}

  async getAssignedSites(tenant: TenantContext, userId: number) {
    const profileStatus = await this.getUserProfileStatus(userId);

    const rows = await this.databaseService.db
      .select({
        id: sites.id,
        uuid: sites.uuid,
        code: sites.code,
        name: sites.name,
        companyId: sites.companyId,
        companyName: companies.name,
        address: sites.address,
        city: sites.city,
        latitude: sites.latitude,
        longitude: sites.longitude,
        geofenceRadius: sites.geofenceRadius,
        status: sites.status,
      })
      .from(userSites)
      .innerJoin(sites, eq(userSites.siteId, sites.id))
      .leftJoin(companies, eq(sites.companyId, companies.id))
      .where(
        and(
          eq(userSites.userId, userId),
          eq(sites.tenantId, tenant.id),
          isNull(sites.deletedAt),
        ),
      )
      .orderBy(sites.name);

    return {
      profileCompleted: profileStatus.profileCompleted,
      sites: rows.map((row) => ({
        ...row,
        hasCoordinates: hasValidCoordinates(row.latitude, row.longitude),
      })),
    };
  }

  async getLogs(
    tenant: TenantContext,
    filter?: {
      siteId?: number;
      userId?: number;
      punchType?: string;
      search?: string;
    },
  ) {
    const conditions = [eq(staffAttendanceLogs.tenantId, tenant.id)];

    if (filter?.siteId) {
      conditions.push(eq(staffAttendanceLogs.siteId, filter.siteId));
    }
    if (filter?.userId) {
      conditions.push(eq(staffAttendanceLogs.userId, filter.userId));
    }
    if (filter?.punchType === 'check_in' || filter?.punchType === 'check_out') {
      conditions.push(eq(staffAttendanceLogs.punchType, filter.punchType));
    }
    if (filter?.search?.trim()) {
      const term = `%${filter.search.trim()}%`;
      conditions.push(
        or(
          like(users.fullName, term),
          like(users.username, term),
          like(sites.name, term),
          like(sites.code, term),
        )!,
      );
    }

    const rows = await this.databaseService.db
      .select({
        id: staffAttendanceLogs.id,
        uuid: staffAttendanceLogs.uuid,
        userId: staffAttendanceLogs.userId,
        staffName: users.fullName,
        username: users.username,
        roleName: roles.name,
        siteId: staffAttendanceLogs.siteId,
        siteCode: sites.code,
        siteName: sites.name,
        companyName: companies.name,
        punchType: staffAttendanceLogs.punchType,
        latitude: staffAttendanceLogs.latitude,
        longitude: staffAttendanceLogs.longitude,
        distanceMeters: staffAttendanceLogs.distanceMeters,
        geofenceRadiusMeters: staffAttendanceLogs.geofenceRadiusMeters,
        geofenceVerified: staffAttendanceLogs.geofenceVerified,
        photoUrl: staffAttendanceLogs.photoUrl,
        remarks: staffAttendanceLogs.remarks,
        punchedAt: staffAttendanceLogs.punchedAt,
      })
      .from(staffAttendanceLogs)
      .innerJoin(users, eq(staffAttendanceLogs.userId, users.id))
      .leftJoin(roles, eq(users.roleId, roles.id))
      .innerJoin(sites, eq(staffAttendanceLogs.siteId, sites.id))
      .leftJoin(companies, eq(sites.companyId, companies.id))
      .where(and(...conditions))
      .orderBy(desc(staffAttendanceLogs.punchedAt), desc(staffAttendanceLogs.id))
      .limit(200);

    return {
      logs: rows,
      summary: {
        total: rows.length,
        verified: rows.filter((r) => Boolean(r.geofenceVerified)).length,
        checkIns: rows.filter((r) => r.punchType === 'check_in').length,
        checkOuts: rows.filter((r) => r.punchType === 'check_out').length,
      },
    };
  }

  async punchAttendance(
    tenant: TenantContext,
    user: { id: number },
    dto: PunchAttendanceDto,
  ) {
    // 1. Enforce completed profile before allowing attendance
    const profileStatus = await this.getUserProfileStatus(user.id);
    if (!profileStatus.profileCompleted) {
      throw new ForbiddenException(
        'Please complete your first-login profile setup before marking attendance.',
      );
    }

    // 2. Verify user is assigned to the requested site in user_sites
    const [assignedSite] = await this.databaseService.db
      .select({
        siteId: sites.id,
        siteCode: sites.code,
        siteName: sites.name,
        siteStatus: sites.status,
        latitude: sites.latitude,
        longitude: sites.longitude,
        geofenceRadius: sites.geofenceRadius,
      })
      .from(userSites)
      .innerJoin(sites, eq(userSites.siteId, sites.id))
      .where(
        and(
          eq(userSites.userId, user.id),
          eq(userSites.siteId, dto.siteId),
          eq(sites.tenantId, tenant.id),
          isNull(sites.deletedAt),
        ),
      )
      .limit(1);

    if (!assignedSite) {
      throw new ForbiddenException(
        'Attendance rejected: you are not assigned to the selected site.',
      );
    }

    if (assignedSite.siteStatus !== 'active') {
      throw new BadRequestException(
        `Attendance rejected: site "${assignedSite.siteName}" is currently ${assignedSite.siteStatus}.`,
      );
    }

    // 3. Verify site GPS coordinates are configured
    if (!hasValidCoordinates(assignedSite.latitude, assignedSite.longitude)) {
      throw new BadRequestException(
        `Attendance rejected: GPS coordinates are not configured for site "${assignedSite.siteName}".`,
      );
    }

    const siteLat = Number(assignedSite.latitude);
    const siteLng = Number(assignedSite.longitude);
    const allowedRadiusMeters = Number(assignedSite.geofenceRadius) || 200;

    // 4. Compute Haversine distance and enforce geofence
    const distanceMeters = calculateHaversineDistanceMeters(
      dto.latitude,
      dto.longitude,
      siteLat,
      siteLng,
    );

    if (distanceMeters > allowedRadiusMeters) {
      throw new BadRequestException(
        `Attendance rejected: your location is ${Math.round(distanceMeters)}m away from ${assignedSite.siteName} (allowed radius: ${allowedRadiusMeters}m).`,
      );
    }

    // 5. Decode, validate, and store watermarked attendance photo
    const { buffer, ext } = this.parseAndValidatePhotoDataUrl(dto.photoDataUrl);
    await fs.mkdir(this.uploadsDir, { recursive: true });

    const uuid = randomUUID();
    const filename = `${uuid}.${ext}`;
    const filePath = path.join(this.uploadsDir, filename);
    await fs.writeFile(filePath, buffer);

    const photoUrl = `/api/v1/trushift/photos/${filename}`;
    const punchType = dto.punchType || 'check_in';
    const now = new Date();

    await this.databaseService.db.insert(staffAttendanceLogs).values({
      uuid,
      tenantId: tenant.id,
      userId: user.id,
      siteId: assignedSite.siteId,
      punchType,
      latitude: dto.latitude.toFixed(7),
      longitude: dto.longitude.toFixed(7),
      distanceMeters: distanceMeters.toFixed(2),
      geofenceRadiusMeters: allowedRadiusMeters,
      geofenceVerified: true,
      photoUrl,
      remarks: dto.remarks?.trim() || null,
      punchedAt: now,
    });

    await this.databaseService.db.insert(auditLogs).values({
      tenantId: tenant.id,
      userId: user.id,
      action: 'trushift.attendance_punch',
      entity: 'staff_attendance_log',
      entityId: uuid,
      diffJson: {
        siteId: assignedSite.siteId,
        siteCode: assignedSite.siteCode,
        punchType,
        distanceMeters: Number(distanceMeters.toFixed(2)),
        allowedRadiusMeters,
        photoUrl,
      },
    });

    return {
      uuid,
      userId: user.id,
      staffName: profileStatus.fullName,
      siteId: assignedSite.siteId,
      siteCode: assignedSite.siteCode,
      siteName: assignedSite.siteName,
      punchType,
      latitude: dto.latitude.toFixed(7),
      longitude: dto.longitude.toFixed(7),
      distanceMeters: Number(distanceMeters.toFixed(2)),
      geofenceRadiusMeters: allowedRadiusMeters,
      geofenceVerified: true,
      photoUrl,
      remarks: dto.remarks?.trim() || null,
      punchedAt: now,
    };
  }

  async resolvePhotoPath(filename: string): Promise<{ filePath: string; contentType: string }> {
    if (!PHOTO_FILENAME_REGEX.test(filename)) {
      throw new BadRequestException('Invalid attendance photo filename.');
    }

    const resolved = path.resolve(this.uploadsDir, filename);
    if (!resolved.startsWith(this.uploadsDir + path.sep)) {
      throw new BadRequestException('Invalid attendance photo path.');
    }

    try {
      await fs.access(resolved);
    } catch {
      throw new NotFoundException('Attendance photo not found.');
    }

    const ext = path.extname(filename).toLowerCase();
    const contentType =
      ext === '.png'
        ? 'image/png'
        : ext === '.webp'
          ? 'image/webp'
          : 'image/jpeg';

    return { filePath: resolved, contentType };
  }

  private async getUserProfileStatus(userId: number) {
    const [user] = await this.databaseService.db
      .select({
        id: users.id,
        fullName: users.fullName,
        email: users.email,
        phone: users.phone,
        profileCompleted: users.profileCompleted,
      })
      .from(users)
      .where(and(eq(users.id, userId), isNull(users.deletedAt)))
      .limit(1);

    if (!user) {
      throw new NotFoundException('User account not found.');
    }

    const profileCompleted = Boolean(
      user.profileCompleted &&
      user.fullName?.trim() &&
      user.email?.trim() &&
      user.phone?.trim(),
    );

    return {
      ...user,
      profileCompleted,
    };
  }

  private parseAndValidatePhotoDataUrl(dataUrl: string): {
    buffer: Buffer;
    ext: 'jpg' | 'png' | 'webp';
  } {
    const match = /^data:image\/(jpeg|jpg|png|webp);base64,([A-Za-z0-9+/=\r\n]+)$/.exec(
      dataUrl.trim(),
    );
    if (!match) {
      throw new BadRequestException(
        'A valid watermarked attendance photo (JPEG, PNG, or WEBP) is required.',
      );
    }

    const mimeSubtype = match[1]!;
    const base64Payload = match[2]!.replace(/\s+/g, '');
    const buffer = Buffer.from(base64Payload, 'base64');

    if (buffer.length < 32) {
      throw new BadRequestException('Captured attendance photo is empty or corrupted.');
    }
    if (buffer.length > MAX_PHOTO_BYTES) {
      throw new BadRequestException('Attendance photo exceeds maximum allowed size of 5 MB.');
    }

    const isJpeg =
      buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    const isPng =
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47;
    const isWebp =
      buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
      buffer.subarray(8, 12).toString('ascii') === 'WEBP';

    if ((mimeSubtype === 'jpeg' || mimeSubtype === 'jpg') && isJpeg) {
      return { buffer, ext: 'jpg' };
    }
    if (mimeSubtype === 'png' && isPng) {
      return { buffer, ext: 'png' };
    }
    if (mimeSubtype === 'webp' && isWebp) {
      return { buffer, ext: 'webp' };
    }

    throw new BadRequestException(
      'Attendance photo binary header does not match the declared image format.',
    );
  }
}
