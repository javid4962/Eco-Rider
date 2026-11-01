import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

export interface ServiceMetricsPayload {
  uptimeSeconds: number;
  memory: {
    heapUsedMb: number;
    heapTotalMb: number;
    rssMb: number;
  };
  http: {
    totalRequests: number;
    requests2xx: number;
    requests4xx: number;
    requests5xx: number;
  };
  evDomain: {
    propulsionEnforcement: '100%_BATTERY_ELECTRIC';
    activePilotCity: 'visakhapatnam';
    activeVehiclesCount?: number;
    activeZonesCount?: number;
  };
  timestamp: string;
}

@Injectable()
export class MetricsService {
  private totalRequests = 0;
  private requests2xx = 0;
  private requests4xx = 0;
  private requests5xx = 0;

  constructor(private readonly dataSource?: DataSource) {}

  incrementRequestCount(statusCode: number): void {
    this.totalRequests++;
    if (statusCode >= 200 && statusCode < 300) {
      this.requests2xx++;
    } else if (statusCode >= 400 && statusCode < 500) {
      this.requests4xx++;
    } else if (statusCode >= 500) {
      this.requests5xx++;
    }
  }

  async getMetrics(): Promise<ServiceMetricsPayload> {
    const memory = process.memoryUsage();
    let activeVehiclesCount = 0;
    let activeZonesCount = 0;

    try {
      if (this.dataSource && this.dataSource.isInitialized) {
        const [vehicles] = await this.dataSource.query(
          `SELECT COUNT(*)::int as count FROM "vehicles" WHERE "is_active" = true`,
        );
        const [zones] = await this.dataSource.query(
          `SELECT COUNT(*)::int as count FROM "zones" WHERE "is_active" = true`,
        );
        activeVehiclesCount = vehicles?.count || 0;
        activeZonesCount = zones?.count || 0;
      }
    } catch {
      // In case DB is offline, continue without failing metrics
    }

    return {
      uptimeSeconds: Math.floor(process.uptime()),
      memory: {
        heapUsedMb: Math.round((memory.heapUsed / 1024 / 1024) * 100) / 100,
        heapTotalMb: Math.round((memory.heapTotal / 1024 / 1024) * 100) / 100,
        rssMb: Math.round((memory.rss / 1024 / 1024) * 100) / 100,
      },
      http: {
        totalRequests: this.totalRequests,
        requests2xx: this.requests2xx,
        requests4xx: this.requests4xx,
        requests5xx: this.requests5xx,
      },
      evDomain: {
        propulsionEnforcement: '100%_BATTERY_ELECTRIC',
        activePilotCity: 'visakhapatnam',
        activeVehiclesCount,
        activeZonesCount,
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Generates standard Prometheus text exposition format for scraping.
   */
  async getPrometheusMetrics(): Promise<string> {
    const metrics = await this.getMetrics();
    const memory = process.memoryUsage();

    return [
      '# HELP process_uptime_seconds Total process uptime in seconds',
      '# TYPE process_uptime_seconds gauge',
      `process_uptime_seconds ${metrics.uptimeSeconds}`,
      '',
      '# HELP process_resident_memory_bytes Resident memory size in bytes',
      '# TYPE process_resident_memory_bytes gauge',
      `process_resident_memory_bytes ${memory.rss}`,
      '',
      '# HELP nodejs_heap_size_used_bytes Process heap memory used in bytes',
      '# TYPE nodejs_heap_size_used_bytes gauge',
      `nodejs_heap_size_used_bytes ${memory.heapUsed}`,
      '',
      '# HELP http_requests_total Total HTTP requests handled',
      '# TYPE http_requests_total counter',
      `http_requests_total{status="2xx"} ${metrics.http.requests2xx}`,
      `http_requests_total{status="4xx"} ${metrics.http.requests4xx}`,
      `http_requests_total{status="5xx"} ${metrics.http.requests5xx}`,
      '',
      '# HELP ecoride_ev_fleet_active_count Number of active battery electric vehicles in fleet',
      '# TYPE ecoride_ev_fleet_active_count gauge',
      `ecoride_ev_fleet_active_count ${metrics.evDomain.activeVehiclesCount || 0}`,
      '',
      '# HELP ecoride_ev_zones_count Number of active PostGIS zones in operation',
      '# TYPE ecoride_ev_zones_count gauge',
      `ecoride_ev_zones_count ${metrics.evDomain.activeZonesCount || 0}`,
      '',
      '# HELP ecoride_battery_electric_only_enforced Flag indicating 100% electric propulsion enforcement',
      '# TYPE ecoride_battery_electric_only_enforced gauge',
      'ecoride_battery_electric_only_enforced 1',
    ].join('\n');
  }
}
