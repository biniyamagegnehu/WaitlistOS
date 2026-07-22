"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { User, Mail, Shield, Calendar, Building2, CheckCircle, XCircle, Globe, MapPin, Users, Briefcase, Edit, Upload, Camera } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogBody } from "@/components/ui/dialog";
import { CompanyProfileForm } from "@/components/company-profile/CompanyProfileForm";
import { useCurrentUser } from "@/contexts/auth-context";
import { routes } from "@/lib/routes";
import { uploadFile } from "@/services/files";
import { updateProfile } from "@/services/users";
import { companyProfileService } from "@/services/company-profile";
import { getApiErrorMessage } from "@/lib/errors";
import toast from "react-hot-toast";

export function ProfileSettingsSection() {
  const router = useRouter();
  const { user, founder, isLoading, refreshUser } = useCurrentUser();
  const [isEditNameDialogOpen, setIsEditNameDialogOpen] = React.useState(false);
  const [isEditCompanyDialogOpen, setIsEditCompanyDialogOpen] = React.useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = React.useState(false);
  const [editNameForm, setEditNameForm] = React.useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
  });

  React.useEffect(() => {
    if (!isLoading && !user) {
      router.replace(routes.login);
    }
  }, [isLoading, user, router]);

  const handleNameEdit = () => {
    setEditNameForm({
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
    });
    setIsEditNameDialogOpen(true);
  };

  const handleNameSave = async () => {
    try {
      await updateProfile({
        firstName: editNameForm.firstName || undefined,
        lastName: editNameForm.lastName || undefined,
      });
      toast.success("Name updated successfully");
      setIsEditNameDialogOpen(false);
      await refreshUser();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to update name"));
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingAvatar(true);
    try {
      const uploaded = await uploadFile(file);
      await updateProfile({ avatar: uploaded.url });
      toast.success("Avatar updated successfully");
      await refreshUser();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to upload avatar"));
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton variant="rectangular" className="h-32" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton variant="rectangular" className="h-48" />
          <Skeleton variant="rectangular" className="h-48" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const getInitials = (firstName?: string, lastName?: string, email?: string) => {
    if (firstName && lastName) return `${firstName[0]}${lastName[0]}`.toUpperCase();
    if (firstName) return firstName[0].toUpperCase();
    if (email) return email[0].toUpperCase();
    return "U";
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-6">
            <div className="relative">
              {user.avatar ? (
                <div className="h-20 w-20 overflow-hidden rounded-full border-2 border-border">
                  <img
                    src={user.avatar}
                    alt="Profile avatar"
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <Avatar
                  size="xl"
                  fallback={getInitials(user.firstName, user.lastName, user.email)}
                />
              )}
              <label className="absolute bottom-0 right-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90">
                <Camera className="h-4 w-4" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                  disabled={isUploadingAvatar}
                />
              </label>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold text-foreground">
                  {user.firstName && user.lastName
                    ? `${user.firstName} ${user.lastName}`
                    : user.firstName || user.lastName || user.email}
                </h2>
                <Button variant="ghost" size="sm" onClick={handleNameEdit}>
                  <Edit className="h-3 w-3" />
                </Button>
              </div>
              <p className="mt-1 text-muted-foreground">{user.email}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge variant={user.isEmailVerified ? "success" : "warning"}>
                  {user.isEmailVerified ? (
                    <>
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Verified
                    </>
                  ) : (
                    <>
                      <XCircle className="mr-1 h-3 w-3" />
                      Not Verified
                    </>
                  )}
                </Badge>
                <Badge>{user.role}</Badge>
                <Badge variant="outline">{user.provider}</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Company Profile</CardTitle>
          {founder?.companyName && (
            <Button variant="ghost" size="sm" onClick={() => setIsEditCompanyDialogOpen(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {founder?.companyName ? (
            <>
              {/* Company Header with Logo */}
              <div className="flex items-start gap-4">
                {founder.companyLogo ? (
                  <div className="h-16 w-16 overflow-hidden rounded-full border border-border">
                    <img
                      src={founder.companyLogo}
                      alt={`${founder.companyName} logo`}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-muted">
                    <Building2 className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground">{founder.companyName}</h3>
                  {founder.companyWebsite && (
                    <a
                      href={founder.companyWebsite}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      {founder.companyWebsite}
                    </a>
                  )}
                </div>
              </div>

              {/* Company Details */}
              <div className="grid gap-4 sm:grid-cols-2">
                <InfoRow
                  icon={<Briefcase className="h-4 w-4" />}
                  label="Industry"
                  value={founder.industry || "Not set"}
                />
                <InfoRow
                  icon={<MapPin className="h-4 w-4" />}
                  label="Country"
                  value={founder.country || "Not set"}
                />
                <InfoRow
                  icon={<Users className="h-4 w-4" />}
                  label="Team Size"
                  value={founder.teamSize || "Not set"}
                />
                <InfoRow
                  icon={<Calendar className="h-4 w-4" />}
                  label="Founder since"
                  value={formatDate(founder.createdAt)}
                />
              </div>

              {/* Company Description */}
              {founder.companyDescription && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">Company Description</p>
                  <p className="text-sm text-muted-foreground">{founder.companyDescription}</p>
                </div>
              )}
            </>
          ) : (
            <Alert variant="info" title="No company profile">
              <p className="text-sm">
                Complete your company profile to get started.
              </p>
              <Button className="mt-3" onClick={() => router.push("/onboarding")}>
                Complete Profile
              </Button>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <StatusRow
            title="Email Verification"
            description={
              user.isEmailVerified ? "Your email is verified" : "Your email is not verified"
            }
            badge={user.isEmailVerified ? "Verified" : "Not Verified"}
            variant={user.isEmailVerified ? "success" : "warning"}
          />
          <StatusRow
            title="Two-Factor Authentication"
            description={
              user.isTwoFactorEnabled
                ? "2FA is enabled on your account"
                : "Add an extra layer of security"
            }
            badge={user.isTwoFactorEnabled ? "Enabled" : "Disabled"}
            variant={user.isTwoFactorEnabled ? "success" : "warning"}
          />
          {!user.isEmailVerified && (
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => router.push(routes.resendVerification)}
            >
              Verify Email
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Edit Name Dialog */}
      <Dialog open={isEditNameDialogOpen} onClose={() => setIsEditNameDialogOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Name</DialogTitle>
          </DialogHeader>
          <DialogBody className="space-y-4">
            <Input
              label="First Name"
              value={editNameForm.firstName}
              onChange={(e) => setEditNameForm({ ...editNameForm, firstName: e.target.value })}
              placeholder="Enter your first name"
            />
            <Input
              label="Last Name"
              value={editNameForm.lastName}
              onChange={(e) => setEditNameForm({ ...editNameForm, lastName: e.target.value })}
              placeholder="Enter your last name"
            />
          </DialogBody>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setIsEditNameDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleNameSave}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Company Profile Dialog */}
      <Dialog open={isEditCompanyDialogOpen} onClose={() => setIsEditCompanyDialogOpen(false)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Company Profile</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <CompanyProfileForm
              mode="edit"
              initialValues={founder || undefined}
              onSubmit={async (data) => {
                await companyProfileService.updateCompanyProfile(data);
                toast.success("Company profile updated successfully");
                setIsEditCompanyDialogOpen(false);
                await refreshUser();
              }}
              submitButtonText="Save Changes"
            />
          </DialogBody>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-muted-foreground">{icon}</span>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="capitalize text-foreground">{value}</p>
      </div>
    </div>
  );
}

function StatusRow({
  title,
  description,
  badge,
  variant,
}: {
  title: string;
  description: string;
  badge: string;
  variant: "success" | "warning";
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="font-medium text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Badge variant={variant}>{badge}</Badge>
    </div>
  );
}
