"use client";

import * as React from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface FAQItemProps {
  question: string;
  answer: string;
}

function FAQItem({ question, answer }: FAQItemProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="rounded-lg border border-border bg-background">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between p-4 text-left"
      >
        <span className="font-medium text-foreground">{question}</span>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        )}
      </button>
      {isOpen && (
        <div className="border-t border-border p-4 text-muted-foreground">
          {answer}
        </div>
      )}
    </div>
  );
}

interface FAQAccordionProps {
  faqs: Array<{ q: string; a: string }>;
}

export function FAQAccordion({ faqs }: FAQAccordionProps) {
  return (
    <div className="space-y-4">
      {faqs.map((faq, i) => (
        <FAQItem key={i} question={faq.q} answer={faq.a} />
      ))}
    </div>
  );
}
