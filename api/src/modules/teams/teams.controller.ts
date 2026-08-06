import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  Patch,
} from '@nestjs/common';
import { TeamsService } from './teams.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { InviteMemberDto, JoinTeamDto, TransferOwnershipDto } from './dto/team-actions.dto';
import { CreateTeamMilestoneDto, UpdateTeamMilestoneDto } from './dto/team-milestone.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import { Public } from '../../common/decorators/public.decorator';

// All team routes are participant-facing, keyed by participantId via a query-param or body
// Using /teams prefix

@Controller('teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  // ── Participant creates a team (participantId in body) ────
  @Post()
  @HttpCode(HttpStatus.CREATED)
  createTeam(
    @Body() body: CreateTeamDto & { participantId: string },
  ) {
    return this.teamsService.createTeam(body.participantId, body);
  }

  // ── Participant gets their own team ───────────────────────
  @Get('my/:participantId')
  @HttpCode(HttpStatus.OK)
  getMyTeam(@Param('participantId') participantId: string) {
    return this.teamsService.getMyTeam(participantId);
  }

  // ── Get team details (public, for leaderboard embed) ──────
  @Public()
  @Get(':teamId')
  @HttpCode(HttpStatus.OK)
  getTeam(@Param('teamId') teamId: string) {
    return this.teamsService.getTeam(teamId);
  }

  // ── Join by invite code ───────────────────────────────────
  @Post('join')
  @HttpCode(HttpStatus.OK)
  joinTeam(@Body() body: JoinTeamDto & { participantId: string }) {
    return this.teamsService.joinTeam(body.participantId, body.inviteCode);
  }

  // ── Get participant's pending invitations ─────────────────
  @Get('invitations/:participantId')
  @HttpCode(HttpStatus.OK)
  getMyInvitations(@Param('participantId') participantId: string) {
    return this.teamsService.getMyInvitations(participantId);
  }

  // ── Invite a member by email ──────────────────────────────
  @Post(':teamId/invite')
  @HttpCode(HttpStatus.CREATED)
  inviteMember(
    @Param('teamId') teamId: string,
    @Body() body: InviteMemberDto & { ownerId: string },
  ) {
    return this.teamsService.inviteMember(teamId, body.ownerId, body.email);
  }

  // ── Accept/Decline invitation ─────────────────────────────
  @Patch('invitations/:invitationId/:action')
  @HttpCode(HttpStatus.OK)
  respondToInvitation(
    @Param('invitationId') invitationId: string,
    @Param('action') action: 'accept' | 'decline',
    @Body('participantId') participantId: string,
  ) {
    return this.teamsService.respondToInvitation(invitationId, participantId, action);
  }

  // ── Remove member (owner only) ────────────────────────────
  @Delete(':teamId/members/:memberId')
  @HttpCode(HttpStatus.OK)
  removeMember(
    @Param('teamId') teamId: string,
    @Param('memberId') memberId: string,
    @Body('ownerId') ownerId: string,
  ) {
    return this.teamsService.removeMember(teamId, ownerId, memberId);
  }

  // ── Leave team ────────────────────────────────────────────
  @Post('leave')
  @HttpCode(HttpStatus.OK)
  leaveTeam(@Body('participantId') participantId: string) {
    return this.teamsService.leaveTeam(participantId);
  }

  // ── Transfer ownership ────────────────────────────────────
  @Patch(':teamId/transfer')
  @HttpCode(HttpStatus.OK)
  transferOwnership(
    @Param('teamId') teamId: string,
    @Body() body: TransferOwnershipDto & { ownerId: string },
  ) {
    return this.teamsService.transferOwnership(teamId, body.ownerId, body.newOwnerId);
  }

  // ── Delete team ───────────────────────────────────────────
  @Delete(':teamId')
  @HttpCode(HttpStatus.OK)
  deleteTeam(
    @Param('teamId') teamId: string,
    @Body('ownerId') ownerId: string,
  ) {
    return this.teamsService.deleteTeam(teamId, ownerId);
  }

  // ── Team Leaderboard (public) ─────────────────────────────
  @Public()
  @Get('leaderboard/:waitlistId')
  @HttpCode(HttpStatus.OK)
  getTeamLeaderboard(@Param('waitlistId') waitlistId: string) {
    return this.teamsService.getTeamLeaderboard(waitlistId);
  }

  // ── Team Analytics (Founder) ──────────────────────────────
  @Get('analytics/:waitlistId')
  @HttpCode(HttpStatus.OK)
  getTeamAnalytics(
    @Param('waitlistId') waitlistId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.teamsService.getTeamAnalytics(waitlistId, user.userId);
  }

  // ── Team Milestone CRUD (Founder) ─────────────────────────
  @Post('milestones/:waitlistId')
  @HttpCode(HttpStatus.CREATED)
  createMilestone(
    @Param('waitlistId') waitlistId: string,
    @Body() dto: CreateTeamMilestoneDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.teamsService.createTeamMilestone(waitlistId, user.userId, dto);
  }

  @Get('milestones/:waitlistId')
  @HttpCode(HttpStatus.OK)
  findMilestones(
    @Param('waitlistId') waitlistId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.teamsService.findTeamMilestones(waitlistId, user.userId);
  }

  @Patch('milestones/:waitlistId/:id')
  @HttpCode(HttpStatus.OK)
  updateMilestone(
    @Param('waitlistId') waitlistId: string,
    @Param('id') id: string,
    @Body() dto: UpdateTeamMilestoneDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.teamsService.updateTeamMilestone(id, waitlistId, user.userId, dto);
  }

  @Delete('milestones/:waitlistId/:id')
  @HttpCode(HttpStatus.OK)
  deleteMilestone(
    @Param('waitlistId') waitlistId: string,
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.teamsService.deleteTeamMilestone(id, waitlistId, user.userId);
  }
}
