"use client";

import { AffiliateConversion, AffiliateCommission } from "@/services/affiliates";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHeadCell, TableHead, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit'
  }).format(new Date(dateStr));
}

export function AffiliatePerformanceTab({
  conversions,
  commissions,
  formatCurrency
}: {
  conversions: AffiliateConversion[];
  commissions: AffiliateCommission[];
  formatCurrency: (amount: number, currency?: string) => string;
}) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline" className="text-amber-500 border-amber-200 bg-amber-50">Pending</Badge>;
      case 'ELIGIBLE':
        return <Badge variant="outline" className="text-blue-500 border-blue-200 bg-blue-50">Eligible</Badge>;
      case 'PAID':
        return <Badge variant="outline" className="text-emerald-500 border-emerald-200 bg-emerald-50">Paid</Badge>;
      case 'REVERSED':
        return <Badge variant="outline" className="text-red-500 border-red-200 bg-red-50">Reversed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Recent Commissions</CardTitle>
          <CardDescription>
            Your earned commissions from referred founder subscriptions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeadCell>Date</TableHeadCell>
                  <TableHeadCell>Amount</TableHeadCell>
                  <TableHeadCell>Status</TableHeadCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {commissions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                      No commissions earned yet. Share your links to get started!
                    </TableCell>
                  </TableRow>
                ) : (
                  commissions.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>{formatDate(c.createdAt)}</TableCell>
                      <TableCell className="font-medium text-emerald-600 dark:text-emerald-500">
                        {formatCurrency(c.amount, c.currency)}
                      </TableCell>
                      <TableCell>{getStatusBadge(c.status)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Conversions</CardTitle>
          <CardDescription>
            Founders who signed up using your link and upgraded to a paid plan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeadCell>Date</TableHeadCell>
                  <TableHeadCell>Status</TableHeadCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {conversions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center py-8 text-muted-foreground">
                      No conversions yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  conversions.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>{formatDate(c.convertedAt)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-emerald-500 border-emerald-200 bg-emerald-50">
                          Converted
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

