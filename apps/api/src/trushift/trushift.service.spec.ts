import { BadRequestException, ForbiddenException } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import { TrushiftService } from './trushift.service';
import { calculateHaversineDistanceMeters } from './geofence.util';
import { TenantContext } from '../common/middleware/tenant.middleware';

// Valid minimal 1x1 JPEG bytes (SOI + APP0 + EOI markers)
const SAMPLE_JPEG_BASE64 =
  'data:image/jpeg;base64,' +
  Buffer.from([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
    0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43,
    0x00, 0x03, 0x02, 0x02, 0x03, 0x02, 0x02, 0x03, 0xff, 0xd9,
  ]).toString('base64');

const TENANT: TenantContext = {
  id: 1,
  uuid: 'tenant-1',
  name: 'Kings Builders',
  slug: 'kings',
  status: 'active',
  plan: 'enterprise',
  mfaEnabled: false,
  primaryColor: '#c5a04e',
  logoUrl: null,
};

function createSelectChain(result: any[]) {
  const chain: any = {
    from: jest.fn(() => chain),
    innerJoin: jest.fn(() => chain),
    leftJoin: jest.fn(() => chain),
    where: jest.fn(() => chain),
    orderBy: jest.fn(() => chain),
    limit: jest.fn(async () => result),
  };
  return chain;
}

describe('TrushiftService & Geofence Attendance', () => {
  const createdFiles: string[] = [];

  afterAll(async () => {
    for (const filePath of createdFiles) {
      await fs.unlink(filePath).catch(() => undefined);
    }
  });

  it('computes Haversine distance accurately in meters', () => {
    // ~14m offset near Mumbai (19.0624, 72.8841 -> 19.0625, 72.8842)
    const dist = calculateHaversineDistanceMeters(19.0624, 72.8841, 19.0625, 72.8842);
    expect(dist).toBeGreaterThan(10);
    expect(dist).toBeLessThan(25);

    // Identical points = 0m
    expect(calculateHaversineDistanceMeters(19.0624, 72.8841, 19.0624, 72.8841)).toBe(0);
  });

  it('blocks attendance when user profile setup is incomplete', async () => {
    const mockDb = {
      select: jest.fn(() =>
        createSelectChain([
          {
            id: 10,
            fullName: 'New Staff',
            email: 'new@kings.com',
            phone: null,
            profileCompleted: false,
          },
        ]),
      ),
    };
    const service = new TrushiftService({ db: mockDb } as any);

    await expect(
      service.punchAttendance(TENANT, { id: 10 }, {
        siteId: 1,
        latitude: 19.0625,
        longitude: 72.8842,
        photoDataUrl: SAMPLE_JPEG_BASE64,
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('rejects attendance when user is not assigned to the site in user_sites', async () => {
    let callIdx = 0;
    const mockDb = {
      select: jest.fn(() => {
        callIdx += 1;
        if (callIdx === 1) {
          return createSelectChain([
            {
              id: 3,
              fullName: 'Admin User',
              email: 'admin@kings.com',
              phone: '9820000001',
              profileCompleted: true,
            },
          ]);
        }
        return createSelectChain([]);
      }),
    };
    const service = new TrushiftService({ db: mockDb } as any);

    await expect(
      service.punchAttendance(TENANT, { id: 3 }, {
        siteId: 1,
        latitude: 19.0625,
        longitude: 72.8842,
        photoDataUrl: SAMPLE_JPEG_BASE64,
      }),
    ).rejects.toThrow('Attendance rejected: you are not assigned to the selected site.');
  });

  it('rejects attendance when site GPS coordinates are missing', async () => {
    let callIdx = 0;
    const mockDb = {
      select: jest.fn(() => {
        callIdx += 1;
        if (callIdx === 1) {
          return createSelectChain([
            {
              id: 6,
              fullName: 'Site Manager',
              email: 'site@kings.com',
              phone: '9820000006',
              profileCompleted: true,
            },
          ]);
        }
        return createSelectChain([
          {
            siteId: 1,
            siteCode: 'SITE-KH',
            siteName: 'Kings Heights',
            siteStatus: 'active',
            latitude: null,
            longitude: null,
            geofenceRadius: 200,
          },
        ]);
      }),
    };
    const service = new TrushiftService({ db: mockDb } as any);

    await expect(
      service.punchAttendance(TENANT, { id: 6 }, {
        siteId: 1,
        latitude: 19.0625,
        longitude: 72.8842,
        photoDataUrl: SAMPLE_JPEG_BASE64,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects attendance when employee GPS is outside the configured geofence radius', async () => {
    let callIdx = 0;
    const mockDb = {
      select: jest.fn(() => {
        callIdx += 1;
        if (callIdx === 1) {
          return createSelectChain([
            {
              id: 6,
              fullName: 'Site Manager',
              email: 'site@kings.com',
              phone: '9820000006',
              profileCompleted: true,
            },
          ]);
        }
        return createSelectChain([
          {
            siteId: 1,
            siteCode: 'SITE-KH',
            siteName: 'Kings Heights',
            siteStatus: 'active',
            latitude: '19.0624000',
            longitude: '72.8841000',
            geofenceRadius: 200,
          },
        ]);
      }),
    };
    const service = new TrushiftService({ db: mockDb } as any);

    // ~1.1 km away from site center
    await expect(
      service.punchAttendance(TENANT, { id: 6 }, {
        siteId: 1,
        latitude: 19.0724,
        longitude: 72.8841,
        photoDataUrl: SAMPLE_JPEG_BASE64,
      }),
    ).rejects.toThrow(/Attendance rejected: your location is .* away/);
  });

  it('accepts attendance inside geofence, stores watermarked photo file, and records distance', async () => {
    let callIdx = 0;
    const insertValues: any[] = [];
    const mockDb = {
      select: jest.fn(() => {
        callIdx += 1;
        if (callIdx === 1) {
          return createSelectChain([
            {
              id: 6,
              fullName: 'Site Manager',
              email: 'site@kings.com',
              phone: '9820000006',
              profileCompleted: true,
            },
          ]);
        }
        return createSelectChain([
          {
            siteId: 1,
            siteCode: 'SITE-KH',
            siteName: 'Kings Heights',
            siteStatus: 'active',
            latitude: '19.0624000',
            longitude: '72.8841000',
            geofenceRadius: 200,
          },
        ]);
      }),
      insert: jest.fn(() => ({
        values: jest.fn(async (val: any) => {
          insertValues.push(val);
        }),
      })),
    };
    const service = new TrushiftService({ db: mockDb } as any);

    const result = await service.punchAttendance(TENANT, { id: 6 }, {
      siteId: 1,
      latitude: 19.0625,
      longitude: 72.8842,
      punchType: 'check_in',
      photoDataUrl: SAMPLE_JPEG_BASE64,
      remarks: 'Morning check-in',
    });

    expect(result.geofenceVerified).toBe(true);
    expect(result.distanceMeters).toBeLessThanOrEqual(200);
    expect(result.photoUrl).toMatch(/^\/api\/v1\/trushift\/photos\/[0-9a-f-]+\.jpg$/);
    expect(insertValues.length).toBe(2);

    const filename = result.photoUrl.split('/').pop()!;
    const savedPath = path.resolve(process.cwd(), 'uploads', 'attendance', filename);
    createdFiles.push(savedPath);
    const stat = await fs.stat(savedPath);
    expect(stat.size).toBeGreaterThan(20);
  });
});
