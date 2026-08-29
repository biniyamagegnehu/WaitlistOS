import { PageContainer } from "@/components/patterns/page-container";
import { PageHeader } from "@/components/patterns/page-header";
import { AnalyticsWorkspaceFeature } from "@/components/analytics/AnalyticsWorkspaceFeature";

export default function Page() {
  return (
    <PageContainer>
      <PageHeader
        title="Source Attribution"
        description="Insights for the selected waitlist or aggregated insights across all your waitlists."
        breadcrumbs={[
          { label: "Analytics" },
          { label: "Source Attribution" },
        ]}
      />
      <AnalyticsWorkspaceFeature feature="source" />
    </PageContainer>
  );
}
