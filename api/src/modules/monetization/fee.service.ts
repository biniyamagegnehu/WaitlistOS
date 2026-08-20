import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FeeService {
  private readonly platformFeePercentage: number;

  constructor(private readonly configService: ConfigService) {
    this.platformFeePercentage = this.configService.get<number>('monetization.platformFeePercentage') ?? 10;
  }

  /**
   * Calculates fees and amounts for a given gross amount.
   * 
   * @param amount gross amount in standard units (e.g., 100.00)
   * @returns fee calculation breakdown
   */
  calculateFees(amount: number): {
    platformFee: number;
    providerFee: number;
    founderAmount: number;
  } {
    const platformFee = Number((amount * (this.platformFeePercentage / 100)).toFixed(2));
    const providerFee = 0; // Handled by provider on payout
    const founderAmount = Number((amount - platformFee).toFixed(2));

    return {
      platformFee,
      providerFee,
      founderAmount,
    };
  }
}
