export interface Waitlist {
  id: string;
  founderId: string;
  name: string;
  slug: string;
  createdAt: string;
}

export interface CreateWaitlistInput {
  founderId: string;
  name: string;
  slug: string;
}
