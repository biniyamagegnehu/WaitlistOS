import { PageContainer } from "@/components/patterns/page-container";
import { PageHeader } from "@/components/patterns/page-header";
import { AnalyticsWorkspaceFeature } from "@/components/analytics/AnalyticsWorkspaceFeature";

export default function Page() {
  return (
    <PageContainer>
      <PageHeader
        title="Conversion Funnel"
        description="See where visitors drop off before signing up and sharing."
        breadcrumbs={[
          { label: "Analytics" },
          { label: "Conversion Funnel" },
        ]}
      />
      <AnalyticsWorkspaceFeature feature="funnel" />
    </PageContainer>
  );
}
