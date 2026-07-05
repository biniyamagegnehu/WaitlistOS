"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { BrandLogo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  showBackLink?: boolean;
  backLinkHref?: string;
  backLinkText?: string;
}

export function AuthLayout({
  children,
  title,
  description,
  showBackLink = true,
  backLinkHref = "/",
  backLinkText = "Back to home",
}: AuthLayoutProps) {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="absolute right-4 top-4">
        <ThemeToggle size="sm" />
      </div>
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <BrandLogo className="justify-center" />
        </div>

        <Card>
          <CardContent className="p-8">
            <div className="mb-6 text-center">
              <h2 className="mb-2 text-2xl font-semibold text-foreground">
                {title}
              </h2>
              {description && (
                <p className="text-sm text-muted-foreground">{description}</p>
              )}
            </div>

            {children}
          </CardContent>
        </Card>

        {showBackLink && (
          <div className="mt-6 text-center">
            <Link
              href={backLinkHref}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {backLinkText}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
