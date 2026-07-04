"use client";

import { useRouter } from "next/navigation";
import { z } from "zod";
import { AuthLayout } from "@/components/features/auth/layout/auth-layout";
import { AuthForm } from "@/components/features/auth/forms/auth-form";
import { PasswordInput } from "@/components/ui/password-input";
import { disableTwoFactor } from "@/services/auth";

const disableTwoFactorSchema = z.object({
  password: z.string().min(1, "Password is required"),
});

type DisableTwoFactorFormData = z.infer<typeof disableTwoFactorSchema>;

export default function DisableTwoFactorPage() {
  const router = useRouter();

  const handleDisable = async (data: DisableTwoFactorFormData) => {
    await disableTwoFactor(data);
    router.replace("/dashboard/security");
  };

  return (
    <AuthLayout
      title="Disable two-factor authentication"
      description="Confirm your password to disable 2FA"
      backLinkHref="/dashboard/security"
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
