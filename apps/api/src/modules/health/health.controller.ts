import { Controller, Get, HttpStatus, Res, Header } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import {
  HealthService,
  HealthCheckResult,
  LivenessResult,
  ReadinessResult,
} from './health.service';
import { MetricsService, ServiceMetricsPayload } from './metrics.service';

@ApiTags('Health & Diagnostics')
@Controller()
export class HealthController {
  constructor(
    private readonly healthService: HealthService,
    private readonly metricsService: MetricsService,
  ) {}

  @Get('health')
  @ApiOperation({
    summary: 'Platform overall health check',
    description:
      'Returns health status of the API service and its external infrastructure dependencies.',
  })
  @ApiResponse({ status: 200, description: 'All systems operational' })
  @ApiResponse({ status: 503, description: 'One or more dependencies degraded' })
  async getHealth(@Res({ passthrough: true }) res: Response): Promise<HealthCheckResult> {
    const result = await this.healthService.check();
    if (result.status !== 'ok') {
      res.status(HttpStatus.SERVICE_UNAVAILABLE);
    } else {
      res.status(HttpStatus.OK);
    }
    return result;
  }

  @Get('health/live')
  @ApiOperation({
    summary: 'Kubernetes Liveness Probe',
    description:
      'Signals whether the API application process is alive and responsive. Does not fail on DB issues.',
  })
  @ApiResponse({ status: 200, description: 'Application process is alive' })
  async getLiveness(): Promise<LivenessResult> {
    return this.healthService.checkLiveness();
  }

  @Get('health/ready')
  @ApiOperation({
    summary: 'Kubernetes Readiness Probe',
    description:
      'Signals whether the API is ready to accept traffic. Fails with HTTP 503 if database or redis is offline.',
  })
  @ApiResponse({ status: 200, description: 'Service is ready to handle requests' })
  @ApiResponse({ status: 503, description: 'Service is not ready (database or redis offline)' })
  async getReadiness(@Res({ passthrough: true }) res: Response): Promise<ReadinessResult> {
    const result = await this.healthService.checkReadiness();
    if (!result.ready) {
      res.status(HttpStatus.SERVICE_UNAVAILABLE);
    } else {
      res.status(HttpStatus.OK);
    }
    return result;
  }

  @Get('health/metrics')
  @ApiOperation({
    summary: 'Service runtime metrics (JSON)',
    description:
      'Provides structured runtime metrics including memory, uptime, HTTP throughput, and EV fleet counters.',
  })
  @ApiResponse({ status: 200, description: 'Service metrics retrieved successfully' })
  async getMetrics(): Promise<ServiceMetricsPayload> {
    return this.metricsService.getMetrics();
  }

  @Get('metrics')
  @Header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
  @ApiOperation({
    summary: 'Prometheus metrics scrape endpoint',
    description: 'Returns standard Prometheus exposition format metrics for scraping.',
  })
  @ApiResponse({ status: 200, description: 'Prometheus text format metrics' })
  async getPrometheusMetrics(): Promise<string> {
    return this.metricsService.getPrometheusMetrics();
  }
}
