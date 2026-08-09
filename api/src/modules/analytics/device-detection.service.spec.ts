import { Test, TestingModule } from '@nestjs/testing';
import { DeviceDetectionService } from './device-detection.service';

describe('DeviceDetectionService', () => {
  let service: DeviceDetectionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DeviceDetectionService],
    }).compile();

    service = module.get<DeviceDetectionService>(DeviceDetectionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('detectDevice', () => {
    it('should parse mobile UA correctly', () => {
      const ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1';
      const result = service.detectDevice(ua);
      expect(result.deviceType).toBe('MOBILE');
      expect(result.browserName).toBe('Safari');
    });

    it('should parse desktop UA correctly', () => {
      const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
      const result = service.detectDevice(ua);
      expect(result.deviceType).toBe('DESKTOP');
      expect(result.browserName).toBe('Chrome');
    });

    it('should parse tablet UA correctly', () => {
      const ua = 'Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1';
      const result = service.detectDevice(ua);
      expect(result.deviceType).toBe('TABLET');
      expect(result.browserName).toBe('Safari');
    });

    it('should fallback to UNKNOWN for missing UA', () => {
      const result = service.detectDevice(undefined);
      expect(result.deviceType).toBe('UNKNOWN');
      expect(result.browserName).toBe('Unknown');
    });
  });
});
