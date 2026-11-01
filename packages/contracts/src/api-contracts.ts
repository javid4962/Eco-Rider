/**
 * EcoRide Authoritative API Contracts & Error Specifications
 * Standardized for NestJS API, Next.js Ops Portal, and Flutter Mobile Apps
 */

export enum ApiErrorCode {
  BAD_REQUEST = 'BAD_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  UNPROCESSABLE_ENTITY = 'UNPROCESSABLE_ENTITY',
  ZONE_RESTRICTED = 'ZONE_RESTRICTED',
  PROPULSION_NON_ELECTRIC = 'PROPULSION_NON_ELECTRIC',
  RATE_LIMITED = 'RATE_LIMITED',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
}

export interface ApiErrorDetail {
  field?: string;
  message: string;
  constraint?: string;
}

export interface ApiErrorPayload {
  code: ApiErrorCode | string;
  message: string;
  details?: ApiErrorDetail[] | string[];
}

export interface ApiErrorEnvelope {
  success: false;
  error: ApiErrorPayload;
  correlationId: string;
  timestamp: string; // ISO-8601 UTC string
  path: string;
}

export interface ApiResponseEnvelope<T> {
  success: true;
  data: T;
  correlationId: string;
  timestamp: string; // ISO-8601 UTC string
}

/**
 * Money & Currency Conventions
 * Monetary amounts are strictly handled as integer paise (1 Rupee = 100 paise)
 * to eliminate floating-point arithmetic errors.
 */
export type CurrencyCode = 'INR';

export interface MoneyAmount {
  amountPaise: number; // Integer, must be >= 0
  currency: CurrencyCode;
}

export function paiseToRupees(amountPaise: number): number {
  return Math.round(amountPaise) / 100;
}

export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

export function formatInr(amountPaise: number): string {
  const rupees = paiseToRupees(amountPaise);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(rupees);
}

/**
 * Date Conventions
 * Timestamps must strictly adhere to ISO-8601 in UTC (YYYY-MM-DDTHH:mm:ss.sssZ).
 */
export function toIsoUtcString(date: Date = new Date()): string {
  return date.toISOString();
}

export function isValidIsoUtc(dateStr: string): boolean {
  if (!dateStr || typeof dateStr !== 'string') return false;
  const isoUtcRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/;
  if (!isoUtcRegex.test(dateStr)) return false;
  const timestamp = Date.parse(dateStr);
  return !isNaN(timestamp);
}
