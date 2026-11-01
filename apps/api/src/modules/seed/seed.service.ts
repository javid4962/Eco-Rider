import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
  SEED_USERS,
  SEED_VEHICLES,
  SEED_ZONES,
  SEED_SERVICE_FLAGS,
  SEED_BOOKINGS,
  SEED_LEDGER_ENTRIES,
} from './seed.constants';

export interface SeedSummary {
  usersCount: number;
  vehiclesCount: number;
  zonesCount: number;
  serviceFlagsCount: number;
  bookingsCount: number;
  ledgerEntriesCount: number;
  status: 'SEEDED' | 'EMPTY' | 'PARTIAL';
}

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(private readonly dataSource: DataSource) {}

  /**
   * Idempotently seeds all synthetic test users, BEV vehicles, PostGIS zones,
   * service flags, demo bookings, and balanced ledger entries.
   */
  async seedAll(): Promise<SeedSummary> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      this.logger.log('Beginning synthetic EV seed transaction...');

      // 1. Seed Users
      for (const u of SEED_USERS) {
        await queryRunner.query(
          `INSERT INTO "users" ("id", "phone", "role", "name", "is_active")
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT ("id") DO UPDATE
           SET "phone" = EXCLUDED."phone", "role" = EXCLUDED."role", "name" = EXCLUDED."name", "is_active" = EXCLUDED."is_active"`,
          [u.id, u.phone, u.role, u.name, u.isActive],
        );
      }

      // 2. Seed Vehicles (100% BEV constraint enforced by DB)
      for (const v of SEED_VEHICLES) {
        await queryRunner.query(
          `INSERT INTO "vehicles" ("id", "registration_number", "propulsion_type", "battery_capacity_kwh", "current_soc_percent", "vehicle_category", "is_active")
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT ("id") DO UPDATE
           SET "registration_number" = EXCLUDED."registration_number",
               "battery_capacity_kwh" = EXCLUDED."battery_capacity_kwh",
               "current_soc_percent" = EXCLUDED."current_soc_percent",
               "vehicle_category" = EXCLUDED."vehicle_category"`,
          [
            v.id,
            v.registrationNumber,
            v.propulsionType,
            v.batteryCapacityKwh,
            v.currentSocPercent,
            v.vehicleCategory,
            v.isActive,
          ],
        );
      }

      // 3. Seed Zones with PostGIS Polygon geometry
      for (const z of SEED_ZONES) {
        const polygonWkt = `POLYGON((${z.coordinates.map((c) => `${c[0]} ${c[1]}`).join(', ')}))`;
        await queryRunner.query(
          `INSERT INTO "zones" ("id", "city", "name", "boundary", "is_active")
           VALUES ($1, $2, $3, ST_SetSRID(ST_GeomFromText($4), 4326), $5)
           ON CONFLICT ("id") DO UPDATE
           SET "city" = EXCLUDED."city", "name" = EXCLUDED."name",
               "boundary" = ST_SetSRID(ST_GeomFromText($4), 4326), "is_active" = EXCLUDED."is_active"`,
          [z.id, z.city, z.name, polygonWkt, z.isActive],
        );
      }

      // 4. Seed Service Flags
      for (const sf of SEED_SERVICE_FLAGS) {
        await queryRunner.query(
          `INSERT INTO "service_flags" ("id", "city", "service_category", "is_enabled", "release_phase", "blocker_reason")
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT ("city", "service_category") DO UPDATE
           SET "is_enabled" = EXCLUDED."is_enabled", "release_phase" = EXCLUDED."release_phase", "blocker_reason" = EXCLUDED."blocker_reason"`,
          [
            sf.id,
            sf.city,
            sf.serviceCategory,
            sf.isEnabled,
            sf.releasePhase,
            sf.blockerReason || null,
          ],
        );
      }

      // 5. Seed Bookings with PostGIS Point geometries
      for (const b of SEED_BOOKINGS) {
        await queryRunner.query(
          `INSERT INTO "bookings" (
             "id", "booking_code", "rider_id", "captain_id", "vehicle_id",
             "service_category", "status", "pickup_location", "dropoff_location",
             "start_otp", "fare_amount"
           )
           VALUES (
             $1, $2, $3, $4, $5,
             $6, $7, ST_SetSRID(ST_MakePoint($8, $9), 4326), ST_SetSRID(ST_MakePoint($10, $11), 4326),
             $12, $13
           )
           ON CONFLICT ("booking_code") DO UPDATE
           SET "status" = EXCLUDED."status", "fare_amount" = EXCLUDED."fare_amount", "start_otp" = EXCLUDED."start_otp"`,
          [
            b.id,
            b.bookingCode,
            b.riderId,
            b.captainId,
            b.vehicleId,
            b.serviceCategory,
            b.status,
            b.pickupLongitude,
            b.pickupLatitude,
            b.dropoffLongitude,
            b.dropoffLatitude,
            b.startOtp || null,
            b.fareAmount,
          ],
        );
      }

      // 6. Seed Double-Entry Ledger Entries
      for (const l of SEED_LEDGER_ENTRIES) {
        await queryRunner.query(
          `INSERT INTO "ledger_entries" ("id", "idempotency_key", "booking_id", "account_id", "entry_type", "amount_paise", "currency", "description")
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT ("idempotency_key") DO NOTHING`,
          [
            l.id,
            l.idempotencyKey,
            l.bookingId,
            l.accountId,
            l.entryType,
            l.amountPaise,
            l.currency,
            l.description,
          ],
        );
      }

      // 7. Seed Audit Log Record
      await queryRunner.query(
        `INSERT INTO "audit_logs" ("id", "entity_type", "entity_id", "actor_id", "action", "new_state")
         VALUES (uuid_generate_v4(), 'PLATFORM_SEED', $1, $1, 'INITIALIZE_SYNTHETIC_DATA', $2)`,
        [
          SEED_USERS[6].id,
          JSON.stringify({ seededAt: new Date().toISOString(), env: 'development' }),
        ],
      );

      await queryRunner.commitTransaction();
      this.logger.log('Synthetic EV seed committed successfully.');

      return this.getSeedStatus();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error('Failed to commit synthetic seed transaction', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Resets all synthetic demo records cleanly without affecting schemas or non-synthetic data.
   */
  async resetSeed(): Promise<SeedSummary> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      this.logger.log('Resetting synthetic seed data...');

      // Safe deletion in reverse foreign key dependency order
      const seedBookingIds = SEED_BOOKINGS.map((b) => `'${b.id}'`).join(',');
      const seedUserIds = SEED_USERS.map((u) => `'${u.id}'`).join(',');
      const seedVehicleIds = SEED_VEHICLES.map((v) => `'${v.id}'`).join(',');
      const seedZoneIds = SEED_ZONES.map((z) => `'${z.id}'`).join(',');
      const seedFlagIds = SEED_SERVICE_FLAGS.map((f) => `'${f.id}'`).join(',');

      await queryRunner.query(
        `DELETE FROM "ledger_entries" WHERE "booking_id" IN (${seedBookingIds})`,
      );
      await queryRunner.query(`DELETE FROM "bookings" WHERE "id" IN (${seedBookingIds})`);
      await queryRunner.query(`DELETE FROM "service_flags" WHERE "id" IN (${seedFlagIds})`);
      await queryRunner.query(`DELETE FROM "zones" WHERE "id" IN (${seedZoneIds})`);
      await queryRunner.query(`DELETE FROM "vehicles" WHERE "id" IN (${seedVehicleIds})`);
      await queryRunner.query(`DELETE FROM "users" WHERE "id" IN (${seedUserIds})`);

      await queryRunner.commitTransaction();
      this.logger.log('Synthetic demo data wiped cleanly.');
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error('Failed to reset synthetic seed data', error);
      throw error;
    } finally {
      await queryRunner.release();
    }

    // Re-seed freshly
    return this.seedAll();
  }

  /**
   * Retrieves summary counts of seeded entities in the database.
   */
  async getSeedStatus(): Promise<SeedSummary> {
    const [users] = await this.dataSource.query(`SELECT COUNT(*)::int as count FROM "users"`);
    const [vehicles] = await this.dataSource.query(`SELECT COUNT(*)::int as count FROM "vehicles"`);
    const [zones] = await this.dataSource.query(`SELECT COUNT(*)::int as count FROM "zones"`);
    const [serviceFlags] = await this.dataSource.query(
      `SELECT COUNT(*)::int as count FROM "service_flags"`,
    );
    const [bookings] = await this.dataSource.query(`SELECT COUNT(*)::int as count FROM "bookings"`);
    const [ledgerEntries] = await this.dataSource.query(
      `SELECT COUNT(*)::int as count FROM "ledger_entries"`,
    );

    const usersCount = users?.count || 0;
    const vehiclesCount = vehicles?.count || 0;
    const zonesCount = zones?.count || 0;
    const serviceFlagsCount = serviceFlags?.count || 0;
    const bookingsCount = bookings?.count || 0;
    const ledgerEntriesCount = ledgerEntries?.count || 0;

    let status: 'SEEDED' | 'EMPTY' | 'PARTIAL' = 'EMPTY';
    if (usersCount >= SEED_USERS.length && vehiclesCount >= SEED_VEHICLES.length) {
      status = 'SEEDED';
    } else if (usersCount > 0 || vehiclesCount > 0) {
      status = 'PARTIAL';
    }

    return {
      usersCount,
      vehiclesCount,
      zonesCount,
      serviceFlagsCount,
      bookingsCount,
      ledgerEntriesCount,
      status,
    };
  }
}
