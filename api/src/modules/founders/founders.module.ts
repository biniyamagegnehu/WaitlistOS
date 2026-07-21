import { Module } from '@nestjs/common';
import { FoundersController } from './founders.controller';
import { FoundersService } from './founders.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [FoundersController],
  providers: [FoundersService],
  exports: [FoundersService],
})
export class FoundersModule {}
