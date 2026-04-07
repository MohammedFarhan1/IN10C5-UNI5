import { notFound } from "next/navigation";
import { AdminUserForm } from "@/components/forms/admin-user-form";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { getAdminUserById } from "@/lib/data";
import { updateAdminUserAction } from "@/lib/actions/admin-users";

type AdminEditUserPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminEditUserPage({
  params
}: AdminEditUserPageProps) {
  const { id } = await params;
  const user = await getAdminUserById(id);

  if (!user) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Admin user management"
        title="Edit user"
        description="Update the user email, role, and optionally reset their password."
      />
      <Card>
        <AdminUserForm action={updateAdminUserAction} mode="edit" user={user} />
      </Card>
    </div>
  );
}
