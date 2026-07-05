import { Module } from '@nestjs/common';
import { WidgetsService } from './widgets.service';

@Module({
  providers: [WidgetsService],
  exports: [WidgetsService],
})
export class WidgetsModule {}
