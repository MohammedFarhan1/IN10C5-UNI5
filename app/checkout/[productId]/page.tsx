import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckoutForm } from "@/components/forms/checkout-form";
import { createOrderAction } from "@/lib/actions/orders";
import { requireRole } from "@/lib/auth";
import { getMarketplaceProductById } from "@/lib/marketplace";
import { formatCurrency, formatVariantLabel } from "@/lib/utils";

type CheckoutPageProps = {
  params: Promise<{ productId: string }>;
  searchParams?: Promise<{ listing?: string }>;
};

export default async function CheckoutPage({ params, searchParams }: CheckoutPageProps) {
  await requireRole(["customer"]);
  const { productId } = await params;
  const query = searchParams ? await searchParams : undefined;
  const listingId = query?.listing?.trim() ?? "";
  const product = await getMarketplaceProductById(productId);

  if (!product) {
    notFound();
  }

  const selectedVariant = (product.variants ?? []).find((variant) =>
    (variant.listings ?? []).some((listing) => listing.id === listingId)
  );
  const selectedListing = selectedVariant?.listings?.find((listing) => listing.id === listingId) ?? null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 md:px-6 lg:px-8">
      <div className="grid gap-6 md:grid-cols-[1.1fr_420px]">
        <Card className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-pine">Checkout</p>
          <h1 className="text-3xl font-semibold text-brand-ink">Confirm your marketplace order</h1>
          <p className="text-sm leading-7 text-slate-600">
            Orders are placed against a specific variant and seller listing so pricing, SKU, stock, and tracking stay traceable.
          </p>

          <div className="rounded-[24px] bg-slate-50 p-4">
            <p className="text-sm font-medium text-brand-ink">{product.name}</p>
            <p className="mt-2 text-sm text-slate-600">{product.description}</p>
          </div>
        </Card>

        <Card className="space-y-5">
          {selectedListing && selectedVariant ? (
            <>
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Selected variant</p>
                <p className="mt-2 text-lg font-semibold text-brand-ink">
                  {formatVariantLabel(selectedVariant)}
                </p>
                <p className="mt-1 text-sm text-slate-500">{selectedListing.seller_sku}</p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Price</p>
                <p className="mt-2 text-3xl font-semibold text-brand-pine">
                  {formatCurrency(selectedListing.price)}
                </p>
                <p className="mt-1 text-xs text-slate-500">MRP {formatCurrency(selectedListing.mrp)}</p>
              </div>

              {selectedListing.available_stock > 0 ? (
                <CheckoutForm
                  action={createOrderAction}
                  availableStock={selectedListing.available_stock}
                  listingId={selectedListing.id}
                />
              ) : (
                <Button className="w-full" disabled>
                  This listing is out of stock
                </Button>
              )}
            </>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                Pick variant options and a seller on the product page before buying.
              </p>
              <Link href={`/product/${product.id}`}>
                <Button className="w-full">Back to product</Button>
              </Link>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

