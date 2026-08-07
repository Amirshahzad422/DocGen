import { PageHeader } from "@/components/ui/page-header";
import { MetricCards } from "@/components/dashboard/metric-cards";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { Charts } from "@/components/dashboard/charts";

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Live numbers from the database."
      />
      <MetricCards />
      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <ActivityFeed />
        </div>
        <div className="lg:col-span-3">
          <Charts />
        </div>
      </div>
    </>
  );
}
