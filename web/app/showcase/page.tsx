"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Alert } from "@/components/ui/alert";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Select } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Table, TableHead, TableBody, TableRow, TableHeadCell, TableCell } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { SectionHeader } from "@/components/ui/section-header";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useTheme } from "@/contexts/theme-context";
import {
  PageContainer,
  PageHeader,
  DataToolbar,
  DataToolbarSection,
  DataToolbarSpacer,
  DataTable,
  Pagination,
  MetricCard,
  FormSection,
  FormField,
  LoadingState,
  ErrorState,
  ConfirmationDialog,
  StatusIndicator,
  type PaginationMetadata,
} from "@/components/patterns";
import { CheckCircle, AlertCircle, AlertTriangle, Info, MoreHorizontal, Search, Filter, ChevronDown, User, Settings, LogOut, Bell, Plus, X, ExternalLink, Unplug, Lock, Eye, EyeOff, Download, Trash2, Edit, Copy, Share2, Mail, Phone, Calendar, MapPin, Users, Building2, Shield, Globe, TrendingUp, RefreshCw, Home, Activity, Zap, ArrowRight } from "lucide-react";

export default function ShowcasePage() {
  const { theme } = useTheme();
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const [progress, setProgress] = React.useState(45);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = React.useState(false);
  const [confirmLoading, setConfirmLoading] = React.useState(false);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => (prev >= 100 ? 0 : prev + 5));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-background text-text-primary p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight mb-2">Design System v1</h1>
            <p className="text-text-muted">Foundation components and product patterns</p>
          </div>
          <ThemeToggle />
        </div>

        {/* Theme Info */}
        <Card className="mb-8" variant="muted">
          <CardContent className="py-4">
            <p className="text-sm text-text-muted">
              Current theme: <span className="font-semibold text-text-primary">{theme}</span>
            </p>
          </CardContent>
        </Card>

        {/* Foundation Components */}
        <div className="mb-16">
          <h2 className="text-2xl font-semibold tracking-tight mb-8">Foundation Components</h2>

          {/* Buttons */}
          <SectionHeader title="Buttons" description="All variants and sizes" />
        <Card className="mb-8">
          <CardContent className="p-6 space-y-6">
            <div>
              <h3 className="text-sm font-medium text-text-primary mb-3">Variants</h3>
              <div className="flex flex-wrap gap-3">
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="accent">Accent</Button>
                <Button variant="destructive">Destructive</Button>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-text-primary mb-3">Sizes</h3>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="sm">Small</Button>
                <Button size="md">Medium</Button>
                <Button size="lg">Large</Button>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-text-primary mb-3">States</h3>
              <div className="flex flex-wrap gap-3">
                <Button disabled>Disabled</Button>
                <Button loading>Loading</Button>
                <Button leftIcon={<Plus className="h-4 w-4" />}>With Icon</Button>
                <Button rightIcon={<ChevronDown className="h-4 w-4" />}>With Icon</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Inputs */}
        <SectionHeader title="Inputs" description="All sizes and states" />
        <Card className="mb-8">
          <CardContent className="p-6 space-y-6">
            <div>
              <h3 className="text-sm font-medium text-text-primary mb-3">Sizes</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input label="Small Input" size="sm" placeholder="Small input..." />
                <Input label="Medium Input" size="md" placeholder="Medium input..." />
                <Input label="Large Input" size="lg" placeholder="Large input..." />
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-text-primary mb-3">States</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Normal Input" placeholder="Normal state" />
                <Input label="Error Input" error="This field has an error" placeholder="Error state" />
                <Input label="Disabled Input" disabled placeholder="Disabled state" />
                <Input label="With Helper" helper="This is helper text" placeholder="With helper" />
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-text-primary mb-3">With Icons</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="With Left Icon" leftIcon={<Search className="h-4 w-4" />} placeholder="Search..." />
                <Input label="With Right Icon" rightIcon={<Calendar className="h-4 w-4" />} placeholder="Select date..." />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cards */}
        <SectionHeader title="Cards" description="All variants" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Default Card</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-text-muted">Default card with border</p>
            </CardContent>
          </Card>
          <Card variant="muted">
            <CardHeader>
              <CardTitle>Muted Card</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-text-muted">Muted card with subtle border</p>
            </CardContent>
          </Card>
          <Card variant="elevated">
            <CardHeader>
              <CardTitle>Elevated Card</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-text-muted">Elevated card with shadow</p>
            </CardContent>
          </Card>
        </div>

        {/* Badges */}
        <SectionHeader title="Badges" description="All variants and sizes" />
        <Card className="mb-8">
          <CardContent className="p-6 space-y-6">
            <div>
              <h3 className="text font-medium text-text-primary mb-3">Variants</h3>
              <div className="flex flex-wrap gap-2">
                <Badge>Default</Badge>
                <Badge variant="success">Success</Badge>
                <Badge variant="warning">Warning</Badge>
                <Badge variant="danger">Error</Badge>
                <Badge variant="info">Info</Badge>
                <Badge variant="accent">Accent</Badge>
                <Badge variant="outline">Outline</Badge>
              </div>
            </div>
            <div>
              <h3 className="text font-medium text-text-primary mb-3">Sizes</h3>
              <div className="flex flex-wrap gap-2">
                <Badge size="sm">Small</Badge>
                <Badge size="md">Medium</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alerts */}
        <SectionHeader title="Alerts" description="All variants" />
        <div className="space-y-4 mb-8">
          <Alert variant="success" title="Success message">
            Operation completed successfully.
          </Alert>
          <Alert variant="error" title="Error message">
            Something went wrong. Please try again.
          </Alert>
          <Alert variant="warning" title="Warning message">
            Please review this information carefully.
          </Alert>
          <Alert variant="info" title="Info message">
            Additional information is available.
          </Alert>
        </div>

        {/* Dialog */}
        <SectionHeader title="Dialog" description="Modal dialog component" />
        <Card className="mb-8">
          <CardContent className="p-6">
            <Button onClick={() => setIsDialogOpen(true)}>Open Dialog</Button>
            <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Dialog Title</DialogTitle>
                </DialogHeader>
                <DialogBody>
                  <p className="text-sm text-text-muted">This is a dialog content area. Dialogs are used for focused interactions.</p>
                </DialogBody>
                <DialogFooter>
                  <Button variant="secondary" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                  <Button onClick={() => setIsDialogOpen(false)}>Confirm</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* Tabs */}
        <SectionHeader title="Tabs" description="Tab navigation" />
        <Card className="mb-8">
          <CardContent className="p-6">
            <Tabs defaultValue="tab1">
              <TabsList>
                <TabsTrigger value="tab1">Tab 1</TabsTrigger>
                <TabsTrigger value="tab2">Tab 2</TabsTrigger>
                <TabsTrigger value="tab3">Tab 3</TabsTrigger>
              </TabsList>
              <TabsContent value="tab1">
                <p className="text-sm text-text-muted">Content for Tab 1</p>
              </TabsContent>
              <TabsContent value="tab2">
                <p className="text text-sm text-text-muted">Content for Tab 2</p>
              </TabsContent>
              <TabsContent value="tab3">
                <p className="text-sm text-text-muted">Content for Tab 3</p>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Dropdown */}
        <SectionHeader title="Dropdown Menu" description="Dropdown menu component" />
        <Card className="mb-8">
          <CardContent className="p-6">
            <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
              <DropdownMenuTrigger>
                <Button>Open Dropdown</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardContent>
        </Card>

        {/* Select */}
        <SectionHeader title="Select" description="Native select component" />
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select label="Small Select" size="sm">
                <option>Option 1</option>
                <option>Option 2</option>
                <option>Option 3</option>
              </Select>
              <Select label="Medium Select" size="md">
                <option>Option 1</option>
                <option>Option 2</option>
                <option>Option 3</option>
              </Select>
              <Select label="Large Select" size="lg">
                <option>Option 1</option>
                <option>Option 2</option>
                <option>Option 3</option>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Progress */}
        <SectionHeader title="Progress" description="Progress bar component" />
        <Card className="mb-8">
          <CardContent className="p-6 space-y-6">
            <div>
              <h3 className="text-sm font-medium text-text-primary mb-3">Variants</h3>
              <div className="space-y-4">
                <Progress value={progress} variant="default" />
                <Progress value={progress} variant="success" />
                <Progress value={progress} variant="warning" />
                <Progress value={progress} variant="error" />
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-text-primary mb-3">Sizes</h3>
              <div className="space-y-4">
                <Progress value={45} size="sm" />
                <Progress value={45} size="md" />
                <Progress value={45} size="lg" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <SectionHeader title="Table" description="Data table component" />
        <Card className="mb-8">
          <CardContent className="p-6">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeadCell>Name</TableHeadCell>
                  <TableHeadCell>Email</TableHeadCell>
                  <TableHeadCell>Status</TableHeadCell>
                  <TableHeadCell>Role</TableHeadCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow clickable>
                  <TableCell>John Doe</TableCell>
                  <TableCell>john@example.com</TableCell>
                  <TableCell><Badge variant="success">Active</Badge></TableCell>
                  <TableCell>Admin</TableCell>
                </TableRow>
                <TableRow clickable>
                  <TableCell>Jane Smith</TableCell>
                  <TableCell>jane@example.com</TableCell>
                  <TableCell><Badge variant="warning">Pending</Badge></TableCell>
                  <TableCell>User</TableCell>
                </TableRow>
                <TableRow clickable selected>
                  <TableCell>Bob Johnson</TableCell>
                  <TableCell>bob@example.com</TableCell>
                  <TableCell><Badge variant="danger">Inactive</Badge></TableCell>
                  <TableCell>User</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Empty State */}
        <SectionHeader title="Empty State" description="Empty state component" />
        <Card className="mb-8">
          <CardContent className="p-6">
            <EmptyState
              title="No items found"
              description="There are no items to display at this time."
              action={<Button variant="outline">Create Item</Button>}
            />
          </CardContent>
        </Card>

        {/* Avatar */}
        <SectionHeader title="Avatar" description="Avatar component" />
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-wrap items-center gap-6">
              <Avatar size="xs" fallback="XS" />
              <Avatar size="sm" fallback="SM" />
              <Avatar size="md" fallback="MD" />
              <Avatar size="lg" fallback="LG" />
              <Avatar size="xl" fallback="XL" />
              <Avatar src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="Avatar with image" />
            </div>
          </CardContent>
        </Card>

        {/* Skeleton */}
        <SectionHeader title="Skeleton" description="Loading skeleton component" />
        <Card className="mb-8">
          <CardContent className="p-6 space-y-4">
            <Skeleton variant="text" className="w-full" />
            <Skeleton variant="text" className="w-3/4" />
            <Skeleton variant="text" className="w-1/2" />
            <div className="flex gap-4">
              <Skeleton variant="circular" />
              <Skeleton variant="rectangular" className="flex-1" />
            </div>
          </CardContent>
        </Card>

        {/* Theme Colors Reference */}
        <SectionHeader title="Color Tokens" description="Semantic color tokens for reference" />
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-text-primary">Brand</h4>
                <div className="space-y-1">
                  <div className="h-8 rounded bg-primary border border-border flex items-center justify-center text-xs text-primary-foreground">Primary</div>
                  <div className="h-8 rounded bg-accent border border-border flex items-center justify-center text-xs text-accent-foreground">Accent</div>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-text-primary">Semantic</h4>
                <div className="space-y-1">
                  <div className="h-8 rounded bg-success-muted border border-border flex items-center justify-center text-xs text-success">Success</div>
                  <div className="h-8 rounded bg-warning-muted border border-border flex items-center justify-center text-xs text-warning">Warning</div>
                  <div className="h-8 rounded bg-error-muted border border-border flex items-center justify-center text-xs text-error">Error</div>
                  <div className="h 8 rounded bg-info-muted border border-border flex items-center justify-center text-xs text-info">Info</div>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-text-primary">Backgrounds</h4>
                <div className="space-y-1">
                  <div className="h-8 rounded bg-background border border-border flex items-center justify-center text-xs text-text-primary">Background</div>
                  <div className="h-8 rounded bg-surface border border-border flex items-center justify-center text-xs text-text-primary">Surface</div>
                  <div className="h-8 rounded bg-surface-muted border border-border flex items-center justify-center text-xs text-text-primary">Surface Muted</div>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="text font-medium text-text-primary">Text</h4>
                <div className="space-y-1">
                  <div className="h-8 rounded bg-background border border-border flex items-center justify-center text-xs text-text-primary">Primary</div>
                  <div className="h-8 rounded bg-background border border-border flex items-center justify-center text-xs text-text-secondary">Secondary</div>
                  <div className="h-8 rounded bg-background border border-border flex items-center justify-center text-xs text-text-muted">Muted</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Spacing Reference */}
        <SectionHeader title="Spacing Scale" description="4px-based spacing scale" />
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
              <div className="h-8 rounded bg-surface-muted border border-border flex items-center justify-center text-xs text-text-muted">4px</div>
              <div className="h-8 rounded bg-surface-muted border border-border flex items-center justify-center text-xs text-text-muted">8px</div>
              <div className="h-8 rounded bg-surface-muted border border-border flex items-center justify-center text-xs text-text-muted">12px</div>
              <div className="h-8 rounded bg-surface-muted border border-border flex items-center justify-center text-xs text-text-muted">16px</div>
              <div className="h-8 rounded bg-surface-muted border border-border flex items-center justify-center text-xs text-text-muted">20px</div>
              <div className="h-8 rounded bg-surface-muted border border-border flex items-center justify-center text-xs text-text-muted">24px</div>
              <div className="h-8 rounded bg-surface-muted border border-border flex items-center justify-center text-xs text-text-muted">32px</div>
              <div className="h-8 rounded bg-surface-muted border border-border flex items-center justify-center text-xs text-text-muted">40px</div>
              <div className="h-8 rounded bg-surface-muted border border-border flex items-center justify-center text-xs text-text-muted">48px</div>
              <div className="h-8 rounded bg-surface-muted border border-border flex items-center justify-center text-xs text-text-muted">64px</div>
            </div>
          </CardContent>
        </Card>

        {/* Radius Reference */}
        <SectionHeader title="Radius Scale" description="Controlled radius tokens" />
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-wrap items-end gap-4">
              <div className="space-y-2">
                <div className="h-16 w-16 rounded bg-surface-muted border border-border flex items-center justify-center text-xs text-text-muted">xs<br/>4px</div>
              </div>
              <div className="space-y-2">
                <div className="h-16 w-16 rounded bg-surface-muted border border-border flex items-center justify-center text-xs text-text-muted">sm<br/>6px</div>
              </div>
              <div className="space-y-2">
                <div className="h-16 w-16 rounded bg-surface-muted border border-border flex items-center justify-center text-xs text-text-muted">md<br/>8px</div>
              </div>
              <div className="space-y-2">
                <div className="h-16 w-16 rounded bg-surface-muted border border-border flex items-center justify-center text-xs text-text-muted">lg<br/>12px</div>
              </div>
              <div className="space-y-2">
                <div className="h-16 w-16 rounded bg-surface-muted border border-border flex items-center justify-center text-xs text-text-muted">xl<br/>16px</div>
              </div>
              <div className="space-y-2">
                <div className="h-16 w-16 rounded-full bg-surface-muted border border-border flex items-center justify-center text-xs text-text-muted">full</div>
              </div>
            </div>
          </CardContent>
        </Card>

        </div>

        {/* PRODUCT PATTERNS */}
        <div className="mt-16 pt-16 border-t border-border">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight mb-2">Product Patterns</h1>
              <p className="text-text-muted">Reusable product-level UI patterns</p>
            </div>
          </div>

          {/* PageContainer */}
          <SectionHeader title="PageContainer" description="Consistent page width and padding" />
          <Card className="mb-8">
            <CardContent className="p-6">
              <PageContainer maxWidth="md" className="bg-surface-muted p-4 rounded-lg">
                <p className="text-sm text-text-muted">Content with max-width: md</p>
              </PageContainer>
            </CardContent>
          </Card>

          {/* PageHeader */}
          <SectionHeader title="PageHeader" description="Standardized page headers with breadcrumbs, actions" />
          <Card className="mb-8">
            <CardContent className="p-6">
              <PageHeader
                title="Participants"
                description="Manage your waitlist participants"
                breadcrumbs={[
                  { label: "Dashboard", href: "/dashboard" },
                  { label: "Waitlists", href: "/dashboard/waitlists" },
                  { label: "My Waitlist" },
                ]}
                primaryAction={<Button>Create Waitlist</Button>}
                secondaryActions={<Button variant="outline">Export</Button>}
                leadingIcon={<Users className="h-6 w-6 text-text-muted" />}
              />
            </CardContent>
          </Card>

          {/* DataToolbar */}
          <SectionHeader title="DataToolbar" description="Consistent data control toolbar" />
          <Card className="mb-8">
            <CardContent className="p-6">
              <DataToolbar>
                <DataToolbarSection>
                  <Input placeholder="Search..." leftIcon={<Search className="h-4 w-4" />} />
                </DataToolbarSection>
                <DataToolbarSection align="end">
                  <Button variant="outline" size="sm">Filter</Button>
                  <Button variant="outline" size="sm">Sort</Button>
                  <Button size="sm">Add New</Button>
                </DataToolbarSection>
              </DataToolbar>
            </CardContent>
          </Card>

          {/* DataTable */}
          <SectionHeader title="DataTable" description="Canonical data table pattern" />
          <Card className="mb-8">
            <CardContent className="p-6">
              <DataTable
                data={[
                  { name: "John Doe", email: "john@example.com", status: "active" },
                  { name: "Jane Smith", email: "jane@example.com", status: "pending" },
                  { name: "Bob Johnson", email: "bob@example.com", status: "inactive" },
                ]}
                columns={[
                  { key: "name", header: "Name" },
                  { key: "email", header: "Email" },
                  {
                    key: "status",
                    header: "Status",
                    render: (row: any) => <StatusIndicator status={row.status} />,
                  },
                ]}
                pagination={{
                  currentPage: 1,
                  totalPages: 5,
                  totalItems: 45,
                  pageSize: 10,
                  hasPrevious: false,
                  hasNext: true,
                }}
                onPageChange={(page) => console.log("Page:", page)}
              />
            </CardContent>
          </Card>

          {/* Pagination */}
          <SectionHeader title="Pagination" description="Standalone pagination component" />
          <Card className="mb-8">
            <CardContent className="p-6">
              <Pagination
                metadata={{
                  currentPage: 2,
                  totalPages: 10,
                  totalItems: 95,
                  pageSize: 10,
                  hasPrevious: true,
                  hasNext: true,
                }}
                onPageChange={(page) => console.log("Page:", page)}
                onPageSizeChange={(size) => console.log("Page size:", size)}
              />
            </CardContent>
          </Card>

          {/* MetricCard */}
          <SectionHeader title="MetricCard" description="Key metric display with trends" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <MetricCard
              label="Total Participants"
              value="1,284"
              description="Total signups"
              trend={{ value: 12.4, label: "vs last month" }}
              icon={<Users className="h-4 w-4" />}
              status="success"
            />
            <MetricCard
              label="Conversion Rate"
              value="24.5%"
              description="Signup to access"
              trend={{ value: -2.1, label: "vs last month" }}
              icon={<Activity className="h-4 w-4" />}
              status="warning"
            />
            <MetricCard
              label="Referrals"
              value="342"
              description="Total referrals"
              trend={{ value: 8.7, label: "vs last month" }}
              icon={<Zap className="h-4 w-4" />}
            />
          </div>

          {/* FormSection */}
          <SectionHeader title="FormSection" description="Grouped form fields" />
          <Card className="mb-8">
            <CardContent className="p-6">
              <FormSection
                title="Account Settings"
                description="Manage your account preferences"
                variant="none"
              >
                <FormField label="Email" helper="We'll never share your email">
                  <Input placeholder="your@email.com" />
                </FormField>
                <FormField label="Display Name">
                  <Input placeholder="John Doe" />
                </FormField>
              </FormSection>
            </CardContent>
          </Card>

          {/* FormField */}
          <SectionHeader title="FormField" description="Individual form field wrapper" />
          <Card className="mb-8">
            <CardContent className="p-6 space-y-4">
              <FormField label="Normal Field" helper="This is helper text">
                <Input placeholder="Enter value" />
              </FormField>
              <FormField label="Required Field" required helper="This field is required">
                <Input placeholder="Enter value" />
              </FormField>
              <FormField label="Error Field" error="This field has an error">
                <Input placeholder="Enter value" />
              </FormField>
              <FormField label="Disabled Field" disabled>
                <Input placeholder="Disabled input" disabled />
              </FormField>
            </CardContent>
          </Card>

          {/* LoadingState */}
          <SectionHeader title="LoadingState" description="Consistent loading states" />
          <Card className="mb-8">
            <CardContent className="p-6 space-y-6">
              <div>
                <h3 className="text-sm font-medium text-text-primary mb-3">Page Loading</h3>
                <LoadingState variant="page" message="Loading data..." />
              </div>
              <div>
                <h3 className="text-sm font-medium text-text-primary mb-3">Skeleton Loading</h3>
                <LoadingState variant="skeleton" skeletonCount={3} />
              </div>
            </CardContent>
          </Card>

          {/* ErrorState */}
          <SectionHeader title="ErrorState" description="Consistent error states" />
          <Card className="mb-8">
            <CardContent className="p-6">
              <ErrorState
                title="Failed to load data"
                description="An error occurred while loading the content. Please try again."
                onRetry={() => console.log("Retry")}
                variant="inline"
              />
            </CardContent>
          </Card>

          {/* ConfirmationDialog */}
          <SectionHeader title="ConfirmationDialog" description="Destructive action confirmation" />
          <Card className="mb-8">
            <CardContent className="p-6">
              <Button onClick={() => setIsConfirmDialogOpen(true)}>Open Confirmation Dialog</Button>
              <ConfirmationDialog
                open={isConfirmDialogOpen}
                onClose={() => setIsConfirmDialogOpen(false)}
                onConfirm={async () => {
                  setConfirmLoading(true);
                  await new Promise((resolve) => setTimeout(resolve, 1000));
                  setConfirmLoading(false);
                }}
                title="Delete Waitlist"
                description="Are you sure you want to delete this waitlist? This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                variant="destructive"
                loading={confirmLoading}
              />
            </CardContent>
          </Card>

          {/* StatusIndicator */}
          <SectionHeader title="StatusIndicator" description="Standardized status badges" />
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex flex-wrap gap-2">
                <StatusIndicator status="active" />
                <StatusIndicator status="inactive" />
                <StatusIndicator status="pending" />
                <StatusIndicator status="completed" />
                <StatusIndicator status="failed" />
                <StatusIndicator status="draft" />
                <StatusIndicator status="published" />
                <StatusIndicator status="connected" />
                <StatusIndicator status="disconnected" />
                <StatusIndicator status="waiting" />
                <StatusIndicator status="invited" />
                <StatusIndicator status="accessed" />
              </div>
            </CardContent>
          </Card>

        </div>

      </div>
    </div>
  );
}
