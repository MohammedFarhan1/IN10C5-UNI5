import { DashboardShell } from "@/components/layout/dashboard-shell";
import { requireRole } from "@/lib/auth";

const adminNav = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/sellers", label: "Seller approvals" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/orders", label: "Orders" }
];

export default async function AdminLayout({
  children
}: {
  children: React.ReactNode;
}) {
  await requireRole(["admin"]);

  return (
    <DashboardShell items={adminNav} title="Admin panel">
      {children}
    </DashboardShell>
  );
}
