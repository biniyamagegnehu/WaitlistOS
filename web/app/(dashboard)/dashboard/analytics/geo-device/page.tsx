import { PageContainer } from "@/components/patterns/page-container";
import { PageHeader } from "@/components/patterns/page-header";
import { AnalyticsWorkspaceFeature } from "@/components/analytics/AnalyticsWorkspaceFeature";

export default function Page() {
  return (
    <PageContainer>
      <PageHeader
        title="Geo & Device"
        description="Insights for the selected waitlist or aggregated insights across all your waitlists."
        breadcrumbs={[
          { label: "Analytics" },
          { label: "Geo & Device" },
        ]}
      />
      <AnalyticsWorkspaceFeature feature="geo" />
    </PageContainer>
  );
}
