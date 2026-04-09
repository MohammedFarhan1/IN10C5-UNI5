import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MarketplaceProductWithDetails } from "@/types";
import { formatCurrency } from "@/lib/utils";

export function ProductCard({ product }: { product: MarketplaceProductWithDetails }) {
  const listings = (product.variants ?? []).flatMap((variant) => variant.listings ?? []);
  const availableStock = listings.reduce((sum, listing) => sum + listing.available_stock, 0);
  const startingPrice = listings.length > 0 ? Math.min(...listings.map((listing) => listing.price)) : 0;

  return (
    <Card className="flex flex-col overflow-hidden">
      <div className="relative h-48 overflow-hidden bg-slate-100 sm:h-56">
        <img
          alt={product.name}
          className="h-full w-full object-cover"
          src={
            product.primary_image_url ||
            "https://images.unsplash.com/photo-1511556820780-d912e42b4980?auto=format&fit=crop&w=1200&q=80"
          }
        />
        <div className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-brand-pine">
          {availableStock > 0 ? `${availableStock} in stock` : "Sold out"}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3 className="line-clamp-2 text-sm font-semibold leading-tight text-brand-ink sm:text-base">
            {product.name}
          </h3>
          <p className="mt-1 text-xs font-medium text-brand-pine">{product.brand}</p>
          {product.custom_product_id ? (
            <p className="mt-1 text-xs uppercase tracking-[0.24em] text-slate-500">
              {product.custom_product_id}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-base font-bold text-brand-pine">
            {startingPrice > 0 ? `From ${formatCurrency(startingPrice)}` : "No active listings"}
          </p>
          {product.category ? (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700 w-fit">
              {product.category.name}
            </span>
          ) : null}
        </div>

        <div className="mt-auto pt-2">
          <Link className="block" href={`/product/${product.id}`}>
            <Button className="w-full py-2 text-sm">View product</Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}
