"use client";

import * as React from "react";
import { Users, Trophy, TrendingUp, Plus, LogIn, Copy, Check, UserMinus, AlertCircle, CheckCircle, Target } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  getMyTeam,
  createTeam,
  joinTeam,
  leaveTeam,
  getMyInvitations,
  respondToInvitation,
} from "@/services/teams";
import type { TeamDetail, TeamInvitation } from "@/services/teams";
import { getApiErrorMessage } from "@/lib/errors";
import toast from "react-hot-toast";

interface TeamSectionProps {
  participantId: string;
  waitlistId: string;
  primaryColor?: string;
}

export function TeamSection({ participantId, waitlistId, primaryColor }: TeamSectionProps) {
  const [team, setTeam] = React.useState<TeamDetail | null>(null);
  const [invitations, setInvitations] = React.useState<TeamInvitation[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [view, setView] = React.useState<"idle" | "create" | "join">("idle");
  const [teamName, setTeamName] = React.useState("");
  const [teamDescription, setTeamDescription] = React.useState("");
  const [inviteCode, setInviteCode] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [codeCopied, setCodeCopied] = React.useState(false);

  const load = React.useCallback(async () => {
    try {
      const [teamRes, invRes] = await Promise.all([
        getMyTeam(participantId),
        getMyInvitations(participantId),
      ]);
      setTeam(teamRes.data);
      setInvitations(invRes.data);
    } catch {
      // silently ignore
    } finally {
      setLoading(false);
    }
  }, [participantId]);

  React.useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (!teamName.trim()) return;
    setIsSubmitting(true);
    try {
      await createTeam({ name: teamName.trim(), description: teamDescription.trim() || undefined, participantId });
      toast.success("Team created!");
      setView("idle");
      setTeamName("");
      setTeamDescription("");
      await load();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to create team"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoin = async () => {
    if (!inviteCode.trim()) return;
    setIsSubmitting(true);
    try {
      await joinTeam(participantId, inviteCode.trim().toUpperCase());
      toast.success("Joined team!");
      setView("idle");
      setInviteCode("");
      await load();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to join team"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLeave = async () => {
    setIsSubmitting(true);
    try {
      await leaveTeam(participantId);
      toast.success("Left team");
      setTeam(null);
      await load();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to leave team"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInvitationResponse = async (inv: TeamInvitation, action: "accept" | "decline") => {
    try {
      await respondToInvitation(inv.id, participantId, action);
      toast.success(action === "accept" ? "Joined team!" : "Invitation declined");
      await load();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to respond"));
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-primary" />
            <span className="font-semibold text-foreground">Team</span>
          </div>
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-muted rounded w-2/3" />
            <div className="h-4 bg-muted rounded w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3 text-left">
      {/* Pending invitations */}
      {invitations.length > 0 && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-5 space-y-3">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Team Invitations
            </p>
            {invitations.map((inv) => (
              <div key={inv.id} className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-foreground text-sm">{inv.teamName}</p>
                  <p className="text-xs text-muted-foreground">{inv.memberCount} member{inv.memberCount !== 1 ? "s" : ""}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" onClick={() => handleInvitationResponse(inv, "accept")} style={{ backgroundColor: primaryColor }}>
                    <CheckCircle className="h-3.5 w-3.5 mr-1" /> Accept
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleInvitationResponse(inv, "decline")}>
                    Decline
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* No team: show create/join options */}
      {!team && view === "idle" && (
        <Card>
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <span className="font-semibold text-foreground">Team</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Join or create a team to combine referrals and unlock shared milestone rewards together.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="secondary" onClick={() => setView("create")} leftIcon={<Plus className="h-4 w-4" />}>
                Create Team
              </Button>
              <Button variant="secondary" onClick={() => setView("join")} leftIcon={<LogIn className="h-4 w-4" />}>
                Join Team
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create team form */}
      {!team && view === "create" && (
        <Card>
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plus className="h-4 w-4 text-primary" />
                <span className="font-semibold text-foreground">Create a Team</span>
              </div>
              <button onClick={() => setView("idle")} className="text-xs text-muted-foreground hover:text-foreground">Cancel</button>
            </div>
            <div className="space-y-3">
              <Input
                placeholder="Team name (e.g. Startup Legends)"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                maxLength={80}
              />
              <Input
                placeholder="Short description (optional)"
                value={teamDescription}
                onChange={(e) => setTeamDescription(e.target.value)}
                maxLength={300}
              />
              <Button
                className="w-full"
                onClick={handleCreate}
                disabled={isSubmitting || !teamName.trim()}
                style={{ backgroundColor: primaryColor }}
              >
                {isSubmitting ? "Creating…" : "Create Team"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Join team form */}
      {!team && view === "join" && (
        <Card>
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LogIn className="h-4 w-4 text-primary" />
                <span className="font-semibold text-foreground">Join a Team</span>
              </div>
              <button onClick={() => setView("idle")} className="text-xs text-muted-foreground hover:text-foreground">Cancel</button>
            </div>
            <div className="space-y-3">
              <Input
                placeholder="Enter invite code (e.g. ABC12345)"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                maxLength={12}
              />
              <Button
                className="w-full"
                onClick={handleJoin}
                disabled={isSubmitting || !inviteCode.trim()}
                style={{ backgroundColor: primaryColor }}
              >
                {isSubmitting ? "Joining…" : "Join Team"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Team details */}
      {team && (
        <Card>
          <CardContent className="p-5 space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">🚀</span>
                  <h3 className="font-bold text-foreground text-lg">{team.name}</h3>
                </div>
                {team.description && (
                  <p className="text-sm text-muted-foreground mt-0.5">{team.description}</p>
                )}
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg bg-muted/40 p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">Members</p>
                <p className="text-xl font-bold text-foreground">{team.memberCount}</p>
              </div>
              <div className="rounded-lg bg-muted/40 p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">Total Referrals</p>
                <p className="text-xl font-bold text-foreground">{team.teamScore}</p>
              </div>
              <div className="rounded-lg bg-primary/10 p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">Team Rank</p>
                <p className="text-xl font-bold text-primary">—</p>
              </div>
            </div>

            {/* Next milestone */}
            {team.nextMilestone && (
              <div className="rounded-lg border border-border bg-surface p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  <p className="text-sm font-medium text-foreground">Next Milestone</p>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{team.nextMilestone.milestone} referrals</span>
                  <Badge variant="info">+{team.nextMilestone.value} Ranking Bonus</Badge>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Progress</span>
                    <span>{team.teamScore} / {team.nextMilestone.milestone}</span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${team.nextMilestone.percent ?? 0}%`,
                        backgroundColor: primaryColor ?? "var(--primary)",
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Invite code */}
            <div className="rounded-lg border border-dashed border-border p-3 space-y-1.5">
              <p className="text-xs text-muted-foreground">Invite Code — share with teammates</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-sm font-mono font-semibold text-foreground tracking-widest bg-muted rounded px-2 py-1">
                  {team.inviteCode}
                </code>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyCode(team.inviteCode)}
                  className="shrink-0"
                >
                  {codeCopied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Members list */}
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Members</p>
              {team.members.map((member) => (
                <div key={member.id} className="flex items-center justify-between text-sm py-1">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-primary/15 flex items-center justify-center">
                      <span className="text-xs font-bold text-primary">
                        {member.email[0].toUpperCase()}
                      </span>
                    </div>
                    <span className="text-foreground truncate max-w-[180px]">{member.email}</span>
                    {member.isOwner && (
                      <Badge variant="outline" className="text-[10px] py-0">Owner</Badge>
                    )}
                  </div>
                  <span className="text-muted-foreground shrink-0">{member.referralCount} refs</span>
                </div>
              ))}
            </div>

            {/* Unlocked milestones */}
            {team.unlockedMilestones.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Unlocked Rewards</p>
                {team.unlockedMilestones.map((r) => (
                  <div key={r.id} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-success shrink-0" />
                    <span className="text-foreground">{r.milestone} referrals → +{r.value} Ranking Bonus</span>
                  </div>
                ))}
              </div>
            )}

            {/* Leave team */}
            {team.ownerId !== participantId && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLeave}
                disabled={isSubmitting}
                className="text-destructive hover:text-destructive hover:bg-destructive/10 w-full"
              >
                <UserMinus className="h-4 w-4 mr-2" />
                Leave Team
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
