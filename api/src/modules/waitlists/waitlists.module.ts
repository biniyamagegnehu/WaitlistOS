import { Module } from '@nestjs/common';
import { WaitlistsService } from './waitlists.service';
import { WaitlistsController } from './waitlists.controller';
import { SlugService } from './services/slug.service';
import { FilesModule } from '../files/files.module';
import { BrandingModule } from '../branding/branding.module';
import { WidgetsModule } from '../widgets/widgets.module';

@Module({
  imports: [FilesModule, BrandingModule, WidgetsModule],
  controllers: [WaitlistsController],
  providers: [WaitlistsService, SlugService],
  exports: [WaitlistsService],
})
export class WaitlistsModule {}
