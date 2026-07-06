import { Module } from '@nestjs/common';
import { UsersService } from './services/users.service';
import { UsersController } from './controllers/users.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { EmailsModule } from '../emails/emails.module';
import { SessionsModule } from '../sessions/sessions.module';
import { PaymentModule } from '../payments/payment.module';

@Module({
  imports: [PrismaModule, EmailsModule, SessionsModule, PaymentModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
