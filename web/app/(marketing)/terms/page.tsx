import { Metadata } from "next";
import { 
  FileCheck, 
  UserCheck, 
  Briefcase, 
  CreditCard, 
  Award, 
  Sparkles, 
  Ban, 
  Activity, 
  ShieldAlert, 
  Scale, 
  AlertTriangle, 
  CheckCircle2, 
  Globe2, 
  RefreshCw, 
  Mail,
  Building2,
  FileText
} from "lucide-react";
import { 
  LegalPageShell, 
  LegalSectionCard, 
  LegalCallout,
  type HighlightItem,
  type TocItem 
} from "@/components/legal/legal-page-shell";

export const metadata: Metadata = {
  title: "Terms of Service | Getlist",
  description:
    "Read the Getlist Terms of Service governing your use of the Getlist platform and services.",
};

const highlights: HighlightItem[] = [
  {
    icon: <Briefcase className="h-4 w-4" />,
    title: "Founder Empowerment",
    description:
      "Operate branded waitlists, incentivize viral referrals, and collect early demand before launch day.",
  },
  {
    icon: <Sparkles className="h-4 w-4" />,
    title: "100% IP Ownership",
    description:
      "You retain full intellectual property ownership over your brand, assets, copy, and audience data.",
  },
  {
    icon: <CreditCard className="h-4 w-4" />,
    title: "Transparent Monetization",
    description:
      "Direct integration with Stripe and Chapa for Skip the Line priority and Pre-Order Deposits.",
  },
  {
    icon: <Award className="h-4 w-4" />,
    title: "Fair Affiliate Program",
    description:
      "Predictable 30-day referral attribution windows with automated anti-fraud commission protection.",
  },
];

const toc: TocItem[] = [
  { id: "acceptance", title: "Acceptance of Terms", badge: "Binding" },
  { id: "eligibility", title: "Eligibility & Accounts" },
  { id: "founder-responsibilities", title: "Using Getlist (Founders)", badge: "Core" },
  { id: "payments-monetization", title: "Payments & Monetization", badge: "Billing" },
  { id: "affiliate-program", title: "Affiliate Program", badge: "Referrals" },
  { id: "intellectual-property", title: "Intellectual Property & Content" },
  { id: "prohibited-uses", title: "Prohibited Uses & Conduct", badge: "Rules" },
  { id: "service-availability", title: "Service Availability & Changes" },
  { id: "termination", title: "Suspension & Termination" },
  { id: "disclaimers", title: "Disclaimer of Warranties" },
  { id: "limitation-liability", title: "Limitation of Liability" },
  { id: "indemnification", title: "Indemnification" },
  { id: "governing-law", title: "Governing Law & Jurisdiction" },
  { id: "term-changes", title: "Changes to These Terms" },
  { id: "contact-us", title: "Contact Information", badge: "Support" },
];

export default function TermsOfServicePage() {
  const effectiveDate = "[INSERT EFFECTIVE DATE]";
  const legalEmail = "[LEGAL CONTACT EMAIL]";

  return (
    <LegalPageShell
      type="terms"
      eyebrow="Platform Agreement"
      titlePrefix="Terms of Service: Simple, transparent"
      titleAccent="platform rules"
      description="These terms establish the legal agreement between you and Getlist for operating waitlists, processing early monetization, and building customer communities."
      effectiveDate={effectiveDate}
      highlights={highlights}
      toc={toc}
      contactEmail={legalEmail}
    >
      {/* ── Section 1: Acceptance of Terms ── */}
      <LegalSectionCard
        id="acceptance"
        number="01"
        title="Acceptance of Terms"
        icon={<FileCheck className="h-5 w-5 text-primary" />}
        badge="Agreement"
      >
        <p>
          By creating an account, accessing, or utilizing Getlist (the &quot;Service&quot;),
          you agree to be bound by these Terms of Service. If you are entering into this agreement
          on behalf of a legal entity or organization, you represent and warrant that you possess
          the legal authority to bind that entity to these Terms.
        </p>

        <p>
          If you do not agree to these Terms, you must not access or use Getlist.
        </p>
      </LegalSectionCard>

      {/* ── Section 2: Eligibility & Accounts ── */}
      <LegalSectionCard
        id="eligibility"
        number="02"
        title="Eligibility & Account Security"
        icon={<UserCheck className="h-5 w-5 text-primary" />}
      >
        <p>
          To access certain features of Getlist, you must register for an account. You agree to:
        </p>

        <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm">
          <li>Provide accurate, current, and complete registration information.</li>
          <li>Maintain the confidentiality of your credentials, password, and session access tokens.</li>
          <li>Notify Getlist immediately upon discovering any unauthorized breach or account compromise.</li>
          <li>Accept responsibility for all activities occurring under your administrative account credentials.</li>
        </ul>
      </LegalSectionCard>

      {/* ── Section 3: Using Getlist (Founders) ── */}
      <LegalSectionCard
        id="founder-responsibilities"
        number="03"
        title="Using Getlist (For Founders)"
        icon={<Briefcase className="h-5 w-5 text-primary" />}
        badge="Responsibilities"
      >
        <p>
          Founders use Getlist to build viral waitlists, run gamified referral competitions,
          and validate consumer demand for forthcoming products or services. As a Founder, you agree that:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div className="rounded-xl border border-border bg-surface/60 p-4">
            <h4 className="font-semibold text-foreground text-xs mb-1">Participant Privacy Compliance</h4>
            <p className="text-xs text-muted-foreground">
              You are solely responsible for obtaining necessary consents and complying with applicable
              data protection laws regarding participant information you collect.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-surface/60 p-4">
            <h4 className="font-semibold text-foreground text-xs mb-1">Truth in Advertising</h4>
            <p className="text-xs text-muted-foreground">
              You will not use Getlist to promote deceptive offers, phantom products, illegal schemes,
              or misleading promotional campaigns.
            </p>
          </div>
        </div>

        <LegalCallout type="warning" title="Anti-Manipulation Mandate">
          Founders may not artificially inflate referral statistics, inject phantom participants,
          or game public leaderboard standings. Violation will result in immediate waitlist deactivation.
        </LegalCallout>
      </LegalSectionCard>

      {/* ── Section 4: Payments and Monetization ── */}
      <LegalSectionCard
        id="payments-monetization"
        number="04"
        title="Payments and Monetization"
        icon={<CreditCard className="h-5 w-5 text-primary" />}
        badge="Financials"
      >
        <p>
          Getlist provides subscription tiers (Starter, Pro) alongside creator monetization features,
          including <strong>Skip the Line</strong> paid queue priority and <strong>Pre-Order Deposits</strong>:
        </p>

        <div className="space-y-3 pt-1">
          <div className="rounded-xl border border-border/80 bg-surface/50 p-4">
            <h4 className="text-xs font-semibold text-foreground mb-1">
              Third-Party Payment Processors (Stripe & Chapa)
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              All payment transactions are processed securely through third-party processors (Stripe and Chapa).
              Getlist does not hold customer bank funds directly or retain sensitive credit card numbers.
              Founders must maintain active, compliant merchant accounts with these providers.
            </p>
          </div>

          <div className="rounded-xl border border-border/80 bg-surface/50 p-4">
            <h4 className="text-xs font-semibold text-foreground mb-1">
              Platform Service Fees
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Getlist may collect a platform fee on monetization transactions processed through the Service,
              as indicated in your dashboard settings at the time of feature enablement.
            </p>
          </div>

          <div className="rounded-xl border border-border/80 bg-surface/50 p-4">
            <h4 className="text-xs font-semibold text-foreground mb-1">
              Refund Policy
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Unless explicitly required by applicable consumer protection laws or agreed in writing,
              all platform subscription fees and transaction platform charges are <strong>non-refundable</strong>.
              Founders are independently responsible for managing and fulfilling any deposit guarantees made to their participants.
            </p>
          </div>
        </div>
      </LegalSectionCard>

      {/* ── Section 5: Affiliate Program ── */}
      <LegalSectionCard
        id="affiliate-program"
        number="05"
        title="Affiliate Program"
        icon={<Award className="h-5 w-5 text-primary" />}
        badge="Referral Program"
      >
        <p>
          Eligible founders may participate in the Getlist Affiliate Program to earn recurring commissions
          on referred platform subscribers.
        </p>

        <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm">
          <li>
            <strong className="text-foreground">Attribution Window:</strong> Referrals are attributed via a
            30-day last-valid-click window tracked without invasive cross-site cookies.
          </li>
          <li>
            <strong className="text-foreground">Settlement Window:</strong> Commissions are held in a 14-day
            verification window before reaching &quot;Eligible&quot; payout status to detect fraud or payment failures.
          </li>
          <li>
            <strong className="text-foreground">Fraud Enforcement:</strong> Self-referrals, bidding on Getlist
            branded search terms, or manipulating click telemetry is strictly prohibited and leads to commission forfeiture.
          </li>
        </ul>
      </LegalSectionCard>

      {/* ── Section 6: Intellectual Property ── */}
      <LegalSectionCard
        id="intellectual-property"
        number="06"
        title="Intellectual Property & Content Ownership"
        icon={<Sparkles className="h-5 w-5 text-primary" />}
      >
        <p>
          <strong className="text-foreground">Your Content:</strong> You retain 100% intellectual property ownership
          over logos, trademarks, copywriting, and waitlist materials uploaded to Getlist. You grant us a limited,
          non-exclusive license strictly to host, render, and display your materials as necessary to operate your waitlist.
        </p>
        <p>
          <strong className="text-foreground">Getlist Platform IP:</strong> All software, code, algorithms,
          visual designs, logos, and documentation related to the Getlist platform remain the exclusive intellectual
          property of <strong className="text-foreground">[LEGAL ENTITY NAME]</strong>.
        </p>
      </LegalSectionCard>

      {/* ── Section 7: Prohibited Uses ── */}
      <LegalSectionCard
        id="prohibited-uses"
        number="07"
        title="Prohibited Uses & Conduct"
        icon={<Ban className="h-5 w-5 text-primary" />}
        badge="Conduct"
      >
        <p>You agree not to misuse Getlist. You may not:</p>

        <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm">
          <li>Use the Service to transmit unsolicited commercial bulk email (&quot;spam&quot;) or violate CAN-SPAM regulations.</li>
          <li>Host malicious software, phishing pages, deceptive investment scams, or infringing intellectual property.</li>
          <li>Probe, scan, or test the vulnerability of our APIs, servers, or networks without authorized penetration testing agreements.</li>
          <li>Reverse engineer, decompile, scrape, or extract source code from the Getlist application.</li>
          <li>Circumvent plan limits, subscriber caps, or billing security mechanisms.</li>
        </ul>
      </LegalSectionCard>

      {/* ── Section 8: Service Availability & Changes ── */}
      <LegalSectionCard
        id="service-availability"
        number="08"
        title="Service Availability & Platform Changes"
        icon={<Activity className="h-5 w-5 text-primary" />}
      >
        <p>
          We continually enhance our infrastructure to provide maximum uptime and high-velocity performance.
          However, Getlist is provided without warranties of uninterrupted or error-free availability.
        </p>
        <p>
          We reserve the right to deploy updates, modify feature sets, conduct scheduled maintenance, or discontinue
          deprecated APIs upon reasonable notice.
        </p>
      </LegalSectionCard>

      {/* ── Section 9: Suspension & Termination ── */}
      <LegalSectionCard
        id="termination"
        number="09"
        title="Suspension & Termination"
        icon={<ShieldAlert className="h-5 w-5 text-primary" />}
      >
        <p>
          We reserve the right to suspend or terminate your account immediately if you breach these Terms, engage in
          fraudulent activity, or violate applicable laws.
        </p>
        <p>
          You may terminate your account at any time via your dashboard settings. Upon termination, your right to use the
          platform ceases, and your waitlists will be deactivated.
        </p>
      </LegalSectionCard>

      {/* ── Section 10: Disclaimer of Warranties ── */}
      <LegalSectionCard
        id="disclaimers"
        number="10"
        title="Disclaimer of Warranties"
        icon={<AlertTriangle className="h-5 w-5 text-primary" />}
      >
        <p className="uppercase text-xs font-semibold tracking-wider text-muted-foreground">
          Notice to all users
        </p>
        <p className="text-xs sm:text-sm leading-relaxed">
          GETLIST AND ALL INTEGRATED SERVICES ARE PROVIDED ON AN &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot;
          BASIS, WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS, IMPLIED, OR STATUTORY, INCLUDING WITHOUT LIMITATION
          THE IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT.
        </p>
      </LegalSectionCard>

      {/* ── Section 11: Limitation of Liability ── */}
      <LegalSectionCard
        id="limitation-liability"
        number="11"
        title="Limitation of Liability"
        icon={<Scale className="h-5 w-5 text-primary" />}
      >
        <p className="text-xs sm:text-sm leading-relaxed">
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, IN NO EVENT SHALL{" "}
          <strong className="text-foreground">[LEGAL ENTITY NAME]</strong>, ITS DIRECTORS, EMPLOYEES, AFFILIATES,
          OR PARTNERS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES,
          INCLUDING LOSS OF PROFITS, DATA, USE, GOODWILL, OR BUSINESS OPPORTUNITIES, RESULTING FROM YOUR ACCESS TO
          OR INABILITY TO USE THE SERVICE.
        </p>
      </LegalSectionCard>

      {/* ── Section 12: Indemnification ── */}
      <LegalSectionCard
        id="indemnification"
        number="12"
        title="Indemnification"
        icon={<CheckCircle2 className="h-5 w-5 text-primary" />}
      >
        <p>
          You agree to defend, indemnify, and hold harmless{" "}
          <strong className="text-foreground">[LEGAL ENTITY NAME]</strong>, its licensors, contractors, and agents
          from and against any liabilities, claims, damages, losses, and legal expenses arising out of or related to
          your use of the Service, your waitlists, your customer representations, or any violation of these Terms.
        </p>
      </LegalSectionCard>

      {/* ── Section 13: Governing Law ── */}
      <LegalSectionCard
        id="governing-law"
        number="13"
        title="Governing Law & Dispute Resolution"
        icon={<Globe2 className="h-5 w-5 text-primary" />}
        badge="Legal Jurisdiction"
      >
        <p>
          These Terms shall be governed by and construed in accordance with the laws of{" "}
          <strong className="text-foreground">[GOVERNING LAW / JURISDICTION]</strong>, without regard to conflict
          of law principles.
        </p>
        <p>
          Any legal proceedings arising from these Terms shall be instituted exclusively in the competent courts
          of that designated jurisdiction.
        </p>
      </LegalSectionCard>

      {/* ── Section 14: Changes to These Terms ── */}
      <LegalSectionCard
        id="term-changes"
        number="14"
        title="Changes to These Terms"
        icon={<RefreshCw className="h-5 w-5 text-primary" />}
      >
        <p>
          We reserve the right to revise or update these Terms at any time. If modifications are material, we will
          provide at least 30 days&apos; advance notice prior to effective date changes via dashboard notification
          or email.
        </p>
        <p>
          Your continued use of Getlist after changes become effective constitutes your binding acceptance of the updated terms.
        </p>
      </LegalSectionCard>

      {/* ── Section 15: Contact Us ── */}
      <LegalSectionCard
        id="contact-us"
        number="15"
        title="Contact Us"
        icon={<Mail className="h-5 w-5 text-primary" />}
        badge="Legal Support"
      >
        <p>
          If you have questions regarding these Terms of Service or require clarification regarding platform obligations,
          please contact:
        </p>

        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 mt-3 space-y-2">
          <div className="font-semibold text-foreground text-sm">
            Getlist Legal Affairs & Platform Governance
          </div>
          <div className="text-xs text-muted-foreground">
            Entity: <span className="font-mono text-foreground font-medium">[LEGAL ENTITY NAME]</span>
          </div>
          <div className="text-xs text-muted-foreground">
            Direct Legal Inquiries:{" "}
            <a
              href={`mailto:${legalEmail}`}
              className="font-mono font-medium text-primary hover:underline"
            >
              {legalEmail}
            </a>
          </div>
        </div>
      </LegalSectionCard>
    </LegalPageShell>
  );
}
