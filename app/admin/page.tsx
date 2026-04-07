import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { getAdminSummary } from "@/lib/data";

export default async function AdminDashboardPage() {
  const summary = await getAdminSummary();

  return (
    <div className="space-y-8">
      <PageHeader
        description="A lightweight admin view across the marketplace, seller inventory, and buyer orders."
        eyebrow="Admin workspace"
        title="Platform overview"
      />

      <div className="grid gap-5 md:grid-cols-3">
        <Card>
          <p className="text-sm text-slate-500">Users</p>
          <p className="mt-3 text-4xl font-semibold text-brand-ink">{summary.userCount}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Products</p>
          <p className="mt-3 text-4xl font-semibold text-brand-ink">{summary.productCount}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Orders</p>
          <p className="mt-3 text-4xl font-semibold text-brand-ink">{summary.orderCount}</p>
        </Card>
      </div>
    </div>
  );
}