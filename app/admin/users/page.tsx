import Link from "next/link";
import { deleteAdminUserAction } from "@/lib/actions/admin-users";
import { Button } from "@/components/ui/button";
import { Table } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageHeader } from "@/components/layout/page-header";
import { getCurrentSession } from "@/lib/auth";
import { getAdminUsers } from "@/lib/data";
import { formatDate } from "@/lib/utils";

export default async function AdminUsersPage() {
  const [users, session] = await Promise.all([getAdminUsers(), getCurrentSession()]);
  const currentUserId = session.profile?.id;

  return (
    <div className="space-y-8">
      <PageHeader
        action={
          <Link href="/admin/users/add">
            <Button>Create user</Button>
          </Link>
        }
        description="All registered buyer, seller, and admin accounts stored in the application profile table."
        eyebrow="User directory"
        title="Users"
      />
      <Table headers={["Email", "Role", "Created", "Actions"]}>
        {users.map((user) => (
          <tr key={user.id}>
            <td className="px-5 py-4 font-medium text-brand-ink">{user.email}</td>
            <td className="px-5 py-4"><StatusBadge value={user.role} /></td>
            <td className="px-5 py-4 text-slate-600">{formatDate(user.created_at)}</td>
            <td className="px-5 py-4">
              <div className="flex flex-wrap gap-2">
                <Link href={`/admin/users/${user.id}/edit`}>
                  <Button variant="secondary">Edit</Button>
                </Link>
                {user.id !== currentUserId ? (
                  <form action={deleteAdminUserAction}>
                    <input name="userId" type="hidden" value={user.id} />
                    <Button type="submit" variant="danger">
                      Delete
                    </Button>
                  </form>
                ) : (
                  <span className="rounded-full bg-slate-100 px-3 py-2 text-xs text-slate-500">
                    Current admin
                  </span>
                )}
              </div>
            </td>
          </tr>
        ))}
      </Table>
    </div>
  );
}
