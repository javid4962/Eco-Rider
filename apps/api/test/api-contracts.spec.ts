import { BadRequestException, HttpStatus } from '@nestjs/common';
import { ArgumentsHost } from '@nestjs/common';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import {
  ApiErrorCode,
  paiseToRupees,
  rupeesToPaise,
  formatInr,
  isValidIsoUtc,
} from '@ecoride/contracts';
import { QuotesService } from '../src/modules/quotes/quotes.service';

describe('API Contracts, Error Envelopes, and Conventions', () => {
  describe('HttpExceptionFilter (Stable Error Envelope)', () => {
    let filter: HttpExceptionFilter;
    let mockResponse: {
      status: jest.Mock;
      json: jest.Mock;
      setHeader: jest.Mock;
    };

    beforeEach(() => {
      filter = new HttpExceptionFilter();
      mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        setHeader: jest.fn().mockReturnThis(),
      };
    });

    const createMockHost = (url = '/v1/quotes', correlationHeader?: string): ArgumentsHost => {
      const mockRequest = {
        url,
        correlationId: correlationHeader,
        headers: correlationHeader ? { 'x-correlation-id': correlationHeader } : {},
      };
      return {
        switchToHttp: () => ({
          getResponse: () => mockResponse,
          getRequest: () => mockRequest,
        }),
      } as unknown as ArgumentsHost;
    };

    it('should format HttpException into stable error envelope with correlation ID', () => {
      const customCorrelation = 'req-trace-vizag-001';
      const host = createMockHost('/v1/quotes', customCorrelation);
      const exception = new BadRequestException('Invalid coordinates provided');

      filter.catch(exception, host);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.setHeader).toHaveBeenCalledWith('x-correlation-id', customCorrelation);

      const jsonPayload = mockResponse.json.mock.calls[0][0];
      expect(jsonPayload.success).toBe(false);
      expect(jsonPayload.error.code).toBe(ApiErrorCode.BAD_REQUEST);
      expect(jsonPayload.error.message).toBe('Invalid coordinates provided');
      expect(jsonPayload.correlationId).toBe(customCorrelation);
      expect(isValidIsoUtc(jsonPayload.timestamp)).toBe(true);
      expect(jsonPayload.path).toBe('/v1/quotes');
    });

    it('should preserve custom error codes such as ZONE_RESTRICTED', () => {
      const host = createMockHost('/v1/quotes');
      const exception = new BadRequestException({
        code: ApiErrorCode.ZONE_RESTRICTED,
        message: 'City is outside the pilot zone bounds.',
      });

      filter.catch(exception, host);

      const jsonPayload = mockResponse.json.mock.calls[0][0];
      expect(jsonPayload.error.code).toBe(ApiErrorCode.ZONE_RESTRICTED);
      expect(jsonPayload.error.message).toContain('outside the pilot zone');
    });

    it('should securely sanitize unhandled 500 errors and NEVER leak stack traces or secrets', () => {
      const host = createMockHost('/v1/secure-op');
      const sensitiveLeakException = new Error(
        'FATAL: Database connection failed at postgres://user:SECRET_PASS@db:5432/ecoride',
      );

      filter.catch(sensitiveLeakException, host);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);

      const jsonPayload = mockResponse.json.mock.calls[0][0];
      expect(jsonPayload.success).toBe(false);
      expect(jsonPayload.error.code).toBe(ApiErrorCode.INTERNAL_SERVER_ERROR);
      expect(jsonPayload.error.message).toBe('An unexpected internal server error occurred.');
      expect(jsonPayload.error.details).toBeUndefined();
      expect(JSON.stringify(jsonPayload)).not.toContain('SECRET_PASS');
      expect(JSON.stringify(jsonPayload)).not.toContain('stack');
      expect(JSON.stringify(jsonPayload)).not.toContain('postgres://');
    });

    it('should generate a valid correlation ID when none is supplied in request', () => {
      const host = createMockHost('/v1/quotes');
      filter.catch(new BadRequestException('Missing parameter'), host);

      const jsonPayload = mockResponse.json.mock.calls[0][0];
      expect(jsonPayload.correlationId).toBeDefined();
      expect(jsonPayload.correlationId.length).toBeGreaterThan(10);
    });
  });

  describe('Money Conventions (Integer Paise)', () => {
    it('should accurately convert between integer paise and rupees without floating-point drift', () => {
      expect(paiseToRupees(15000)).toBe(150.0);
      expect(paiseToRupees(2550)).toBe(25.5);
      expect(rupeesToPaise(150.0)).toBe(15000);
      expect(rupeesToPaise(25.5)).toBe(2550);
    });

    it('should format paise into Indian Rupee currency string', () => {
      const formatted = formatInr(15000);
      expect(formatted).toContain('150.00');
    });
  });

  describe('Date Conventions (ISO-8601 UTC)', () => {
    it('should validate ISO-8601 UTC timestamp format', () => {
      expect(isValidIsoUtc(new Date().toISOString())).toBe(true);
      expect(isValidIsoUtc('2026-11-01T10:00:00.000Z')).toBe(true);
      expect(isValidIsoUtc('2026-11-01 10:00:00')).toBe(false); // missing T and Z
      expect(isValidIsoUtc('invalid-date')).toBe(false);
    });
  });

  describe('QuotesService (EV Ride Quoting & Validation)', () => {
    let service: QuotesService;

    beforeEach(() => {
      service = new QuotesService();
    });

    it('should calculate valid EV quote with integer paise for Visakhapatnam pilot', () => {
      const quote = service.calculateQuote({
        city: 'visakhapatnam',
        serviceCategory: 'CITY_COMMUTE_2W',
        pickupLatitude: 17.6868,
        pickupLongitude: 83.2185,
        dropoffLatitude: 17.7275,
        dropoffLongitude: 83.3038,
      });

      expect(quote.quoteId).toBeDefined();
      expect(quote.city).toBe('visakhapatnam');
      expect(quote.serviceCategory).toBe('CITY_COMMUTE_2W');
      expect(quote.propulsion).toBe('BATTERY_ELECTRIC');
      expect(quote.distanceMeters).toBeGreaterThan(9500);
      expect(quote.fare.currency).toBe('INR');
      expect(quote.fare.amountPaise).toBeGreaterThan(2500);
      expect(Number.isInteger(quote.fare.amountPaise)).toBe(true);
      expect(isValidIsoUtc(quote.expiresAt)).toBe(true);
    });

    it('should reject unauthorized city outside pilot with ZONE_RESTRICTED', () => {
      expect(() => {
        service.calculateQuote({
          city: 'hyderabad',
          serviceCategory: 'CITY_COMMUTE_2W',
          pickupLatitude: 17.385,
          pickupLongitude: 78.4867,
          dropoffLatitude: 17.4,
          dropoffLongitude: 78.5,
        });
      }).toThrow(BadRequestException);
    });
  });
});
