import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  MAPS_PROVIDER,
  OTP_PROVIDER,
  PAYMENTS_PROVIDER,
  RAZORPAY_PAYMENT_PROVIDER,
  SMS_PROVIDER,
  PUSH_PROVIDER,
  KYC_PROVIDER,
  WHATSAPP_PROVIDER,
} from './providers.constants';
import {
  MockMapsProvider,
  MockOtpProvider,
  MockPaymentsProvider,
  MockSmsProvider,
  MockPushProvider,
  MockKycProvider,
  MockWhatsAppProvider,
} from './mock';
import { Msg91OtpProvider } from './msg91';
import { RazorpayPaymentProvider } from './razorpay/razorpay-payments.provider';
import { SurepassKycProvider } from './surepass/surepass-kyc.provider';
import { GoogleMapsProvider } from './maps/google-maps.provider';

@Global()
@Module({
  providers: [
    MockMapsProvider,
    MockOtpProvider,
    MockPaymentsProvider,
    MockSmsProvider,
    MockPushProvider,
    MockKycProvider,
    MockWhatsAppProvider,
    {
      provide: GoogleMapsProvider,
      useFactory: (configService: ConfigService, fallback: MockMapsProvider) =>
        new GoogleMapsProvider(configService, fallback),
      inject: [ConfigService, MockMapsProvider],
    },
    {
      provide: MAPS_PROVIDER,
      useFactory: (
        configService: ConfigService,
        googleMaps: GoogleMapsProvider,
        mockMaps: MockMapsProvider,
      ) => {
        const providerType = configService.get<string>('MAPS_PROVIDER_TYPE') || 'MOCK';
        if (providerType === 'GOOGLE_MAPS') {
          return googleMaps;
        }
        return mockMaps;
      },
      inject: [ConfigService, GoogleMapsProvider, MockMapsProvider],
    },
    {
      provide: Msg91OtpProvider,
      useFactory: (configService: ConfigService) => new Msg91OtpProvider(configService),
      inject: [ConfigService],
    },
    {
      provide: OTP_PROVIDER,
      useFactory: (configService: ConfigService, msg91: Msg91OtpProvider) => {
        const providerType = configService.get<string>('OTP_PROVIDER_TYPE') || 'MOCK';
        if (providerType === 'MSG91') {
          return msg91;
        }
        return new MockOtpProvider();
      },
      inject: [ConfigService, Msg91OtpProvider],
    },
    {
      provide: RazorpayPaymentProvider,
      useFactory: (configService: ConfigService) => new RazorpayPaymentProvider(configService),
      inject: [ConfigService],
    },
    {
      provide: PAYMENTS_PROVIDER,
      useFactory: (
        configService: ConfigService,
        razorpay: RazorpayPaymentProvider,
        mockPayments: MockPaymentsProvider,
      ) => {
        const providerType = configService.get<string>('PAYMENTS_PROVIDER_TYPE') || 'MOCK';
        if (providerType === 'RAZORPAY') {
          return razorpay;
        }
        return mockPayments;
      },
      inject: [ConfigService, RazorpayPaymentProvider, MockPaymentsProvider],
    },
    {
      provide: RAZORPAY_PAYMENT_PROVIDER,
      useClass: RazorpayPaymentProvider,
    },
    {
      provide: SMS_PROVIDER,
      useClass: MockSmsProvider,
    },
    {
      provide: PUSH_PROVIDER,
      useClass: MockPushProvider,
    },
    {
      provide: SurepassKycProvider,
      useFactory: (configService: ConfigService) => new SurepassKycProvider(configService),
      inject: [ConfigService],
    },
    {
      provide: KYC_PROVIDER,
      useFactory: (
        configService: ConfigService,
        surepass: SurepassKycProvider,
        mockKyc: MockKycProvider,
      ) => {
        const providerType = configService.get<string>('KYC_PROVIDER_TYPE') || 'MOCK';
        if (providerType === 'SUREPASS') {
          return surepass;
        }
        return mockKyc;
      },
      inject: [ConfigService, SurepassKycProvider, MockKycProvider],
    },
    {
      provide: WHATSAPP_PROVIDER,
      useClass: MockWhatsAppProvider,
    },
  ],
  exports: [
    MAPS_PROVIDER,
    OTP_PROVIDER,
    PAYMENTS_PROVIDER,
    RAZORPAY_PAYMENT_PROVIDER,
    SMS_PROVIDER,
    PUSH_PROVIDER,
    KYC_PROVIDER,
    WHATSAPP_PROVIDER,
    MockMapsProvider,
    GoogleMapsProvider,
    MockOtpProvider,
    Msg91OtpProvider,
    MockPaymentsProvider,
    RazorpayPaymentProvider,
    MockSmsProvider,
    MockPushProvider,
    MockKycProvider,
    SurepassKycProvider,
    MockWhatsAppProvider,
  ],
})
export class ProvidersModule {}
