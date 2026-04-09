import Link from "next/link";
import { notFound } from "next/navigation";
import { MarketplaceProductEditForm } from "@/components/forms/marketplace-product-edit-form";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth";
import { getCategories } from "@/lib/data";
import { updateMarketplaceProductAction } from "@/lib/actions/products";
import { getMarketplaceSellerProductById } from "@/lib/marketplace";
import { formatCurrency, formatDate, getProductDetailUrl, getQrCodeUrl } from "@/lib/utils";

type SellerEditProductPageProps = {
  params: Promise<{ id: string }>;
};

function getStartingPrice(product: NonNullable<Awaited<ReturnType<typeof getMarketplaceSellerProductById>>>) {
  const prices = (product.variants ?? []).flatMap((variant) =>
    (variant.listings ?? []).map((listing) => listing.price)
  );

  return prices.length > 0 ? Math.min(...prices) : null;
}

function getTotalStock(product: NonNullable<Awaited<ReturnType<typeof getMarketplaceSellerProductById>>>) {
  return (product.variants ?? []).reduce(
    (sum, variant) =>
      sum + (variant.listings ?? []).reduce((listingSum, listing) => listingSum + listing.available_stock, 0),
    0
  );
}

export default async function SellerEditProductPage({
  params
}: SellerEditProductPageProps) {
  const { profile } = await requireRole(["seller"]);
  const { id } = await params;
  const [product, categories] = await Promise.all([
    getMarketplaceSellerProductById(id, profile.id),
    getCategories()
  ]);

  if (!product) {
    notFound();
  }

  const startingPrice = getStartingPrice(product);
  const totalStock = getTotalStock(product);
  const productUrl = getProductDetailUrl(product.id);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Inventory"
        title="Edit product"
        description="Update shared catalog details for this product. Variant and listing level stock, SKU, and pricing stay attached to each sellable listing."
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_360px]">
        <Card>
          <MarketplaceProductEditForm
            action={updateMarketplaceProductAction}
            categories={categories}
            product={product}
          />
        </Card>

        <Card className="space-y-5">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-brand-ink">Product snapshot</h2>
            <p className="text-sm text-slate-600">
              Quick summary of this catalog product and its active seller listings.
            </p>
          </div>

          <div className="grid gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Brand</p>
              <p className="mt-1 font-semibold text-brand-ink">{product.brand}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Variants</p>
              <p className="mt-1 font-semibold text-brand-ink">{product.variants?.length ?? 0}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Starting price</p>
              <p className="mt-1 font-semibold text-brand-ink">
                {startingPrice == null ? "No listings yet" : formatCurrency(startingPrice)}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Available stock</p>
              <p className="mt-1 font-semibold text-brand-ink">{totalStock}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Created</p>
              <p className="mt-1 font-semibold text-brand-ink">{formatDate(product.created_at)}</p>
            </div>
            <Link href={`/product/${product.id}`}>
              <Button className="w-full" variant="secondary">Open product page</Button>
            </Link>
            <div className="flex flex-col items-center gap-2 rounded-lg border border-white bg-white/80 px-3 py-3">
              <img
                alt="Product QR code"
                className="h-[120px] w-[120px] rounded-md border border-slate-200 bg-white object-contain"
                height={120}
                loading="lazy"
                src={getQrCodeUrl(productUrl, 120)}
                width={120}
              />
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                Scan to view product
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-dashed border-slate-300 bg-white px-4 py-3 text-xs text-slate-500">
            Need to change seller SKU, price, MRP, or stock per variant? Those values stay at listing level and can be extended in a follow-up edit flow.
          </div>
        </Card>
      </div>
    </div>
  );
}
