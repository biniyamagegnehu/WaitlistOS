import { redirect } from "next/navigation";
import { routes } from "@/lib/routes";

export default function SessionsPage() {
  redirect(routes.settingsTab("sessions"));
}
