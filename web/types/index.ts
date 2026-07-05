export * from "./auth";
export * from "./waitlist";

/** @deprecated Use WaitlistSummary from ./waitlist instead */
export interface Waitlist {
  id: string;
  founderId: string;
  name: string;
  slug: string;
  createdAt: string;
}
