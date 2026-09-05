import type { Metadata } from "next";
import PricingPageClient from "@/components/billing/PricingPageClient";

export const metadata: Metadata = {
  title: "Pricing — Getlist",
  description: "Simple, transparent pricing for Getlist.",
};

export default function PricingPage() {
  return <PricingPageClient />;
}
