'use client';

import * as React from "react";
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
import { Users, Search, ChevronLeft, ChevronRight, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";

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

function getStatusBadgeVariant(status: string): "success" | "default" | "outline" | "accent" | "danger" | "warning" | "info" {
  switch (status) {
    case 'ACCESSED':
      return 'success';
    case 'INVITED':
      return 'info';
    case 'WAITING':
      return 'outline';
    default:
      return 'outline';
  }
}

export function ParticipantTable({ 
  waitlistId, 
  initialParticipants, 
  initialPagination,
  onLoadPage 
}: ParticipantTableProps) {
  const [participants, setParticipants] = React.useState<DashboardParticipant[]>(initialParticipants);
  const [pagination, setPagination] = React.useState<PaginationMetadata | undefined>(initialPagination);
  const [loading, setLoading] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [sortBy, setSortBy] = React.useState<'position' | 'referralCount' | 'createdAt'>('position');
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('asc');
  const [status, setStatus] = React.useState<'WAITING' | 'INVITED' | 'ACCESSED' | undefined>(undefined);
  const [pageSize, setPageSize] = React.useState(20);
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

  return (
    <div className="space-y-4">
      {/* Controls - Always visible */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 w-full sm:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by email..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          {/* Status Filter */}
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

          {/* Page Size Selector */}
          <select
            value={pageSize}
            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
            className="px-3 py-1.5 text-sm border rounded-md bg-background"
          >
            <option value={20}>20 per page</option>
            <option value={50}>50 per page</option>
            <option value={100}>100 per page</option>
          </select>
        </div>
      </div>

      {/* Empty state when no participants */}
      {participants.length === 0 && !search && !status && (
        <EmptyState
          icon={<Users className="h-6 w-6" />}
          title="No participants yet"
          description="Share your waitlist link to start collecting signups."
        />
      )}

      {/* Empty state when search/filter returns no results */}
      {participants.length === 0 && (search || status) && (
        <EmptyState
          icon={<Users className="h-6 w-6" />}
          title="No participants found"
          description="Try adjusting your search or filter criteria."
        />
      )}

      {/* Table - Only show when there are participants */}
      {participants.length > 0 && (
        <>
          <div className="border rounded-lg overflow-hidden">
            <Table id="participant-table">
              <TableHead>
                <TableRow>
                  <TableHeadCell 
                    className="cursor-pointer hover:bg-muted"
                    onClick={() => handleSort('position')}
                  >
                    <div className="flex items-center gap-1">
                      Position
                      {sortBy === 'position' ? (
                        sortOrder === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                      ) : (
                        <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                      )}
                    </div>
                  </TableHeadCell>
                  <TableHeadCell>Email</TableHeadCell>
                  <TableHeadCell 
                    className="cursor-pointer hover:bg-muted"
                    onClick={() => handleSort('referralCount')}
                  >
                    <div className="flex items-center gap-1">
                      Referrals
                      {sortBy === 'referralCount' ? (
                        sortOrder === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                      ) : (
                        <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                      )}
                    </div>
                  </TableHeadCell>
                  <TableHeadCell>Status</TableHeadCell>
                  <TableHeadCell 
                    className="cursor-pointer hover:bg-muted"
                    onClick={() => handleSort('createdAt')}
                  >
                    <div className="flex items-center gap-1">
                      Joined
                      {sortBy === 'createdAt' ? (
                        sortOrder === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                      ) : (
                        <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                      )}
                    </div>
                  </TableHeadCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <div className="text-muted-foreground">Loading...</div>
                    </TableCell>
                  </TableRow>
                ) : (
                  participants.map((p) => (
                    <TableRow key={p.email} id={`participant-row-${p.position}`}>
                      <TableCell className="text-muted-foreground">#{p.position}</TableCell>
                      <TableCell className="font-medium text-foreground">{p.email}</TableCell>
                      <TableCell>
                        {p.referralCount > 0 ? (
                          <Badge variant="default">{p.referralCount}</Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(p.status)}>
                          {p.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(p.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Controls - Always show when there are participants */}
          {pagination && pagination.totalItems > 0 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {pagination.totalItems > 0 ? (
                  <>
                    Showing {((pagination.currentPage - 1) * pagination.pageSize) + 1}-
                    {Math.min(pagination.currentPage * pagination.pageSize, pagination.totalItems)} of{' '}
                    {pagination.totalItems} participants
                  </>
                ) : (
                  'No participants'
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviousPage}
                  disabled={!pagination.hasPrevious || loading}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>

                <div className="flex items-center gap-1">
                  <span className="text-sm text-muted-foreground">
                    Page {pagination.currentPage} of {pagination.totalPages}
                  </span>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={!pagination.hasNext || loading}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
