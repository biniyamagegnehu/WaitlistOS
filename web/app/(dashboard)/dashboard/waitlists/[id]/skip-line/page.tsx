"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { routes } from "@/lib/routes";

export default function SkipLineRedirect() {
  const params = useParams();
  const router = useRouter();
  const waitlistId = params?.id as string;

  useEffect(() => {
    // Redirect to the waitlist monetization page
    router.replace(routes.waitlistMonetization(waitlistId));
  }, [waitlistId, router]);

  return null;
}