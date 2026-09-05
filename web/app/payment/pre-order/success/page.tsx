import { Metadata } from "next";
import { Suspense } from "react";
import PreOrderSuccessContent from "./success-content";

export const metadata: Metadata = {
  title: "Deposit Successful | Getlist",
  description: "Your pre-order deposit was successful",
};

export default function PreOrderSuccessPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PreOrderSuccessContent />
    </Suspense>
  );
}
