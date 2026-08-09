import { Injectable, Logger } from '@nestjs/common';
import { UAParser } from 'ua-parser-js';

export interface DeviceInfo {
  deviceType: 'MOBILE' | 'DESKTOP' | 'TABLET' | 'UNKNOWN';
  browserName: string;
}

@Injectable()
export class DeviceDetectionService {
  private readonly logger = new Logger(DeviceDetectionService.name);

  /**
   * Parses the User-Agent string to determine device type and browser name.
   */
  detectDevice(userAgentString: string | undefined | null): DeviceInfo {
    const fallback: DeviceInfo = { deviceType: 'UNKNOWN', browserName: 'Unknown' };
    
    if (!userAgentString) {
      return fallback;
    }

    try {
      const parser = new UAParser(userAgentString);
      const result = parser.getResult();
      
      return {
        deviceType: this.normalizeDeviceType(result.device.type),
        browserName: this.normalizeBrowserName(result.browser.name),
      };
    } catch (error) {
      this.logger.warn(`Failed to parse User-Agent: ${(error as Error).message}`);
      return fallback;
    }
  }

  private normalizeDeviceType(type: string | undefined): 'MOBILE' | 'DESKTOP' | 'TABLET' | 'UNKNOWN' {
    if (!type) {
      return 'DESKTOP'; // In ua-parser-js, desktops often have undefined device type if it's a standard PC
    }
    
    const lowerType = type.toLowerCase();
    
    if (lowerType === 'mobile' || lowerType === 'wearable') {
      return 'MOBILE';
    }
    
    if (lowerType === 'tablet') {
      return 'TABLET';
    }
    
    if (lowerType === 'console' || lowerType === 'smarttv') {
      return 'UNKNOWN';
    }
    
    return 'UNKNOWN';
  }

  private normalizeBrowserName(name: string | undefined): string {
    if (!name) {
      return 'Unknown';
    }

    const lowerName = name.toLowerCase();

    // Map common browsers to simplified names
    if (lowerName.includes('chrome')) return 'Chrome';
    if (lowerName.includes('safari')) return 'Safari';
    if (lowerName.includes('firefox')) return 'Firefox';
    if (lowerName.includes('edge')) return 'Edge';
    if (lowerName.includes('opera')) return 'Opera';
    if (lowerName.includes('samsung')) return 'Samsung Internet';

    return name; // Return as-is if it's something else recognizable, or "Other" might be preferred on the frontend
  }
}
