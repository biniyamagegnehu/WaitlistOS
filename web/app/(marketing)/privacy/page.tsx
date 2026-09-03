import { Metadata } from "next";
import { 
  ShieldCheck, 
  Users, 
  Database, 
  Layers, 
  Share2, 
  Lock, 
  UserCheck, 
  Globe, 
  RefreshCw, 
  Mail, 
  CreditCard,
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
  title: "Privacy Policy | WaitlistOS",
  description:
    "Read the WaitlistOS Privacy Policy to understand how we collect, use, protect, and manage information when you use our services.",
};

const highlights: HighlightItem[] = [
  {
    icon: <Users className="h-4 w-4" />,
    title: "Two Distinct Roles",
    description:
      "We distinguish between WaitlistOS Founders (account owners) and Waitlist Participants joining public waitlists.",
  },
  {
    icon: <CreditCard className="h-4 w-4" />,
    title: "Secure Payments",
    description:
      "Stripe and Chapa process billing. We never store or receive full credit card numbers or security codes.",
  },
  {
    icon: <Lock className="h-4 w-4" />,
    title: "Zero Ad Trackers",
    description:
      "No third-party advertising pixels, session recording tools, or invasive behavioral trackers.",
  },
  {
    icon: <UserCheck className="h-4 w-4" />,
    title: "Privacy & Control",
    description:
      "Founders and participants maintain rights to access, manage, export, and delete personal data.",
  },
];

const toc: TocItem[] = [
  { id: "introduction", title: "Introduction & Roles", badge: "Overview" },
  { id: "information-collected", title: "Information We Collect", badge: "Core" },
  { id: "how-we-use-information", title: "How We Use Information" },
  { id: "how-we-share-information", title: "How We Share Information" },
  { id: "third-party-services", title: "Third-Party Services", badge: "Processors" },
  { id: "security-retention", title: "Security & Data Retention" },
  { id: "privacy-rights", title: "Your Privacy Rights" },
  { id: "children-privacy", title: "Children's Privacy" },
  { id: "international-transfers", title: "International Data Transfers" },
  { id: "policy-changes", title: "Changes to This Policy" },
  { id: "contact-us", title: "Contact Information", badge: "Support" },
];

export default function PrivacyPolicyPage() {
  const effectiveDate = "[INSERT EFFECTIVE DATE]";
  const privacyEmail = "[PRIVACY CONTACT EMAIL]";

  return (
    <LegalPageShell
      type="privacy"
      eyebrow="Trust & Transparency"
      titlePrefix="Privacy Policy: How we protect &"
      titleAccent="handle your data"
      description="At WaitlistOS, we believe in privacy by design. This policy outlines how information is collected, processed, and safeguarded across both our founder platform and public waitlist pages."
      effectiveDate={effectiveDate}
      highlights={highlights}
      toc={toc}
      contactEmail={privacyEmail}
    >
      {/* ── Section 1: Introduction & Roles ── */}
      <LegalSectionCard
        id="introduction"
        number="01"
        title="Introduction & Roles"
        icon={<FileText className="h-5 w-5 text-primary" />}
        badge="Scope"
      >
        <p>
          Welcome to WaitlistOS. This Privacy Policy explains how{" "}
          <strong className="text-foreground">[LEGAL ENTITY NAME]</strong> (&quot;we&quot;,
          &quot;us&quot;, or &quot;our&quot;) collects, uses, and protects information when you
          use our waitlist management platform, APIs, dashboard, and public waitlist surfaces
          (collectively, the &quot;Service&quot;).
        </p>

        <p>
          To maintain clarity and accuracy regarding data responsibilities, WaitlistOS operates
          under two distinct relationships:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="rounded-2xl border border-border/80 bg-surface/60 p-4">
            <div className="flex items-center gap-2 mb-2 font-semibold text-foreground text-sm">
              <Building2 className="h-4 w-4 text-primary" />
              Founder Information
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              For businesses, creators, and individuals who register accounts on WaitlistOS
              to build, configure, and manage waitlists, we act as the <strong>Data Controller</strong>.
            </p>
          </div>

          <div className="rounded-2xl border border-border/80 bg-surface/60 p-4">
            <div className="flex items-center gap-2 mb-2 font-semibold text-foreground text-sm">
              <Users className="h-4 w-4 text-primary" />
              Participant Information
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              For prospective customers joining waitlists created by Founders, WaitlistOS acts as a{" "}
              <strong>Data Processor (Service Provider)</strong> on behalf of the Founder who controls that waitlist.
            </p>
          </div>
        </div>

        <LegalCallout type="info" title="Dual Operational Model">
          If you are an individual joining a creator&apos;s waitlist, the Founder managing that waitlist
          is the primary Data Controller of your submitted answers. You should review their independent
          policies in addition to this platform policy.
        </LegalCallout>
      </LegalSectionCard>

      {/* ── Section 2: Information We Collect ── */}
      <LegalSectionCard
        id="information-collected"
        number="02"
        title="Information We Collect"
        icon={<Database className="h-5 w-5 text-primary" />}
        badge="Data Categories"
      >
        <p>
          We only collect personal information that is genuinely necessary to provide, optimize,
          and secure our services. We do not collect extraneous data.
        </p>

        <div className="space-y-4 pt-1">
          <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
            A. From Founders (Account Holders)
          </h3>
          <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm">
            <li>
              <strong className="text-foreground">Identity & Account Data:</strong> Name, email address,
              encrypted password hash, optional profile avatar, and account status.
            </li>
            <li>
              <strong className="text-foreground">Authentication & Security Records:</strong> Google OAuth
              identifiers (if signing in via Google), Two-Factor Authentication (TOTP) status, device session tokens,
              IP address, and browser user agent for active session security.
            </li>
            <li>
              <strong className="text-foreground">Company & Workspace Profile:</strong> Company name, industry,
              description, team size, website URL, country, and billing contact details.
            </li>
            <li>
              <strong className="text-foreground">Billing & Transaction Identifiers:</strong> Subscription tier
              (Starter, Pro), billing cycle, provider transaction IDs, and receipt references.{" "}
              <em className="text-foreground font-medium">We do not store or process complete credit card numbers or CVVs.</em>
            </li>
            <li>
              <strong className="text-foreground">Uploaded Branding & Assets:</strong> Brand logos, visual theme
              settings, custom copy, and waitlist configuration parameters.
            </li>
          </ul>

          <h3 className="text-sm font-bold uppercase tracking-wider text-foreground pt-3">
            B. From Participants (Waitlist Subscribers)
          </h3>
          <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm">
            <li>
              <strong className="text-foreground">Contact Credentials:</strong> Email address submitted
              to reserve a spot on a waitlist.
            </li>
            <li>
              <strong className="text-foreground">Waitlist Position & Referral Identifiers:</strong> Unique referral
              codes, attributed referrer ID, referral count, streak milestones, team memberships, and priority boost status.
            </li>
            <li>
              <strong className="text-foreground">Custom Questionnaire Responses:</strong> Answers provided
              to custom survey or onboarding questions configured by the specific Founder.
            </li>
            <li>
              <strong className="text-foreground">Technical & Anti-Fraud Telemetry:</strong> Anonymized or hashed IP
              address (used strictly for referral fraud and abuse prevention), browser name, device category,
              country code derived from GeoLite2 database lookup, and referral source attribution.
            </li>
          </ul>
        </div>
      </LegalSectionCard>

      {/* ── Section 3: How We Use Information ── */}
      <LegalSectionCard
        id="how-we-use-information"
        number="03"
        title="How We Use Information"
        icon={<Layers className="h-5 w-5 text-primary" />}
      >
        <p>We process collected data strictly for specific, legitimate business purposes:</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div className="rounded-xl border border-border/70 bg-surface/50 p-4">
            <h4 className="font-semibold text-foreground text-xs mb-1">Core Service Provision</h4>
            <p className="text-xs text-muted-foreground">
              Hosting waitlists, computing dynamic queue positions, attributing referral rewards,
              and delivering participant access codes.
            </p>
          </div>

          <div className="rounded-xl border border-border/70 bg-surface/50 p-4">
            <h4 className="font-semibold text-foreground text-xs mb-1">Transactional Notifications</h4>
            <p className="text-xs text-muted-foreground">
              Dispatching transactional verification emails, waitlist position updates,
              password reset links, and cohort invitations. We never send spam.
            </p>
          </div>

          <div className="rounded-xl border border-border/70 bg-surface/50 p-4">
            <h4 className="font-semibold text-foreground text-xs mb-1">Monetization & Paid Priority</h4>
            <p className="text-xs text-muted-foreground">
              Facilitating &quot;Skip the Line&quot; priority passes and Pre-Order Deposits through integrated
              secure payment gateways (Stripe & Chapa).
            </p>
          </div>

          <div className="rounded-xl border border-border/70 bg-surface/50 p-4">
            <h4 className="font-semibold text-foreground text-xs mb-1">Security & Fraud Prevention</h4>
            <p className="text-xs text-muted-foreground">
              Detecting fake referral spikes, bot attacks, and manipulated ranking entries using hashed
              IP signatures and rate limiting.
            </p>
          </div>
        </div>
      </LegalSectionCard>

      {/* ── Section 4: How We Share Information ── */}
      <LegalSectionCard
        id="how-we-share-information"
        number="04"
        title="How We Share Information"
        icon={<Share2 className="h-5 w-5 text-primary" />}
      >
        <p className="font-semibold text-foreground">
          We do not sell, rent, or trade your personal data to advertisers or data brokers under any circumstances.
        </p>

        <p>Data sharing is strictly confined to the following operational necessities:</p>

        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong className="text-foreground">Between Founders and their Participants:</strong> When a participant
            joins a creator&apos;s waitlist, their email, questionnaire answers, and referral tier status are accessible
            to that specific Founder via their WaitlistOS administrative dashboard.
          </li>
          <li>
            <strong className="text-foreground">Third-Party Service Infrastructure:</strong> We share data with verified
            infrastructure vendors solely to execute technical operations (such as cloud hosting, email delivery, file storage, and payments).
          </li>
          <li>
            <strong className="text-foreground">Legal & Regulatory Compliance:</strong> We may disclose information if
            compelled by a valid court order, government request, or applicable statutory obligation.
          </li>
        </ul>
      </LegalSectionCard>

      {/* ── Section 5: Third-Party Services ── */}
      <LegalSectionCard
        id="third-party-services"
        number="05"
        title="Third-Party Services"
        icon={<Globe className="h-5 w-5 text-primary" />}
        badge="Audited Integrations"
      >
        <p>
          The WaitlistOS application interfaces with reputable external service providers to deliver robust functionality:
        </p>

        <div className="space-y-3 pt-2">
          <div className="flex items-start gap-3 rounded-xl border border-border/80 bg-surface/50 p-3.5">
            <div className="mt-0.5 rounded-lg bg-primary/10 p-2 text-primary">
              <CreditCard className="h-4 w-4" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-semibold text-foreground">
                Payment Processors (Stripe & Chapa)
              </h4>
              <p className="text-xs text-muted-foreground">
                Process subscription payments and waitlist monetization transactions. All payment handling
                adheres to PCI-DSS standards governed by Stripe and Chapa&apos;s independent privacy notices.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-border/80 bg-surface/50 p-3.5">
            <div className="mt-0.5 rounded-lg bg-primary/10 p-2 text-primary">
              <Mail className="h-4 w-4" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-semibold text-foreground">
                Email Delivery (Resend / SMTP)
              </h4>
              <p className="text-xs text-muted-foreground">
                Used to dispatch transactional emails, email confirmations, access invitations, and password resets.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-border/80 bg-surface/50 p-3.5">
            <div className="mt-0.5 rounded-lg bg-primary/10 p-2 text-primary">
              <Database className="h-4 w-4" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-semibold text-foreground">
                Media & File Storage (Cloudinary)
              </h4>
              <p className="text-xs text-muted-foreground">
                Stores brand logos, uploaded company imagery, and campaign visual assets.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-border/80 bg-surface/50 p-3.5">
            <div className="mt-0.5 rounded-lg bg-primary/10 p-2 text-primary">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-semibold text-foreground">
                Identity & Single Sign-On (Google OAuth)
              </h4>
              <p className="text-xs text-muted-foreground">
                Provides optional federated login credentials for Founders wishing to sign in with their Google profile.
              </p>
            </div>
          </div>
        </div>
      </LegalSectionCard>

      {/* ── Section 6: Security & Data Retention ── */}
      <LegalSectionCard
        id="security-retention"
        number="06"
        title="Security & Data Retention"
        icon={<Lock className="h-5 w-5 text-primary" />}
      >
        <p>
          We employ industry-standard administrative, physical, and technical safeguards designed to protect personal
          data from accidental loss, unauthorized alteration, disclosure, or misuse.
        </p>

        <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm">
          <li>Strong cryptographic one-way hashing for user authentication passwords.</li>
          <li>HTTPS transmission encryption for all public and private API endpoints.</li>
          <li>Timed expiration and single-use invalidation for password reset and email verification tokens.</li>
          <li>Database relational cascades allowing comprehensive account and waitlist deletion.</li>
        </ul>

        <LegalCallout type="highlight" title="Data Retention Policy">
          We retain personal data for as long as an active account or waitlist exists, or as reasonably necessary
          to comply with tax, legal, and regulatory dispute obligations. When a Founder deletes a waitlist or account,
          associated participant records are removed or disassociated according to system deletion workflows.
        </LegalCallout>
      </LegalSectionCard>

      {/* ── Section 7: Your Privacy Rights ── */}
      <LegalSectionCard
        id="privacy-rights"
        number="07"
        title="Your Privacy Rights"
        icon={<UserCheck className="h-5 w-5 text-primary" />}
        badge="User Agency"
      >
        <p>
          Depending on your jurisdiction, you may have statutory rights regarding your personal information,
          including:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div className="rounded-xl border border-border bg-surface/60 p-3.5">
            <h4 className="font-semibold text-foreground text-xs mb-1">Access & Portability</h4>
            <p className="text-xs text-muted-foreground">
              Request a copy of the personal data we hold concerning your account.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-surface/60 p-3.5">
            <h4 className="font-semibold text-foreground text-xs mb-1">Correction & Rectification</h4>
            <p className="text-xs text-muted-foreground">
              Update incomplete or inaccurate contact or company data through your profile settings.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-surface/60 p-3.5">
            <h4 className="font-semibold text-foreground text-xs mb-1">Erasure (&quot;Right to be Forgotten&quot;)</h4>
            <p className="text-xs text-muted-foreground">
              Request the permanent deletion of your account and associated waitlist data.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-surface/60 p-3.5">
            <h4 className="font-semibold text-foreground text-xs mb-1">Withdrawal of Consent</h4>
            <p className="text-xs text-muted-foreground">
              Unsubscribe from non-essential waitlist status notifications at any time.
            </p>
          </div>
        </div>

        <p className="text-xs sm:text-sm pt-2">
          <strong>Participants:</strong> Because WaitlistOS processes participant submissions on behalf of Founders,
          requests for deletion or correction of answers submitted to a creator&apos;s waitlist should be directed
          to that Founder first.
        </p>
      </LegalSectionCard>

      {/* ── Section 8: Children's Privacy ── */}
      <LegalSectionCard
        id="children-privacy"
        number="08"
        title="Children's Privacy"
        icon={<ShieldCheck className="h-5 w-5 text-primary" />}
      >
        <p>
          Our Service is intended for businesses, entrepreneurs, and adults over the age of majority.
          We do not knowingly collect or solicit personal data from children under the age of 13
          (or under 16 where required by local legislation).
        </p>
        <p>
          If we become aware that a child has provided us with personal information without verified parental consent,
          we will take prompt measures to delete such records from our databases.
        </p>
      </LegalSectionCard>

      {/* ── Section 9: International Data Transfers ── */}
      <LegalSectionCard
        id="international-transfers"
        number="09"
        title="International Data Transfers"
        icon={<Globe className="h-5 w-5 text-primary" />}
      >
        <p>
          WaitlistOS provides a global platform. As such, information collected through our Service may be transferred
          to, stored, and processed in cloud data centers located outside of your state, province, or country of residence.
        </p>
        <p>
          We ensure that cross-border service providers maintain adequate contractual and technical data protection
          standards consistent with standard data protection principles.
        </p>
      </LegalSectionCard>

      {/* ── Section 10: Changes to This Policy ── */}
      <LegalSectionCard
        id="policy-changes"
        number="10"
        title="Changes to This Privacy Policy"
        icon={<RefreshCw className="h-5 w-5 text-primary" />}
      >
        <p>
          We may update this Privacy Policy periodically to reflect changes in our legal obligations, product capabilities,
          or operational practices.
        </p>
        <p>
          When significant revisions occur, we will update the &quot;Effective Date&quot; at the top of this document
          and provide noticeable announcement banners on the platform or direct email notifications to active Founders.
        </p>
      </LegalSectionCard>

      {/* ── Section 11: Contact Us ── */}
      <LegalSectionCard
        id="contact-us"
        number="11"
        title="Contact Us"
        icon={<Mail className="h-5 w-5 text-primary" />}
        badge="Direct Support"
      >
        <p>
          If you have questions, feedback, or data privacy requests regarding this policy or our data practices,
          please reach out directly to our dedicated privacy contact:
        </p>

        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 mt-3 space-y-2">
          <div className="font-semibold text-foreground text-sm">
            WaitlistOS Privacy & Compliance Office
          </div>
          <div className="text-xs text-muted-foreground">
            Operating Entity: <span className="font-mono text-foreground font-medium">[LEGAL ENTITY NAME]</span>
          </div>
          <div className="text-xs text-muted-foreground">
            Direct Privacy Inquiries:{" "}
            <a
              href={`mailto:${privacyEmail}`}
              className="font-mono font-medium text-primary hover:underline"
            >
              {privacyEmail}
            </a>
          </div>
        </div>
      </LegalSectionCard>
    </LegalPageShell>
  );
}
