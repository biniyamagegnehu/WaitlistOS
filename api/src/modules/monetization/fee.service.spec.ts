import { Test, TestingModule } from '@nestjs/testing';
import { FeeService } from './fee.service';
import { ConfigService } from '@nestjs/config';

describe('FeeService', () => {
  let service: FeeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeeService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue(10), // 10% platform fee
          },
        },
      ],
    }).compile();

    service = module.get<FeeService>(FeeService);
  });

  it('should calculate fees correctly for exactly $100', () => {
    const amount = 100;
    const fees = service.calculateFees(amount);
    
    expect(fees.platformFee).toBe(10);
    expect(fees.providerFee).toBe(0);
    expect(fees.founderAmount).toBe(90);
  });

  it('should calculate fees correctly for floating point numbers', () => {
    const amount = 49.99;
    const fees = service.calculateFees(amount);
    
    expect(fees.platformFee).toBe(5); // 10% of 49.99 = 4.999 -> rounded to 2 decimals -> 5.00
    expect(fees.providerFee).toBe(0);
    expect(fees.founderAmount).toBe(44.99); // 49.99 - 5.00 = 44.99
  });
});
