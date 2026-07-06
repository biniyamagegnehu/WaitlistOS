import type { Metadata } from "next";
import PricingPageClient from "@/components/billing/PricingPageClient";

export const metadata: Metadata = {
  title: "Pricing — WaitlistOS",
  description: "Simple, transparent pricing for WaitlistOS.",
};

export default function PricingPage() {
  return <PricingPageClient />;
}
