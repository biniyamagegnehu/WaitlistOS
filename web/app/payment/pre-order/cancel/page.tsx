import { Metadata } from "next";
import { Suspense } from "react";
import PreOrderCancelContent from "./cancel-content";

export const metadata: Metadata = {
  title: "Deposit Cancelled | WaitlistOS",
  description: "Your pre-order deposit was cancelled",
};

export default function PreOrderCancelPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PreOrderCancelContent />
    </Suspense>
  );
}
