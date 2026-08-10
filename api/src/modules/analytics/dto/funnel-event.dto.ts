import { IsEnum, IsNotEmpty, IsUUID, IsString, MaxLength } from 'class-validator';
import { FunnelEventType } from '@prisma/client';

export class CreateFunnelEventDto {
  @IsUUID()
  @IsNotEmpty()
  waitlistId!: string;

  @IsUUID()
  @IsNotEmpty()
  sessionId!: string;

  @IsEnum(FunnelEventType)
  @IsNotEmpty()
  eventType!: FunnelEventType;
}
