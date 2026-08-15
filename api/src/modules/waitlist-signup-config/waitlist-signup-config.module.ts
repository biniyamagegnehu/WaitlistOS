import { Module } from '@nestjs/common';
import { WaitlistSignupConfigService } from './waitlist-signup-config.service';
import { WaitlistSignupConfigController } from './waitlist-signup-config.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { WaitlistsModule } from '../waitlists/waitlists.module';

@Module({
  imports: [PrismaModule, WaitlistsModule],
  controllers: [WaitlistSignupConfigController],
  providers: [WaitlistSignupConfigService],
  exports: [WaitlistSignupConfigService],
})
export class WaitlistSignupConfigModule {}
