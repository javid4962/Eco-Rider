import { LocalizationService } from '../src/common/localization/localization.service';
import { ResponseMessageKey } from '@ecoride/contracts';

describe('LocalizationService (EV-021 Unit Tests)', () => {
  let service: LocalizationService;

  beforeEach(() => {
    service = new LocalizationService();
  });

  describe('Locale Normalization & Defaults', () => {
    it('should default to Telugu (te) for undefined or null locale', () => {
      expect(service.normalizeLocale()).toBe('te');
      expect(service.normalizeLocale(undefined)).toBe('te');
    });

    it('should parse locale with region subtag (e.g., te-IN, en-US, hi-IN)', () => {
      expect(service.normalizeLocale('te-IN')).toBe('te');
      expect(service.normalizeLocale('en-US')).toBe('en');
      expect(service.normalizeLocale('en-GB')).toBe('en');
      expect(service.normalizeLocale('hi-IN')).toBe('hi');
    });

    it('should fall back to default Telugu for unsupported locales', () => {
      expect(service.normalizeLocale('fr-FR')).toBe('te');
      expect(service.normalizeLocale('de')).toBe('te');
    });
  });

  describe('Message Translation & Retrieval', () => {
    it('should translate core booking message in Telugu', () => {
      const msg = service.translate(ResponseMessageKey.BOOKING_CREATED, 'te');
      expect(msg).toContain('రైడ్ అభ్యర్థన విజయవంతంగా చేయబడింది');
    });

    it('should translate core booking message in English', () => {
      const msg = service.translate(ResponseMessageKey.BOOKING_CREATED, 'en');
      expect(msg).toBe('Ride request placed successfully. Matching nearby EV captain.');
    });

    it('should translate core payment message in Telugu and English', () => {
      const msgTe = service.translate(ResponseMessageKey.PAYMENT_SUCCESSFUL, 'te', { amount: 150 });
      const msgEn = service.translate(ResponseMessageKey.PAYMENT_SUCCESSFUL, 'en', { amount: 150 });

      expect(msgTe).toBe('₹150 చెల్లింపు విజయవంతంగా పూర్తయింది.');
      expect(msgEn).toBe('Payment of ₹150 received successfully.');
    });

    it('should translate safety SOS message in Telugu and English', () => {
      const msgTe = service.translate(ResponseMessageKey.SAFETY_SOS_TRIGGERED, 'te');
      const msgEn = service.translate(ResponseMessageKey.SAFETY_SOS_TRIGGERED, 'en');

      expect(msgTe).toContain('ఎమర్జెన్సీ ఎస్ఓఎస్ ప్రారంభించబడింది');
      expect(msgEn).toContain('Emergency SOS triggered');
    });

    it('should translate EV captain duty and battery constraint messages', () => {
      const msgTe = service.translate(ResponseMessageKey.CAPTAIN_BATTERY_LOW, 'te');
      const msgEn = service.translate(ResponseMessageKey.CAPTAIN_BATTERY_LOW, 'en');

      expect(msgTe).toContain('బ్యాటరీ 20% కంటే తక్కువగా ఉంది');
      expect(msgEn).toContain('Battery SoC is below 20%');
    });
  });

  describe('Parameter Interpolation', () => {
    it('should interpolate single and multiple parameters in templates', () => {
      const msg = service.translate(ResponseMessageKey.BOOKING_CAPTAIN_ASSIGNED, 'en', {
        name: 'Srinivas',
      });
      expect(msg).toBe('Your EV Captain Srinivas is on the way.');
    });

    it('should leave template intact if params are omitted', () => {
      const msg = service.translate(ResponseMessageKey.BOOKING_CAPTAIN_ASSIGNED, 'en');
      expect(msg).toBe('Your EV Captain {{name}} is on the way.');
    });
  });

  describe('Fallback Mechanism', () => {
    it('should return messageKey if absent in all dictionaries without throwing', () => {
      const result = service.translate('non.existent.random.key', 'te');
      expect(result).toBe('non.existent.random.key');
    });
  });

  describe('getLocalizedResponse', () => {
    it('should return structured LocalizedMessageDto', () => {
      const dto = service.getLocalizedResponse(ResponseMessageKey.AUTH_INVALID_OTP, 'te');

      expect(dto.messageKey).toBe(ResponseMessageKey.AUTH_INVALID_OTP);
      expect(dto.locale).toBe('te');
      expect(dto.message).toContain('తప్పు లేదా గడువు ముగిసిన ఓటీపీ');
    });
  });

  describe('getAllMessages', () => {
    it('should return complete dictionary for given locale merged with English fallback', () => {
      const teDict = service.getAllMessages('te');
      expect(teDict[ResponseMessageKey.BOOKING_CREATED]).toBeDefined();
      expect(teDict[ResponseMessageKey.PAYMENT_SUCCESSFUL]).toBeDefined();

      const enDict = service.getAllMessages('en');
      expect(enDict[ResponseMessageKey.BOOKING_CREATED]).toBeDefined();
    });
  });
});
