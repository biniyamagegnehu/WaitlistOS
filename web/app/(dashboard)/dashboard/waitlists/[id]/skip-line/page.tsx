"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { routes } from "@/lib/routes";

export default function SkipLineRedirect() {
  const params = useParams();
  const router = useRouter();
  const waitlistId = params?.id as string;

  useEffect(() => {
    // Redirect to the new monetization path
    router.replace(routes.waitlistMonetizationSkipLine(waitlistId));
  }, [waitlistId, router]);

  return null;
}