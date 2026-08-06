import { api } from "@/lib/axios";

// ── Types ──────────────────────────────────────────────────────────

export interface TeamMember {
  id: string;
  email: string;
  referralCount: number;
  position: number;
  isOwner: boolean;
}

export interface TeamMilestoneInfo {
  id: string;
  milestone: number;
  type: string;
  value: number | null;
  title: string | null;
  progress?: number;
  percent?: number;
}

export interface TeamDetail {
  id: string;
  name: string;
  description: string | null;
  inviteCode: string;
  waitlistId: string;
  ownerId: string;
  createdAt: string;
  teamScore: number;
  memberCount: number;
  members: TeamMember[];
  unlockedMilestones: Array<{ id: string; milestone: number; type: string; value: number | null; title: string | null; unlockedAt: string }>;
  nextMilestone: TeamMilestoneInfo | null;
}

export interface TeamLeaderboardEntry {
  id: string;
  rank: number;
  name: string;
  memberCount: number;
  totalReferrals: number;
}

export interface TeamMilestoneDto {
  id: string;
  milestone: number;
  type: string;
  value: number | null;
  title: string | null;
  _count?: { teamMilestoneRewards: number };
}

export interface TeamAnalytics {
  totalTeams: number;
  avgTeamSize: number;
  activeTeams: number;
  totalTeamReferrals: number;
  totalRewardsGranted: number;
  largestTeam: { id: string; name: string; memberCount: number } | null;
  topPerformingTeam: { id: string; name: string; totalReferrals: number } | null;
  mostActiveTeam: { id: string; name: string; totalReferrals: number } | null;
}

export interface TeamInvitation {
  id: string;
  teamId: string;
  teamName: string;
  teamDescription: string | null;
  memberCount: number;
  createdAt: string;
}

export interface CreateTeamInput {
  name: string;
  description?: string;
  participantId: string;
}

export interface CreateTeamMilestoneInput {
  milestone: number;
  type: "POSITION_BOOST";
  value?: number;
  title?: string;
}

// ── API Calls ──────────────────────────────────────────────────────

export async function createTeam(data: CreateTeamInput): Promise<{ data: { id: string } }> {
  const res = await api.post<{ success: boolean; data: { id: string } }>("/teams", data);
  return res.data;
}

export async function getMyTeam(participantId: string): Promise<{ data: TeamDetail | null }> {
  const res = await api.get<{ success: boolean; data: TeamDetail | null }>(`/teams/my/${participantId}`);
  return res.data;
}

export async function joinTeam(participantId: string, inviteCode: string): Promise<void> {
  await api.post("/teams/join", { participantId, inviteCode });
}

export async function leaveTeam(participantId: string): Promise<void> {
  await api.post("/teams/leave", { participantId });
}

export async function getMyInvitations(participantId: string): Promise<{ data: TeamInvitation[] }> {
  const res = await api.get<{ success: boolean; data: TeamInvitation[] }>(`/teams/invitations/${participantId}`);
  return res.data;
}

export async function respondToInvitation(invitationId: string, participantId: string, action: "accept" | "decline"): Promise<void> {
  await api.patch(`/teams/invitations/${invitationId}/${action}`, { participantId });
}

export async function inviteMember(teamId: string, ownerId: string, email: string): Promise<void> {
  await api.post(`/teams/${teamId}/invite`, { ownerId, email });
}

export async function removeMember(teamId: string, ownerId: string, memberId: string): Promise<void> {
  await api.delete(`/teams/${teamId}/members/${memberId}`, { data: { ownerId } });
}

export async function transferOwnership(teamId: string, ownerId: string, newOwnerId: string): Promise<void> {
  await api.patch(`/teams/${teamId}/transfer`, { ownerId, newOwnerId });
}

export async function deleteTeam(teamId: string, ownerId: string): Promise<void> {
  await api.delete(`/teams/${teamId}`, { data: { ownerId } });
}

export async function getTeamLeaderboard(waitlistId: string): Promise<{ data: TeamLeaderboardEntry[] }> {
  const res = await api.get<{ success: boolean; data: TeamLeaderboardEntry[] }>(`/teams/leaderboard/${waitlistId}`);
  return res.data;
}

// ── Milestone CRUD ─────────────────────────────────────────────────

export async function getTeamMilestones(waitlistId: string): Promise<{ data: TeamMilestoneDto[] }> {
  const res = await api.get<{ success: boolean; data: TeamMilestoneDto[] }>(`/teams/milestones/${waitlistId}`);
  return res.data;
}

export async function createTeamMilestone(waitlistId: string, data: CreateTeamMilestoneInput): Promise<void> {
  await api.post(`/teams/milestones/${waitlistId}`, data);
}

export async function updateTeamMilestone(waitlistId: string, id: string, data: Partial<CreateTeamMilestoneInput>): Promise<void> {
  await api.patch(`/teams/milestones/${waitlistId}/${id}`, data);
}

export async function deleteTeamMilestone(waitlistId: string, id: string): Promise<void> {
  await api.delete(`/teams/milestones/${waitlistId}/${id}`);
}

// ── Analytics ─────────────────────────────────────────────────────

export async function getTeamAnalytics(waitlistId: string): Promise<{ data: TeamAnalytics }> {
  const res = await api.get<{ success: boolean; data: TeamAnalytics }>(`/teams/analytics/${waitlistId}`);
  return res.data;
}
