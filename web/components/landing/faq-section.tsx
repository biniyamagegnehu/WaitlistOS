"use client";

import { SlideUp } from "./scroll-animations";
import { FAQAccordion } from "./faq-accordion";

export function FAQSection() {
  return (
    <section className="bg-surface py-16 sm:py-24" id="faq">
      <div className="mx-auto max-w-3xl px-4">
        <SlideUp>
          <div className="text-center">
            <h2 className="mb-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-muted-foreground">
              Everything you need to know about WaitlistOS
            </p>
          </div>
        </SlideUp>

        <div className="mt-12">
          <FAQAccordion
            faqs={[
              {
                q: "What is WaitlistOS?",
                a: "WaitlistOS is a platform that helps founders create branded waitlists, reward referrals, and build launch communities before their product launches.",
              },
              {
                q: "How do referral waitlists work?",
                a: "Each participant gets a unique referral link. When they share it and friends sign up, they move up the waitlist and unlock rewards.",
              },
              {
                q: "Can I customize branding?",
                a: "Yes! You can customize your waitlist page with your logo, colors, messaging, and more to match your brand.",
              },
              {
                q: "Can I embed it on my website?",
                a: "Absolutely. Add a single script to any website to embed your waitlist widget seamlessly.",
              },
              {
                q: "How does Open The Gates work?",
                a: "When you're ready to launch, select participants from your waitlist and send batch invitations to onboard them to your product.",
              },
              {
                q: "Do you support team accounts?",
                a: "Yes, team accounts are available on the Pro plan, allowing multiple team members to manage waitlists.",
              },
            ]}
          />
        </div>
      </div>
    </section>
  );
}
