'use client';

import * as React from "react";
import { useRouter } from "next/navigation";
import type { DashboardParticipant, PaginationMetadata } from "@/types/dashboard";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/patterns/loading-state";
import { DataToolbar, DataToolbarSection } from "@/components/patterns/data-toolbar";
import { DataTable, type Column } from "@/components/patterns/data-table";
import { Pagination, type PaginationMetadata as PatternPaginationMetadata } from "@/components/patterns/pagination";
import { StatusIndicator } from "@/components/patterns/status-indicator";
import { Users, Search, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";

interface ParticipantTableProps {
  waitlistId: string;
  initialParticipants: DashboardParticipant[];
  initialPagination?: PaginationMetadata;
  onLoadPage: (options: {
    page: number;
    pageSize: number;
    search?: string;
    sortBy?: 'position' | 'referralCount' | 'createdAt';
    sortOrder?: 'asc' | 'desc';
    status?: 'WAITING' | 'INVITED' | 'ACCESSED';
  }) => Promise<{ participants: DashboardParticipant[]; pagination?: PaginationMetadata }>;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function mapStatusToIndicator(status: string): "waiting" | "invited" | "accessed" | "active" | "inactive" | "pending" | "completed" | "failed" | "draft" | "published" | "connected" | "disconnected" {
  switch (status) {
    case 'ACCESSED':
      return 'accessed';
    case 'INVITED':
      return 'invited';
    case 'WAITING':
      return 'waiting';
    default:
      return 'waiting';
  }
}

export function ParticipantTable({ 
  waitlistId, 
  initialParticipants, 
  initialPagination,
  onLoadPage 
}: ParticipantTableProps) {
  const router = useRouter();
  const [participants, setParticipants] = React.useState<DashboardParticipant[]>(initialParticipants);
  const [pagination, setPagination] = React.useState<PaginationMetadata | undefined>(initialPagination);
  const [loading, setLoading] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [sortBy, setSortBy] = React.useState<'position' | 'referralCount' | 'createdAt'>('position');
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('asc');
  const [status, setStatus] = React.useState<'WAITING' | 'INVITED' | 'ACCESSED' | undefined>(undefined);
  const [pageSize, setPageSize] = React.useState(10);
  const [currentPage, setCurrentPage] = React.useState(1);

  const loadPage = React.useCallback(async (page: number) => {
    setLoading(true);
    try {
      const result = await onLoadPage({
        page,
        pageSize,
        search: search || undefined,
        sortBy,
        sortOrder,
        status: status || undefined,
      });
      setParticipants(result.participants);
      setPagination(result.pagination);
      setCurrentPage(page);
    } catch (error) {
      console.error('Failed to load participants:', error);
    } finally {
      setLoading(false);
    }
  }, [pageSize, search, sortBy, sortOrder, status, onLoadPage]);

  // Trigger loadPage when search, status, pageSize, or sort changes
  React.useEffect(() => {
    loadPage(1);
  }, [search, status, pageSize, sortBy, sortOrder]);

  const handleSearch = React.useCallback((value: string) => {
    setSearch(value);
  }, []);

  const handleSort = React.useCallback((field: 'position' | 'referralCount' | 'createdAt') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  }, [sortBy, sortOrder]);

  const handleStatusFilter = React.useCallback((newStatus: 'WAITING' | 'INVITED' | 'ACCESSED' | undefined) => {
    setStatus(newStatus);
  }, []);

  const handlePageSizeChange = React.useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
  }, []);

  const handlePreviousPage = React.useCallback(() => {
    if (pagination && pagination.hasPrevious) {
      loadPage(pagination.currentPage - 1);
    }
  }, [pagination, loadPage]);

  const handleNextPage = React.useCallback(() => {
    if (pagination && pagination.hasNext) {
      loadPage(pagination.currentPage + 1);
    }
  }, [pagination, loadPage]);

  const handleRowClick = React.useCallback((participant: DashboardParticipant) => {
    router.push(`/dashboard/waitlists/${waitlistId}/participants/${participant.id || participant.email}`);
  }, [router, waitlistId]);

  // Convert pagination to pattern metadata
  const patternPagination: PatternPaginationMetadata | undefined = pagination ? {
    currentPage: pagination.currentPage,
    totalPages: pagination.totalPages,
    totalItems: pagination.totalItems,
    pageSize: pagination.pageSize,
    hasPrevious: pagination.hasPrevious,
    hasNext: pagination.hasNext,
  } : undefined;

  // Define columns for DataTable
  const columns: Column<DashboardParticipant>[] = [
    {
      key: 'position',
      header: 'Position',
      sortable: true,
      render: (row) => <span className="text-text-muted">#{row.position}</span>,
    },
    {
      key: 'email',
      header: 'Email',
      render: (row) => <span className="font-medium text-text-primary">{row.email}</span>,
    },
    {
      key: 'referralCount',
      header: 'Referrals',
      render: (row) => row.referralCount > 0 ? (
        <Badge variant="default">{row.referralCount}</Badge>
      ) : (
        <span className="text-text-muted">—</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusIndicator status={mapStatusToIndicator(row.status)} label={row.status} />,
    },
    {
      key: 'createdAt',
      header: 'Joined',
      render: (row) => <span className="text-text-muted">{formatDate(row.createdAt)}</span>,
    },
    {
      key: 'engagement',
      header: 'Risk',
      render: (row) => row.engagement ? (
        <div className="flex flex-col items-start gap-1">
          <Badge variant={
            row.engagement.riskLevel === 'HIGH_RISK' ? 'danger' : 
            row.engagement.riskLevel === 'MEDIUM_RISK' ? 'warning' : 
            'success'
          }>
            {row.engagement.riskLevel.replace('_', ' ')}
          </Badge>
          <span className="text-xs text-text-muted whitespace-nowrap">
            Score: {row.engagement.riskScore}
          </span>
        </div>
      ) : (
        <span className="text-text-muted text-xs whitespace-nowrap">Not evaluated</span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* DataToolbar for search and filters */}
      <DataToolbar>
        <DataToolbarSection>
          <Input
            placeholder="Search by email..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
          />
        </DataToolbarSection>
        <DataToolbarSection align="end">
          <div className="flex gap-1">
            <Button
              variant={status === undefined ? "primary" : "outline"}
              size="sm"
              onClick={() => handleStatusFilter(undefined)}
            >
              All
            </Button>
            <Button
              variant={status === 'WAITING' ? "primary" : "outline"}
              size="sm"
              onClick={() => handleStatusFilter('WAITING')}
            >
              Waiting
            </Button>
            <Button
              variant={status === 'INVITED' ? "primary" : "outline"}
              size="sm"
              onClick={() => handleStatusFilter('INVITED')}
            >
              Invited
            </Button>
            <Button
              variant={status === 'ACCESSED' ? "primary" : "outline"}
              size="sm"
              onClick={() => handleStatusFilter('ACCESSED')}
            >
              Accessed
            </Button>
          </div>
        </DataToolbarSection>
      </DataToolbar>

      {/* DataTable with custom columns */}
      <DataTable
        data={participants}
        columns={columns}
        loading={loading}
        empty={
          participants.length === 0 && !search && !status
            ? {
                title: "No participants yet",
                description: "Share your waitlist link to start collecting signups.",
              }
            : participants.length === 0 && (search || status)
            ? {
                title: "No participants found",
                description: "Try adjusting your search or filter criteria.",
              }
            : undefined
        }
        pagination={patternPagination}
        onPageChange={loadPage}
        onPageSizeChange={handlePageSizeChange}
        onRowClick={handleRowClick}
        rowKey={(row) => row.email}
      />
    </div>
  );
}
