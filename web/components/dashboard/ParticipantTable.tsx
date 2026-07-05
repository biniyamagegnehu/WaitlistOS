import type { DashboardParticipant } from "../../types/dashboard";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Users } from "lucide-react";

interface ParticipantTableProps {
  participants: DashboardParticipant[];
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function ParticipantTable({ participants }: ParticipantTableProps) {
  if (participants.length === 0) {
    return (
      <EmptyState
        icon={<Users className="h-6 w-6" />}
        title="No participants yet"
        description="Share your waitlist link to start collecting signups."
      />
    );
  }

  return (
    <Table id="participant-table">
      <TableHead>
        <TableRow>
          <TableHeadCell>#</TableHeadCell>
          <TableHeadCell>Email</TableHeadCell>
          <TableHeadCell>Position</TableHeadCell>
          <TableHeadCell>Referrals</TableHeadCell>
          <TableHeadCell>Joined</TableHeadCell>
        </TableRow>
      </TableHead>
        <TableBody>
          {participants.map((p, i) => (
            <TableRow key={p.email} id={`participant-row-${i + 1}`}>
              <TableCell className="text-muted-foreground">{i + 1}</TableCell>
              <TableCell className="font-medium text-foreground">{p.email}</TableCell>
              <TableCell>
                <Badge variant="success">#{p.position}</Badge>
              </TableCell>
              <TableCell>
                {p.referralCount > 0 ? (
                  <Badge variant="default">{p.referralCount}</Badge>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatDate(p.createdAt)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
    </Table>
  );
}
