import { BadRequestException } from '@nestjs/common';

jest.mock('@nestjs/jwt', () => ({ JwtService: jest.fn() }));
jest.mock('otplib', () => ({
  generateSecret: jest.fn(),
  generateURI: jest.fn(),
  verifySync: jest.fn(),
}));
jest.mock('uuid', () => ({ v4: () => 'mock-uuid-1234' }));

import { AuthService } from './auth.service';

describe('AuthService First-Login Profile Setup', () => {
  it('marks profileCompleted true after valid updateProfile submission', async () => {
    let selectCall = 0;
    const updatedSets: any[] = [];
    const insertedAudits: any[] = [];

    const mockDb = {
      select: jest.fn(() => {
        selectCall += 1;
        const chain: any = {
          from: jest.fn(() => chain),
          innerJoin: jest.fn(() => chain),
          where: jest.fn(() => chain),
          limit: jest.fn(async () => {
            if (selectCall === 1) {
              return [
                {
                  id: 99,
                  tenantId: 1,
                  roleId: 6,
                  fullName: 'Initial User',
                  email: 'initial@kings.com',
                  phone: null,
                  profileCompleted: false,
                  profileCompletedAt: null,
                },
              ];
            }
            if (selectCall === 2) {
              // Email duplicate check
              return [];
            }
            // getMe join
            return [
              {
                user: {
                  id: 99,
                  uuid: 'u-99',
                  tenantId: 1,
                  roleId: 6,
                  username: 'newstaff',
                  fullName: 'Affan Khan',
                  email: 'affan@kingsbuilders.com',
                  phone: '+91 98201 12345',
                  avatarUrl: null,
                  totpEnabled: false,
                  profileCompleted: true,
                  profileCompletedAt: new Date(),
                },
                role: { id: 6, code: 'sitemgr', name: 'Site Manager' },
                tenant: {
                  id: 1,
                  name: 'Kings Builders',
                  slug: 'kings',
                  plan: 'enterprise',
                  tagline: 'Builders',
                  gstin: null,
                  stateCode: '27',
                  address: null,
                  logoUrl: null,
                  primaryColor: '#c5a04e',
                  mfaEnabled: false,
                },
              },
            ];
          }),
        };
        // Handle non-limited permission / module / userSites queries
        chain.where = jest.fn(() => {
          const inner: any = {
            limit: chain.limit,
            then: (resolve: (val: any[]) => void) => resolve([]),
          };
          return inner;
        });
        return chain;
      }),
      update: jest.fn(() => ({
        set: jest.fn((payload: any) => {
          updatedSets.push(payload);
          return { where: jest.fn(async () => undefined) };
        }),
      })),
      insert: jest.fn(() => ({
        values: jest.fn(async (val: any) => {
          insertedAudits.push(val);
        }),
      })),
    };

    const service = new AuthService(
      { db: mockDb } as any,
      { signAsync: jest.fn() } as any,
      { get: jest.fn() } as any,
    );

    const res = await service.updateProfile(99, {
      fullName: 'Affan Khan',
      phone: '+91 98201 12345',
      email: 'affan@kingsbuilders.com',
    });

    expect(updatedSets[0]).toMatchObject({
      fullName: 'Affan Khan',
      phone: '+91 98201 12345',
      email: 'affan@kingsbuilders.com',
      profileCompleted: true,
    });
    expect(insertedAudits[0]).toMatchObject({ action: 'auth.profile_complete' });
    expect(res.user.profileCompleted).toBe(true);
  });

  it('rejects updateProfile when required fields are blank whitespace', async () => {
    const mockDb = {
      select: jest.fn(() => {
        const chain: any = {
          from: jest.fn(() => chain),
          where: jest.fn(() => chain),
          limit: jest.fn(async () => [
            {
              id: 99,
              tenantId: 1,
              fullName: 'User',
              email: 'user@kings.com',
              phone: null,
            },
          ]),
        };
        return chain;
      }),
    };

    const service = new AuthService(
      { db: mockDb } as any,
      { signAsync: jest.fn() } as any,
      { get: jest.fn() } as any,
    );

    await expect(
      service.updateProfile(99, {
        fullName: '   ',
        phone: '+91 98201 12345',
        email: 'user@kings.com',
      }),
    ).rejects.toThrow(BadRequestException);
  });
});
