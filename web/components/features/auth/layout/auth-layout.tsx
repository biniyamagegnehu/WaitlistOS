"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

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
    <div className="min-h-screen flex items-center justify-center bg-[#0d0d14] px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="text-3xl font-bold text-white">WaitlistOS</h1>
          </Link>
        </div>

        {/* Auth Card */}
        <Card>
          <CardContent className="p-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-semibold text-white mb-2">
                {title}
              </h2>
              {description && (
                <p className="text-sm text-zinc-400">{description}</p>
              )}
            </div>

            {children}
          </CardContent>
        </Card>

        {/* Back Link */}
        {showBackLink && (
          <div className="mt-6 text-center">
            <Link
              href={backLinkHref}
              className="text-sm text-zinc-400 hover:text-white transition-colors"
            >
              {backLinkText}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
