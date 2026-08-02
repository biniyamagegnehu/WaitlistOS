import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { CopywriterService } from './copywriter.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { WaitlistsModule } from '../waitlists/waitlists.module';

@Module({
  imports: [PrismaModule, WaitlistsModule],
  controllers: [AiController],
  providers: [AiService, CopywriterService],
  exports: [AiService],
})
export class AiModule {}
