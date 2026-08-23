import { Metadata } from "next";
import SkipLineCancelContent from "./cancel-content";

export const metadata: Metadata = {
  title: "Payment Cancelled | WaitlistOS",
  description: "Your Skip the Line payment was cancelled",
};

export default function SkipLineCancelPage() {
  return <SkipLineCancelContent />;
}