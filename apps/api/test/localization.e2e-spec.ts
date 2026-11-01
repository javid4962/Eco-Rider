import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { LocalizationController } from '../src/common/localization/localization.controller';
import { LocalizationService } from '../src/common/localization/localization.service';
import { ResponseMessageKey } from '@ecoride/contracts';

describe('Localization API Controller Integration (e2e)', () => {
  let app: INestApplication;
  let controller: LocalizationController;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [LocalizationController],
      providers: [LocalizationService],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
    controller = app.get<LocalizationController>(LocalizationController);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('GET /localization/messages', () => {
    it('should return default Telugu dictionary when locale query is omitted', () => {
      const res = controller.getAllMessages();

      expect(res.locale).toBe('te');
      expect(res.messages).toBeDefined();
      expect(res.messages[ResponseMessageKey.BOOKING_CREATED]).toContain(
        'రైడ్ అభ్యర్థన విజయవంతంగా చేయబడింది',
      );
    });

    it('should return English dictionary when locale=en is specified', () => {
      const res = controller.getAllMessages('en');

      expect(res.locale).toBe('en');
      expect(res.messages).toBeDefined();
      expect(res.messages[ResponseMessageKey.BOOKING_CREATED]).toBe(
        'Ride request placed successfully. Matching nearby EV captain.',
      );
    });
  });

  describe('GET /localization/messages/:key', () => {
    it('should resolve booking created message in Telugu', () => {
      const res = controller.getMessage(ResponseMessageKey.BOOKING_CREATED, 'te');

      expect(res.messageKey).toBe(ResponseMessageKey.BOOKING_CREATED);
      expect(res.locale).toBe('te');
      expect(res.message).toContain('రైడ్ అభ్యర్థన విజయవంతంగా చేయబడింది');
    });

    it('should resolve booking created message in English', () => {
      const res = controller.getMessage(ResponseMessageKey.BOOKING_CREATED, 'en');

      expect(res.messageKey).toBe(ResponseMessageKey.BOOKING_CREATED);
      expect(res.locale).toBe('en');
      expect(res.message).toBe('Ride request placed successfully. Matching nearby EV captain.');
    });

    it('should resolve payment success message in Telugu and English', () => {
      const resTe = controller.getMessage(ResponseMessageKey.PAYMENT_SUCCESSFUL, 'te');
      expect(resTe.message).toContain('చెల్లింపు విజయవంతంగా పూర్తయింది');

      const resEn = controller.getMessage(ResponseMessageKey.PAYMENT_SUCCESSFUL, 'en');
      expect(resEn.message).toContain('Payment of ₹{{amount}} received successfully.');
    });

    it('should fallback gracefully to key name for unrecognized key', () => {
      const res = controller.getMessage('custom.unknown.key', 'te');

      expect(res.messageKey).toBe('custom.unknown.key');
      expect(res.message).toBe('custom.unknown.key');
    });
  });
});
