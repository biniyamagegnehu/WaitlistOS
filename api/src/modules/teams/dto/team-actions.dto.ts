import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class InviteMemberDto {
  @IsEmail()
  email: string;
}

export class JoinTeamDto {
  @IsString()
  @IsNotEmpty()
  inviteCode: string;
}

export class TransferOwnershipDto {
  @IsString()
  @IsNotEmpty()
  newOwnerId: string;
}
