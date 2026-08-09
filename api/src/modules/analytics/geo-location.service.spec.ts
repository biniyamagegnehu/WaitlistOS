import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { GeoLocationService } from './geo-location.service';

describe('GeoLocationService', () => {
  let service: GeoLocationService;
  let mockConfigService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    mockConfigService = {
      get: jest.fn().mockReturnValue(undefined), // No DB by default
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GeoLocationService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<GeoLocationService>(GeoLocationService);
    await service.onModuleInit();
  });

  afterEach(() => {
    service.onModuleDestroy();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('resolveCountry', () => {
    it('should return null if lookup is not initialized (no DB)', () => {
      expect(service.resolveCountry('8.8.8.8')).toBeNull();
    });

    it('should ignore local IPs', () => {
      expect(service.resolveCountry('127.0.0.1')).toBeNull();
      expect(service.resolveCountry('::1')).toBeNull();
    });
    
    it('should return null for undefined IP', () => {
      expect(service.resolveCountry(undefined)).toBeNull();
    });
  });
});
