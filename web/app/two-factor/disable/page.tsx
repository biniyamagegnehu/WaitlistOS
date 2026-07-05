"use client";

import { useRouter } from "next/navigation";
import { z } from "zod";
import { AuthLayout } from "@/components/features/auth/layout/auth-layout";
import { AuthForm } from "@/components/features/auth/forms/auth-form";
import { PasswordInput } from "@/components/ui/password-input";
import { disableTwoFactor } from "@/services/auth";
import { useAuth } from "@/contexts/auth-context";
import { routes } from "@/lib/routes";

const disableTwoFactorSchema = z.object({
  password: z.string().min(1, "Password is required"),
});

type DisableTwoFactorFormData = z.infer<typeof disableTwoFactorSchema>;

export default function DisableTwoFactorPage() {
  const router = useRouter();
  const { refreshUser, patchUser } = useAuth();

  const handleDisable = async (data: DisableTwoFactorFormData) => {
    await disableTwoFactor(data);
    patchUser({ isTwoFactorEnabled: false });
    await refreshUser();
    router.replace(routes.security);
  };

  return (
    <AuthLayout
      title="Disable two-factor authentication"
      description="Confirm your password to disable 2FA"
      backLinkHref={routes.security}
      backLinkText="Back to security"
    >
      <AuthForm
        schema={disableTwoFactorSchema}
        onSubmit={handleDisable}
        submitText="Disable 2FA"
        onSuccessMessage="Two-factor authentication disabled"
      >
        {({ register, formState: { errors } }) => (
          <PasswordInput
            label="Password"
            placeholder="Enter your password"
            error={errors.password?.message}
            {...register("password")}
          />
        )}
      </AuthForm>
    </AuthLayout>
  );
}
