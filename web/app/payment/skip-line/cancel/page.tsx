import { Metadata } from "next";
import { Suspense } from "react";
import SkipLineCancelContent from "./cancel-content";

export const metadata: Metadata = {
  title: "Payment Cancelled | Getlist",
  description: "Your Skip the Line payment was cancelled",
};

export default function SkipLineCancelPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SkipLineCancelContent />
    </Suspense>
  );
}