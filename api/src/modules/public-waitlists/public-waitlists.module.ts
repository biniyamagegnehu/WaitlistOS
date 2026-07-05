import { Module } from '@nestjs/common';
import { PublicWaitlistsController } from './public-waitlists.controller';
import { PublicWaitlistsService } from './public-waitlists.service';
import { BrandingModule } from '../branding/branding.module';
import { WidgetsModule } from '../widgets/widgets.module';

@Module({
  imports: [BrandingModule, WidgetsModule],
  controllers: [PublicWaitlistsController],
  providers: [PublicWaitlistsService],
})
export class PublicWaitlistsModule {}
