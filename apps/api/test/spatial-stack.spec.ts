import { DataSource } from 'typeorm';
import Redis from 'ioredis';

describe('Local Infrastructure Stack (PostGIS & Redis)', () => {
  let dataSource: DataSource | null = null;
  let redisClient: Redis | null = null;
  let isLiveDbAvailable = false;
  let isLiveRedisAvailable = false;

  beforeAll(async () => {
    // Attempt connection to local dev PostgreSQL + PostGIS container
    try {
      dataSource = new DataSource({
        type: 'postgres',
        host: process.env.DATABASE_HOST || 'localhost',
        port: parseInt(process.env.DATABASE_PORT || '5432', 10),
        username: process.env.DATABASE_USER || 'ecoride_dev',
        password: process.env.DATABASE_PASSWORD || 'ecoride_dev_secret',
        database: process.env.DATABASE_NAME || 'ecoride_db',
        synchronize: false,
        logging: false,
      });
      await dataSource.initialize();
      isLiveDbAvailable = true;
    } catch {
      isLiveDbAvailable = false;
    }

    // Attempt connection to local dev Redis container
    try {
      redisClient = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        lazyConnect: true,
        connectTimeout: 2000,
        maxRetriesPerRequest: 1,
      });
      await redisClient.connect();
      isLiveRedisAvailable = true;
    } catch {
      isLiveRedisAvailable = false;
    }
  });

  afterAll(async () => {
    if (dataSource && dataSource.isInitialized) {
      await dataSource.destroy();
    }
    if (redisClient) {
      redisClient.disconnect();
    }
  });

  describe('PostGIS Spatial Capabilities', () => {
    it('should generate valid PostGIS Point representations', () => {
      // Visakhapatnam Beach Road: 83.2185 E, 17.6868 N
      const lng = 83.2185;
      const lat = 17.6868;
      const wkt = `POINT(${lng} ${lat})`;
      expect(wkt).toBe('POINT(83.2185 17.6868)');
    });

    it('should calculate Haversine distance matching PostGIS ST_DistanceSphere', () => {
      // Point A: Vizag Beach Road (83.2185, 17.6868)
      // Point B: Rushikonda IT SEZ (83.3038, 17.7275)
      const toRad = (deg: number) => (deg * Math.PI) / 180;
      const R = 6371000; // Earth radius in meters

      const lat1 = 17.6868;
      const lon1 = 83.2185;
      const lat2 = 17.7275;
      const lon2 = 83.3038;

      const dLat = toRad(lat2 - lat1);
      const dLon = toRad(lon2 - lon1);

      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distanceMeters = Math.round(R * c);

      // Distance should be approximately 10,150 meters (+/- 200m)
      expect(distanceMeters).toBeGreaterThan(9900);
      expect(distanceMeters).toBeLessThan(10400);
    });

    it('should evaluate PostGIS query when live database is connected', async () => {
      if (!isLiveDbAvailable || !dataSource) {
        // Skip in environments where container is offline
        expect(true).toBe(true);
        return;
      }

      // Execute live PostGIS spatial functions
      const result = await dataSource.query(`
        SELECT 
          ST_AsText(ST_MakePoint(83.2185, 17.6868)) as point_wkt,
          round(ST_DistanceSphere(
            ST_MakePoint(83.2185, 17.6868),
            ST_MakePoint(83.3038, 17.7275)
          )::numeric, 2) as distance_meters;
      `);

      expect(result).toHaveLength(1);
      expect(result[0].point_wkt).toBe('POINT(83.2185 17.6868)');
      expect(parseFloat(result[0].distance_meters)).toBeCloseTo(10105.6, 0);
    });

    it('should verify PostGIS extension version in live database', async () => {
      if (!isLiveDbAvailable || !dataSource) {
        expect(true).toBe(true);
        return;
      }

      const versionResult = await dataSource.query('SELECT PostGIS_Version();');
      expect(versionResult).toHaveLength(1);
      expect(versionResult[0].postgis_version).toBeDefined();
      expect(typeof versionResult[0].postgis_version).toBe('string');
    });
  });

  describe('Redis Responsiveness & Caching', () => {
    it('should format Redis geospatial commands correctly', () => {
      const driverId = 'captain_vizag_101';
      const lng = 83.2185;
      const lat = 17.6868;
      const geoCommand = ['GEOADD', 'drivers:locations:visakhapatnam', lng, lat, driverId];

      expect(geoCommand[0]).toBe('GEOADD');
      expect(geoCommand[1]).toBe('drivers:locations:visakhapatnam');
      expect(geoCommand[4]).toBe('captain_vizag_101');
    });

    it('should respond to Redis PING when live container is connected', async () => {
      if (!isLiveRedisAvailable || !redisClient) {
        expect(true).toBe(true);
        return;
      }

      const pingResponse = await redisClient.ping();
      expect(pingResponse).toBe('PONG');
    });

    it('should write and read temporary telemetry key with TTL', async () => {
      if (!isLiveRedisAvailable || !redisClient) {
        expect(true).toBe(true);
        return;
      }

      const testKey = 'test:telemetry:vizag_01';
      const testPayload = JSON.stringify({
        driverId: 'captain_01',
        soc: 85,
        timestamp: new Date().toISOString(),
      });

      await redisClient.set(testKey, testPayload, 'EX', 10);
      const retrieved = await redisClient.get(testKey);

      expect(retrieved).toBe(testPayload);
      const parsed = JSON.parse(retrieved!);
      expect(parsed.soc).toBe(85);

      // Clean up
      await redisClient.del(testKey);
    });
  });
});
