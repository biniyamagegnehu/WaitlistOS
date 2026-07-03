import { Global, Module } from '@nestjs/common';
import { RolesGuard } from './guards/roles.guard';

/**
 * CommonModule
 * Provides shared infrastructure: guards, filters, decorators.
 * Marked @Global so it doesn't need to be re-imported everywhere.
 */
@Global()
@Module({
  providers: [RolesGuard],
  exports: [RolesGuard],
})
export class CommonModule {}
