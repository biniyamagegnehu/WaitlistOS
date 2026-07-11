import { Module } from '@nestjs/common';
import { CohortsService } from './cohorts.service';
import { CohortsController } from './cohorts.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { EmailsModule } from '../emails/emails.module';

@Module({
  imports: [PrismaModule, EmailsModule],
  controllers: [CohortsController],
  providers: [CohortsService],
  exports: [CohortsService],
})
export class CohortsModule {}
