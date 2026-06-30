import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { WaitlistsModule } from './modules/waitlists/waitlists.module';
import { ParticipantsModule } from './modules/participants/participants.module';

@Module({
  imports: [PrismaModule, WaitlistsModule, ParticipantsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
