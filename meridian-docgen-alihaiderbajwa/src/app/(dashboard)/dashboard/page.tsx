import { PageHeader } from "@/components/ui/page-header";
import { MetricCards } from "@/components/dashboard/metric-cards";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { Charts } from "@/components/dashboard/charts";
import { QuickActions } from "@/components/dashboard/quick-actions";

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Dashboard"
        description="A live view of document production, review work, and recent activity."
      />
      <MetricCards />
      <QuickActions />
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
