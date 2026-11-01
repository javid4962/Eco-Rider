import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  MAPS_PROVIDER,
  OTP_PROVIDER,
  PAYMENTS_PROVIDER,
  SMS_PROVIDER,
  PUSH_PROVIDER,
} from './providers.constants';
import {
  MockMapsProvider,
  MockOtpProvider,
  MockPaymentsProvider,
  MockSmsProvider,
  MockPushProvider,
} from './mock';
import { Msg91OtpProvider } from './msg91';

@Global()
@Module({
  providers: [
    {
      provide: MAPS_PROVIDER,
      useClass: MockMapsProvider,
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
      provide: PAYMENTS_PROVIDER,
      useClass: MockPaymentsProvider,
    },
    {
      provide: SMS_PROVIDER,
      useClass: MockSmsProvider,
    },
    {
      provide: PUSH_PROVIDER,
      useClass: MockPushProvider,
    },
    MockMapsProvider,
    MockOtpProvider,
    MockPaymentsProvider,
    MockSmsProvider,
    MockPushProvider,
  ],
  exports: [
    MAPS_PROVIDER,
    OTP_PROVIDER,
    PAYMENTS_PROVIDER,
    SMS_PROVIDER,
    PUSH_PROVIDER,
    MockMapsProvider,
    MockOtpProvider,
    Msg91OtpProvider,
    MockPaymentsProvider,
    MockSmsProvider,
    MockPushProvider,
  ],
})
export class ProvidersModule {}
