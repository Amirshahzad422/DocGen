import { PageHeader } from "@/components/ui/page-header";
import { QueueList } from "@/components/review/queue-list";

export default function ReviewPage() {
  return (
    <>
      <PageHeader
        title="Review Queue"
        description="Drafts awaiting attorney review."
      />
      <QueueList />
    </>
  );
}
