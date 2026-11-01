import { Module, Global } from '@nestjs/common';
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

@Global()
@Module({
  providers: [
    {
      provide: MAPS_PROVIDER,
      useClass: MockMapsProvider,
    },
    {
      provide: OTP_PROVIDER,
      useClass: MockOtpProvider,
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
    MockPaymentsProvider,
    MockSmsProvider,
    MockPushProvider,
  ],
})
export class ProvidersModule {}
