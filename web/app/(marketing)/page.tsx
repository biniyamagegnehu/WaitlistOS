import type { Metadata } from "next";
import { PageContainer } from "@/components/patterns/page-container";
import { HeroSection } from "@/components/landing/hero-section";
import { CoreCapabilities } from "@/components/landing/core-capabilities";
import { ProductShowcase, DashboardMockup } from "@/components/landing/product-showcase";
import { ReferralGrowthEngine } from "@/components/landing/referral-growth-engine";
import { PricingSection } from "@/components/landing/pricing-section";
import { FAQSection } from "@/components/landing/faq-section";
import { FinalCTA } from "@/components/landing/final-cta";

export const metadata: Metadata = {
  title: "Getlist — Launch With Demand Already Waiting",
  description:
    "Create branded waitlists, reward referrals, and build a community before your product launches.",
};

export default function HomePage() {
  return (
    <div className="flex-1">
      <HeroSection />
      
      {/* Core Capabilities Section */}
      <CoreCapabilities />

      {/* Visual Storytelling - Create Waitlist */}
      <section className="py-16 sm:py-24" id="how-it-works">
        <PageContainer withoutVerticalPadding>
          <ProductShowcase
            image={<DashboardMockup variant="waitlist" />}
            title="Create Your Waitlist in Minutes"
            description="Set up a branded waitlist page with custom colors, logo, and messaging. No coding required — just fill in the details and go live."
            features={[
              "Custom branding and colors",
              "Instant deployment",
              "Mobile-responsive design",
              "SEO-optimized pages"
            ]}
          />
        </PageContainer>
      </section>

      {/* Visual Storytelling - Referral System */}
      <ReferralGrowthEngine />

      {/* Visual Storytelling - Analytics */}
      <section className="py-16 sm:py-24">
        <PageContainer withoutVerticalPadding>
          <ProductShowcase
            image={<DashboardMockup variant="analytics" />}
            title="Track Growth with Powerful Analytics"
            description="Monitor your waitlist performance with real-time analytics. Track signups, referrals, conversion rates, and growth trends all in one dashboard."
            features={[
              "Real-time participant tracking",
              "Referral performance metrics",
              "Growth trend visualization",
              "Export to CSV anytime"
            ]}
          />
        </PageContainer>
      </section>

      {/* Visual Storytelling - Open The Gates */}
      <section className="bg-surface py-16 sm:py-24" id="open-the-gates">
        <PageContainer withoutVerticalPadding>
          <ProductShowcase
            reverse
            image={<DashboardMockup variant="gates" />}
            title="Launch On Your Terms with Open The Gates"
            description="When your product is ready, select participants from your waitlist and send batch invitations. Control your launch pace by inviting users in waves."
            features={[
              "Select participants by position or referrals",
              "Send batch invitations instantly",
              "Track invitation acceptance rates",
              "Manage onboarding seamlessly"
            ]}
          />
        </PageContainer>
      </section>

      <PricingSection />
      <FAQSection />
      <FinalCTA />
    </div>
  );
}
