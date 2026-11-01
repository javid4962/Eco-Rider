import {
  SEED_USERS,
  SEED_VEHICLES,
  SEED_ZONES,
  SEED_SERVICE_FLAGS,
  SEED_BOOKINGS,
  SEED_LEDGER_ENTRIES,
} from '../src/modules/seed/seed.constants';
import { SeedService } from '../src/modules/seed/seed.service';
import { DataSource } from 'typeorm';

describe('Synthetic Seed Data & Resettable Seed Service (EV-012)', () => {
  describe('Seed Constants Integrity & Governance Rules', () => {
    it('should strictly enforce 100% Battery Electric propulsion on all seeded vehicles', () => {
      expect(SEED_VEHICLES.length).toBeGreaterThan(0);
      for (const vehicle of SEED_VEHICLES) {
        expect(vehicle.propulsionType).toBe('BATTERY_ELECTRIC');
      }
    });

    it('should enforce battery SoC feasibility buffer (>20%) for all operational vehicles', () => {
      for (const vehicle of SEED_VEHICLES) {
        expect(vehicle.currentSocPercent).toBeGreaterThanOrEqual(20.0);
        expect(vehicle.currentSocPercent).toBeLessThanOrEqual(100.0);
      }
    });

    it('should cover all 7 required platform roles with synthetic demo users', () => {
      const roles = new Set(SEED_USERS.map((u) => u.role));
      expect(roles.has('RIDER')).toBe(true);
      expect(roles.has('CAPTAIN')).toBe(true);
      expect(roles.has('DISPATCHER')).toBe(true);
      expect(roles.has('FLEET_OWNER')).toBe(true);
      expect(roles.has('FINANCE_ADMIN')).toBe(true);
      expect(roles.has('SAFETY_OFFICER')).toBe(true);
      expect(roles.has('INSTITUTION_REP')).toBe(true);

      // Verify no real personal data: all phones use synthetic +91-91234 demo pattern
      for (const user of SEED_USERS) {
        expect(user.phone).toMatch(/^\+9191234\d{5}$/);
      }
    });

    it('should maintain balanced double-entry accounting in demo ledger entries', () => {
      let totalDebits = 0;
      let totalCredits = 0;

      for (const entry of SEED_LEDGER_ENTRIES) {
        expect(entry.currency).toBe('INR');
        expect(Number.isInteger(entry.amountPaise)).toBe(true);
        expect(entry.amountPaise).toBeGreaterThan(0);

        if (entry.entryType === 'DEBIT') {
          totalDebits += entry.amountPaise;
        } else if (entry.entryType === 'CREDIT') {
          totalCredits += entry.amountPaise;
        }
      }

      // Total DEBIT must equal Total CREDIT exactly in paise
      expect(totalDebits).toBe(8500);
      expect(totalCredits).toBe(8500);
      expect(totalDebits).toEqual(totalCredits);
    });

    it('should respect gated launch rules: only Visakhapatnam private EV is enabled', () => {
      const vizagPrivateEv = SEED_SERVICE_FLAGS.find(
        (f) => f.city === 'visakhapatnam' && f.serviceCategory === 'private_ev',
      );
      expect(vizagPrivateEv).toBeDefined();
      expect(vizagPrivateEv?.isEnabled).toBe(true);

      const otherFlags = SEED_SERVICE_FLAGS.filter(
        (f) => !(f.city === 'visakhapatnam' && f.serviceCategory === 'private_ev'),
      );
      for (const flag of otherFlags) {
        expect(flag.isEnabled).toBe(false);
        expect(flag.blockerReason).toBeDefined();
      }
    });

    it('should locate all seed zones and bookings strictly within Andhra Pradesh geographic boundaries', () => {
      // AP bounding box: Lat ~12.5 to 19.5, Lng ~76.5 to 84.8
      for (const zone of SEED_ZONES) {
        for (const [lng, lat] of zone.coordinates) {
          expect(lat).toBeGreaterThanOrEqual(12.5);
          expect(lat).toBeLessThanOrEqual(19.5);
          expect(lng).toBeGreaterThanOrEqual(76.5);
          expect(lng).toBeLessThanOrEqual(84.8);
        }
      }

      for (const booking of SEED_BOOKINGS) {
        expect(booking.pickupLatitude).toBeGreaterThanOrEqual(12.5);
        expect(booking.pickupLatitude).toBeLessThanOrEqual(19.5);
        expect(booking.pickupLongitude).toBeGreaterThanOrEqual(76.5);
        expect(booking.pickupLongitude).toBeLessThanOrEqual(84.8);
      }
    });
  });

  describe('SeedService Database Execution', () => {
    let mockDataSource: Partial<DataSource>;
    let mockQueryRunner: {
      connect: jest.Mock;
      startTransaction: jest.Mock;
      commitTransaction: jest.Mock;
      rollbackTransaction: jest.Mock;
      release: jest.Mock;
      query: jest.Mock;
    };

    beforeEach(() => {
      mockQueryRunner = {
        connect: jest.fn().mockResolvedValue(undefined),
        startTransaction: jest.fn().mockResolvedValue(undefined),
        commitTransaction: jest.fn().mockResolvedValue(undefined),
        rollbackTransaction: jest.fn().mockResolvedValue(undefined),
        release: jest.fn().mockResolvedValue(undefined),
        query: jest.fn().mockResolvedValue([]),
      };

      mockDataSource = {
        createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
        query: jest.fn().mockImplementation(async (sql: string) => {
          if (sql.includes('"users"')) return [{ count: 11 }];
          if (sql.includes('"vehicles"')) return [{ count: 5 }];
          if (sql.includes('"zones"')) return [{ count: 4 }];
          if (sql.includes('"service_flags"')) return [{ count: 6 }];
          if (sql.includes('"bookings"')) return [{ count: 3 }];
          if (sql.includes('"ledger_entries"')) return [{ count: 3 }];
          return [{ count: 0 }];
        }),
      };
    });

    it('should execute seedAll transaction and return SEEDED status', async () => {
      const seedService = new SeedService(mockDataSource as DataSource);
      const summary = await seedService.seedAll();

      expect(mockQueryRunner.startTransaction).toHaveBeenCalledTimes(1);
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalledTimes(1);
      expect(mockQueryRunner.release).toHaveBeenCalledTimes(1);
      expect(summary.status).toBe('SEEDED');
      expect(summary.usersCount).toBe(11);
      expect(summary.vehiclesCount).toBe(5);
    });

    it('should execute resetSeed transaction cleanly and re-seed', async () => {
      const seedService = new SeedService(mockDataSource as DataSource);
      const summary = await seedService.resetSeed();

      expect(mockQueryRunner.startTransaction).toHaveBeenCalledTimes(2); // 1 for wipe, 1 for re-seed
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalledTimes(2);
      expect(summary.status).toBe('SEEDED');
    });

    it('should rollback transaction on error', async () => {
      mockQueryRunner.query.mockRejectedValueOnce(new Error('Simulated DB constraint violation'));

      const seedService = new SeedService(mockDataSource as DataSource);
      await expect(seedService.seedAll()).rejects.toThrow('Simulated DB constraint violation');

      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalledTimes(1);
      expect(mockQueryRunner.release).toHaveBeenCalledTimes(1);
    });
  });
});
