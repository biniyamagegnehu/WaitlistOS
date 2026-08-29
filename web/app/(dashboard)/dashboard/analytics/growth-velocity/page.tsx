import { PageContainer } from "@/components/patterns/page-container";
import { PageHeader } from "@/components/patterns/page-header";
import { AnalyticsWorkspaceFeature } from "@/components/analytics/AnalyticsWorkspaceFeature";

export default function Page() {
  return (
    <PageContainer>
      <PageHeader
        title="Growth Velocity"
        description="Insights for the selected waitlist or aggregated insights across all your waitlists."
        breadcrumbs={[
          { label: "Analytics" },
          { label: "Growth Velocity" },
        ]}
      />
      <AnalyticsWorkspaceFeature feature="growth" />
    </PageContainer>
  );
}
