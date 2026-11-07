import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { HighValueCargoLockboxService } from '../src/modules/high-value-cargo-lockbox/high-value-cargo-lockbox.service';
import { HighValueLockbox } from '../src/database/entities/high-value-lockbox.entity';
import { LockboxSecurityState } from '@ecoride/contracts';

describe('HighValueCargoLockboxService (M105)', () => {
  let service: HighValueCargoLockboxService;
  let repo: Partial<Record<keyof Repository<HighValueLockbox>, jest.Mock>>;

  beforeEach(async () => {
    repo = {
      create: jest.fn().mockImplementation((dto) => ({ ...dto, id: 'mock-box-id', createdAt: new Date() })),
      save: jest.fn().mockImplementation(async (entity) => entity),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HighValueCargoLockboxService,
        {
          provide: getRepositoryToken(HighValueLockbox),
          useValue: repo,
        },
      ],
    }).compile();

    service = module.get<HighValueCargoLockboxService>(HighValueCargoLockboxService);
  });

  it('should provision secure lockbox for high-value pharma and generate dual-custody OTP hashes', async () => {
    const result = await service.provisionLockbox({
      consignmentId: 'CARGO-PHARMA-AIIMS-01',
      vehicleId: 'CARGO-VAN-EV-01',
      senderPhone: '+919876543210',
      receiverPhone: '+919876543211',
      isHighValuePharma: true,
    });

    expect(result.lockboxId).toBeDefined();
    expect(result.securityState).toBe(LockboxSecurityState.SECURE_LOCKED);
    expect(result.senderDepositOtpHash).toBeDefined();
    expect(result.receiverWithdrawalOtp).toHaveLength(6);
    expect(repo.save).toHaveBeenCalled();
  });

  it('should unlock electronic lock when recipient submits valid 6-digit withdrawal OTP', async () => {
    const receiverOtp = '654321';
    const receiverWithdrawalOtpHash = crypto.createHash('sha256').update(receiverOtp).digest('hex');

    repo.findOne = jest.fn().mockResolvedValue({
      id: 'mock-box-id',
      consignmentId: 'CARGO-PHARMA-AIIMS-01',
      senderDepositOtpHash: 'mock-hash',
      receiverWithdrawalOtpHash,
      securityState: LockboxSecurityState.SECURE_LOCKED,
    });

    const access = await service.verifyLockboxOtp({
      lockboxId: 'mock-box-id',
      otp: receiverOtp,
      actorRole: 'RECEIVER',
    });

    expect(access.isAccessGranted).toBe(true);
    expect(access.securityState).toBe(LockboxSecurityState.DELIVERED_CLEARED);
    expect(access.message).toContain('RECEIVER authenticated');
  });

  it('should deny access and retain locked security state when wrong OTP is entered', async () => {
    repo.findOne = jest.fn().mockResolvedValue({
      id: 'mock-box-id',
      consignmentId: 'CARGO-PHARMA-AIIMS-01',
      senderDepositOtpHash: crypto.createHash('sha256').update('111111').digest('hex'),
      receiverWithdrawalOtpHash: crypto.createHash('sha256').update('222222').digest('hex'),
      securityState: LockboxSecurityState.SECURE_LOCKED,
    });

    const access = await service.verifyLockboxOtp({
      lockboxId: 'mock-box-id',
      otp: '999999', // wrong OTP
      actorRole: 'RECEIVER',
    });

    expect(access.isAccessGranted).toBe(false);
    expect(access.securityState).toBe(LockboxSecurityState.SECURE_LOCKED);
    expect(access.message).toContain('Invalid lockbox authorization OTP');
  });
});
