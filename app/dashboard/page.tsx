import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageHeader } from "@/components/layout/page-header";
import {
  getMarketplaceAvailability,
  getMarketplaceSellerOrders,
  getMarketplaceSellerProducts
} from "@/lib/marketplace";
import { isSellerApproved, requireRole } from "@/lib/auth";

export default async function SellerDashboardPage() {
  const { profile } = await requireRole(["seller"]);
  const isApproved = isSellerApproved(profile);
  const marketplaceStatus = await getMarketplaceAvailability();
  const [products, orders] = marketplaceStatus.available && isApproved
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
        action={isApproved ? (
          <Link href="/dashboard/products/add">
            <Button>Add new product</Button>
          </Link>
        ) : undefined}
        description="Create catalog products, add variants, manage seller listings, and monitor every order from one place."
        eyebrow="Seller workspace"
        title="Dashboard overview"
      />

      <Card className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-slate-500">Seller verification status</p>
            <div className="mt-2">
              <StatusBadge value={profile.account_status} />
            </div>
          </div>
          {profile.business_name ? (
            <div className="text-sm text-slate-600 md:text-right">
              <p className="font-semibold text-brand-ink">{profile.business_name}</p>
              <p>{profile.spoc_name || profile.full_name || profile.email}</p>
            </div>
          ) : null}
        </div>

        {profile.account_status === "pending" ? (
          <div className="rounded-[20px] border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900">
            Your account is under review. Product management will unlock after the admin approves
            your seller profile.
          </div>
        ) : null}

        {profile.account_status === "rejected" ? (
          <div className="rounded-[20px] border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-800">
            Your seller application was rejected. Please contact the admin team to review the
            submitted business details and documents.
          </div>
        ) : null}

        {profile.account_status === "approved" ? (
          <p className="text-sm text-slate-600">
            Your seller account is approved. Product creation, variant management, and listing
            updates are active.
          </p>
        ) : null}
      </Card>

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

      {!marketplaceStatus.available && isApproved ? (
        <Card>
          <div className="space-y-3">
            <p className="text-lg font-semibold text-brand-ink">Marketplace setup needed</p>
            <p className="text-sm text-slate-600">{marketplaceStatus.message}</p>
          </div>
        </Card>
      ) : null}

      {!isApproved ? (
        <Card>
          <div className="space-y-3">
            <p className="text-lg font-semibold text-brand-ink">Verification checklist</p>
            <div className="grid gap-4 text-sm text-slate-600 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="font-medium text-brand-ink">Business details</p>
                <p className="mt-2">Business name: {profile.business_name || "Not submitted"}</p>
                <p>SPOC: {profile.spoc_name || profile.full_name || "Not submitted"}</p>
                <p>Mobile: {profile.mobile_number || "Not submitted"}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="font-medium text-brand-ink">Compliance details</p>
                <p className="mt-2">CIN: {profile.cin || "Not submitted"}</p>
                <p>GST: {profile.gst || "Not submitted"}</p>
                <p>
                  Documents: {profile.trademark_url || profile.document_url ? "Submitted" : "Pending"}
                </p>
              </div>
            </div>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
