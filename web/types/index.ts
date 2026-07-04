export * from "./auth";

export interface Waitlist {
  id: string;
  founderId: string;
  name: string;
  slug: string;
  createdAt: string;
}

export interface CreateWaitlistInput {
  name: string;
  slug: string;
}
