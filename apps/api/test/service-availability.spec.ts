import { VehicleServiceClass } from '@ecoride/contracts';
import { QuotesService } from '../src/modules/quotes/quotes.service';
import { ZonesService } from '../src/modules/zones/zones.service';

describe('Service Availability & Pricing API (EV-037 Unit Specs)', () => {
  let quotesService: QuotesService;
  let mockZonesService: {
    verifyLocation: jest.Mock;
    getZoneById: jest.Mock;
  };

  beforeEach(() => {
    mockZonesService = {
      verifyLocation: jest.fn().mockResolvedValue({
        isAuthorized: true,
        isInsideGeofence: true,
        zoneId: 'z0000000-0000-4000-8000-000000000001',
        zoneName: 'Visakhapatnam Pilot Corridor',
        zoneCode: 'zone-vizag-corridor-01',
      }),
      getZoneById: jest.fn().mockResolvedValue({
        id: 'z0000000-0000-4000-8000-000000000001',
        name: 'Visakhapatnam Pilot Corridor',
        categorySwitches: {
          CITY_COMMUTE_2W: true,
          SHARED_SHUTTLE_4W: true,
          AUTO_COMMUTE_3W: false,
          CAB_PRIVATE_4W: false,
        },
      }),
    };

    quotesService = new QuotesService(
      mockZonesService as unknown as ZonesService,
      undefined,
      undefined,
      undefined,
    );
  });

  describe('1. Pilot Boundary & Geofence Verification', () => {
    it('should reject out-of-pilot city and return empty categories', async () => {
      const res = await quotesService.getServiceAvailability({
        city: 'hyderabad',
        pickupLatitude: 17.385,
        pickupLongitude: 78.4867,
      });

      expect(res.isInsideGeofence).toBe(false);
      expect(res.categories).toEqual([]);
      expect(res.operatorNotice).toContain('Guntur, Vijayawada, and Amaravathi launch corridor');
    });

    it('should return empty categories when coordinates are outside authorized polygonal zones', async () => {
      mockZonesService.verifyLocation.mockResolvedValueOnce({
        isAuthorized: false,
        isInsideGeofence: false,
        zoneId: null,
      });

      const res = await quotesService.getServiceAvailability({
        city: 'visakhapatnam',
        pickupLatitude: 16.5,
        pickupLongitude: 80.6,
      });

      expect(res.isInsideGeofence).toBe(false);
      expect(res.categories).toEqual([]);
      expect(res.operatorNotice).toContain('outside authorized');
    });
  });

  describe('2. Dynamic Category Availability & Bookability', () => {
    it('should mark enabled categories as bookable and disabled categories as unbookable', async () => {
      const res = await quotesService.getServiceAvailability({
        city: 'visakhapatnam',
        pickupLatitude: 17.7126,
        pickupLongitude: 83.3174,
      });

      expect(res.isInsideGeofence).toBe(true);
      expect(res.categories.length).toBe(4);

      // 2W Bike Taxi
      const bike = res.categories.find((c) => c.serviceCategory === 'CITY_COMMUTE_2W');
      expect(bike).toBeDefined();
      expect(bike?.isEnabled).toBe(true);
      expect(bike?.isBookable).toBe(true);
      expect(bike?.vehicleClass).toBe(VehicleServiceClass.ECO_BIKE);
      expect(bike?.availableCaptainsCount).toBeGreaterThan(0);
      expect(bike?.rejectionOrUnavailableReason).toBeNull();

      // Shared Shuttle 4W
      const shuttle = res.categories.find((c) => c.serviceCategory === 'SHARED_SHUTTLE_4W');
      expect(shuttle).toBeDefined();
      expect(shuttle?.isEnabled).toBe(true);
      expect(shuttle?.isBookable).toBe(true);
      expect(shuttle?.vehicleClass).toBe(VehicleServiceClass.ECO_VAN);
      expect(shuttle?.availableCaptainsCount).toBeGreaterThan(0);

      // 3W Auto (Disabled in pilot)
      const auto = res.categories.find((c) => c.serviceCategory === 'AUTO_COMMUTE_3W');
      expect(auto).toBeDefined();
      expect(auto?.isEnabled).toBe(false);
      expect(auto?.isBookable).toBe(false);
      expect(auto?.availableCaptainsCount).toBe(0);
      expect(auto?.rejectionOrUnavailableReason).toContain(
        'disabled or pending statutory AP-STA approval',
      );

      // 4W Cab (Disabled in pilot)
      const cab = res.categories.find((c) => c.serviceCategory === 'CAB_PRIVATE_4W');
      expect(cab).toBeDefined();
      expect(cab?.isEnabled).toBe(false);
      expect(cab?.isBookable).toBe(false);
      expect(cab?.availableCaptainsCount).toBe(0);
      expect(cab?.rejectionOrUnavailableReason).toContain(
        'disabled or pending statutory AP-STA approval',
      );
    });

    it('should accurately reflect simulated zero-driver state as unbookable', async () => {
      const res = await quotesService.getServiceAvailability({
        city: 'visakhapatnam',
        pickupLatitude: 17.7126,
        pickupLongitude: 83.3174,
        simulateZeroDrivers: true,
      });

      expect(res.isInsideGeofence).toBe(true);
      for (const cat of res.categories) {
        expect(cat.isBookable).toBe(false);
        expect(cat.availableCaptainsCount).toBe(0);
        if (cat.isEnabled) {
          expect(cat.rejectionOrUnavailableReason).toContain('No EV captains currently online');
        }
      }
    });
  });

  describe('3. Dynamic Fares, ETAs & Cancellation Policies', () => {
    it('should calculate estimated fares for enabled categories when dropoff is provided', async () => {
      const res = await quotesService.getServiceAvailability({
        city: 'visakhapatnam',
        pickupLatitude: 17.7126,
        pickupLongitude: 83.3174,
        dropoffLatitude: 17.745,
        dropoffLongitude: 83.342,
      });

      const bike = res.categories.find((c) => c.serviceCategory === 'CITY_COMMUTE_2W');
      expect(bike?.estimatedFarePaise).toBeGreaterThan(0);
      expect(bike?.formattedFare).toMatch(/^₹\d+\.\d{2}$/);
      expect(bike?.estimatedEtaMinutes).toBeGreaterThan(0);
    });

    it('should provide statutory AP cancellation terms and operator notice', async () => {
      const res = await quotesService.getServiceAvailability({
        city: 'visakhapatnam',
        pickupLatitude: 17.7126,
        pickupLongitude: 83.3174,
      });

      expect(res.operatorNotice).toContain('AP State Transport Authority Permit (GO-42)');
      expect(res.cancellationTerms.freeCancellationMinutes).toBe(3);
      expect(res.cancellationTerms.driverCompensationFeePaise).toBe(1500);
      expect(res.cancellationTerms.formattedCancellationFee).toBe('₹15.00');
      expect(res.cancellationTerms.policySummary).toContain('Free cancellation within 3 minutes');
    });
  });
});
