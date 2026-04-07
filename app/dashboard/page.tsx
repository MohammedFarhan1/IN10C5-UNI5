import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { getSellerOrders, getSellerProducts } from "@/lib/data";
import { requireRole } from "@/lib/auth";

export default async function SellerDashboardPage() {
  const { profile } = await requireRole(["seller"]);
  const [products, orders] = await Promise.all([
    getSellerProducts(profile.id),
    getSellerOrders(profile.id)
  ]);

  const totalUnits = products.reduce((sum, product) => sum + product.total_units, 0);
  const availableUnits = products.reduce(
    (sum, product) => sum + (product.units?.filter((unit) => unit.status === "available").length ?? 0),
    0
  );

  return (
    <div className="space-y-8">
      <PageHeader
        action={
          <Link href="/dashboard/products/add">
            <Button>Add new product</Button>
          </Link>
        }
        description="Create products, generate unit identities, and monitor every sale from one place."
        eyebrow="Seller workspace"
        title="Dashboard overview"
      />

      <div className="grid gap-5 md:grid-cols-3">
        <Card>
          <p className="text-sm text-slate-500">Products</p>
          <p className="mt-3 text-4xl font-semibold text-brand-ink">{products.length}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Orders</p>
          <p className="mt-3 text-4xl font-semibold text-brand-ink">{orders.length}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Available units</p>
          <p className="mt-3 text-4xl font-semibold text-brand-ink">{availableUnits}</p>
          <p className="mt-2 text-xs uppercase tracking-[0.24em] text-slate-500">of {totalUnits} total</p>
        </Card>
      </div>
    </div>
  );
}