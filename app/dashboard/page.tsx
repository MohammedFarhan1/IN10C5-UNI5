import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import {
  getMarketplaceAvailability,
  getMarketplaceSellerOrders,
  getMarketplaceSellerProducts
} from "@/lib/marketplace";
import { requireRole } from "@/lib/auth";

export default async function SellerDashboardPage() {
  const { profile } = await requireRole(["seller"]);
  const marketplaceStatus = await getMarketplaceAvailability();
  const [products, orders] = marketplaceStatus.available
    ? await Promise.all([
        getMarketplaceSellerProducts(profile.id),
        getMarketplaceSellerOrders(profile.id)
      ])
    : [[], []];

  const totalStock = products.reduce(
    (sum, product) =>
      sum +
      (product.variants ?? []).reduce(
        (variantSum, variant) =>
          variantSum +
          (variant.listings ?? []).reduce(
            (listingSum, listing) => listingSum + listing.available_stock,
            0
          ),
        0
      ),
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
        description="Create catalog products, add variants, manage seller listings, and monitor every order from one place."
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
          <p className="text-sm text-slate-500">Available stock</p>
          <p className="mt-3 text-4xl font-semibold text-brand-ink">{totalStock}</p>
          <p className="mt-2 text-xs uppercase tracking-[0.24em] text-slate-500">across active listings</p>
        </Card>
      </div>

      {!marketplaceStatus.available ? (
        <Card>
          <div className="space-y-3">
            <p className="text-lg font-semibold text-brand-ink">Marketplace setup needed</p>
            <p className="text-sm text-slate-600">{marketplaceStatus.message}</p>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
