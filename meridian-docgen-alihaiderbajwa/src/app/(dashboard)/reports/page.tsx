import { PageHeader } from "@/components/ui/page-header";
import { ReportCards } from "@/components/reports/report-cards";

export default function ReportsPage() {
  return (
    <>
      <PageHeader
        title="Reports"
        description="Live aggregates: per-month trends, top templates, review times, and queue."
      />
      <ReportCards />
    </>
  );
}
