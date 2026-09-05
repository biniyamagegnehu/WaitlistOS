import { Metadata } from "next";
import { Suspense } from "react";
import SkipLineSuccessContent from "./success-content";

export const metadata: Metadata = {
  title: "Payment Successful | Getlist",
  description: "Your Skip the Line payment was successful",
};

export default function SkipLineSuccessPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SkipLineSuccessContent />
    </Suspense>
  );
}