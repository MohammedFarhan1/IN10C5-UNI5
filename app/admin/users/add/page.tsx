import { AdminUserForm } from "@/components/forms/admin-user-form";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { createAdminUserAction } from "@/lib/actions/admin-users";

export default function AdminAddUserPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Admin user management"
        title="Create user"
        description="Create a customer, seller, or admin account directly from the back office."
      />
      <Card>
        <AdminUserForm action={createAdminUserAction} mode="create" />
      </Card>
    </div>
  );
}
