import { PageHeader } from "@/components/ui/page-header";
import { StaffList } from "@/components/staff/staff-list";

export default function StaffPage() {
  return (
    <>
      <PageHeader
        title="Staff"
        description="Staff directory, roles, and permissions."
      />
      <StaffList />
    </>
  );
}
