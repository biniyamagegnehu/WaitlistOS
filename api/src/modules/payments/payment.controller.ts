import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { VerifiedEmailGuard } from '../auth/guards/verified-email.guard';
import type { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import { InitializePaymentDto } from './dto/initialize-payment.dto';
import { PaymentService } from './payment.service';

@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Public()
  @Get('plans')
  @HttpCode(HttpStatus.OK)
  getPlans() {
    return this.paymentService.getPublicPlans().then((data) => ({
      success: true,
      data,
    }));
  }

  @UseGuards(VerifiedEmailGuard)
  @Get('subscription')
  @HttpCode(HttpStatus.OK)
  getSubscription(@CurrentUser() user: AuthenticatedUser) {
    return this.paymentService
      .getSubscriptionSummary(user.userId)
      .then((data) => ({ success: true, data }));
  }

  @UseGuards(VerifiedEmailGuard)
  @Get('history')
  @HttpCode(HttpStatus.OK)
  getHistory(@CurrentUser() user: AuthenticatedUser) {
    return this.paymentService
      .getPaymentHistory(user.userId)
      .then((data) => ({ success: true, data }));
  }

  @UseGuards(VerifiedEmailGuard)
  @Post('initialize')
  @HttpCode(HttpStatus.OK)
  initializePayment(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: InitializePaymentDto,
  ) {
    return this.paymentService
      .initializePayment(
        user.userId,
        user.email,
        user.firstName ?? null,
        user.lastName ?? null,
        dto.plan,
        dto.provider,
      )
      .then((data) => ({ success: true, data }));
  }

  @UseGuards(VerifiedEmailGuard)
  @Get('verify')
  @HttpCode(HttpStatus.OK)
  verifyPayment(
    @CurrentUser() user: AuthenticatedUser,
    @Query('txRef') txRef: string,
  ) {
    return this.paymentService.verifyPayment(user.userId, txRef);
  }
}
