import { PageHeader } from "@/components/ui/page-header";
import { ReportCards } from "@/components/reports/report-cards";

export default function ReportsPage() {
  return (
    <>
      <PageHeader
        title="Reports"
        description="Document trends, popular templates, review times, and outstanding work."
      />
      <ReportCards />
    </>
  );
}
