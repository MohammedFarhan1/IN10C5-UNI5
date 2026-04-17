import { DashboardShell } from "@/components/layout/dashboard-shell";
import { requireRole } from "@/lib/auth";

export default async function SellerLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const { profile } = await requireRole(["seller"]);
  const sellerNav = [
    { href: "/dashboard", label: "Overview" },
    ...(profile.account_status === "approved"
      ? [
          { href: "/dashboard/products", label: "Products" },
          { href: "/dashboard/products/add", label: "Add product" },
          { href: "/dashboard/products/bulk-upload", label: "Bulk upload" }
        ]
      : []),
    { href: "/dashboard/orders", label: "Orders" }
  ];

  return (
    <DashboardShell items={sellerNav} title="Seller panel">
      {children}
    </DashboardShell>
  );
}
