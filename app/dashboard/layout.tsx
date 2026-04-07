import { DashboardShell } from "@/components/layout/dashboard-shell";
import { requireRole } from "@/lib/auth";

const sellerNav = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/products", label: "Products" },
  { href: "/dashboard/products/add", label: "Add product" },
  { href: "/dashboard/products/bulk-upload", label: "Bulk upload" },
  { href: "/dashboard/orders", label: "Orders" }
];

export default async function SellerLayout({
  children
}: {
  children: React.ReactNode;
}) {
  await requireRole(["seller"]);

  return (
    <DashboardShell items={sellerNav} title="Seller panel">
      {children}
    </DashboardShell>
  );
}
