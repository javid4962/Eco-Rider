import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOutstationAndCampusShuttleSchema1700000000035 implements MigrationInterface {
  name = 'CreateOutstationAndCampusShuttleSchema1700000000035';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. outstation_routes
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "outstation_routes" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "route_code" character varying(50) NOT NULL,
        "origin_city" character varying(50) NOT NULL,
        "destination_city" character varying(50) NOT NULL,
        "distance_km" numeric(6,2) NOT NULL,
        "estimated_transit_minutes" integer NOT NULL,
        "base_fare_paise" integer NOT NULL,
        "toll_estimate_paise" integer NOT NULL DEFAULT 0,
        "required_min_soc_percent" numeric(5,2) NOT NULL DEFAULT 60.0,
        "mandatory_charging_stop_name" character varying(150),
        "mandatory_charging_stop_km" numeric(6,2),
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_outstation_routes_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_outstation_routes_code" UNIQUE ("route_code")
      )
    `);

    // 2. outstation_trips
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "outstation_trips" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "route_id" uuid NOT NULL,
        "rider_id" uuid NOT NULL,
        "captain_id" uuid,
        "vehicle_id" uuid,
        "pickup_address" text NOT NULL,
        "dropoff_address" text NOT NULL,
        "departure_time" TIMESTAMP WITH TIME ZONE NOT NULL,
        "passenger_count" integer NOT NULL DEFAULT 1,
        "fare_paise" integer NOT NULL,
        "toll_paise" integer NOT NULL DEFAULT 0,
        "total_fare_paise" integer NOT NULL,
        "status" character varying(30) NOT NULL DEFAULT 'REQUESTED',
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_outstation_trips_id" PRIMARY KEY ("id")
      )
    `);

    // 3. campus_geofences
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "campus_geofences" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "campus_code" character varying(50) NOT NULL,
        "campus_name" character varying(150) NOT NULL,
        "city" character varying(50) NOT NULL,
        "boundary_geojson" jsonb NOT NULL,
        "authorized_organizations" jsonb NOT NULL DEFAULT '[]',
        "total_shuttles_active" integer NOT NULL DEFAULT 2,
        "operating_hours" character varying(50) NOT NULL DEFAULT '07:00 - 21:00',
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_campus_geofences_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_campus_geofences_code" UNIQUE ("campus_code")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "campus_geofences"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "outstation_trips"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "outstation_routes"`);
  }
}

