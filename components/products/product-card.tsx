import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProductWithDetails } from "@/types";
import { formatCurrency, getStockSummary } from "@/lib/utils";

export function ProductCard({ product }: { product: ProductWithDetails }) {
  const availableUnits =
    product.units?.filter((unit) => unit.status === "available").length ?? 0;

  return (
    <Card className="flex flex-col overflow-hidden">
      {/* Image Section */}
      <div className="relative h-48 overflow-hidden bg-slate-100 sm:h-56">
        <img
          alt={product.name}
          className="h-full w-full object-cover"
          src={
            product.image_url ||
            "https://images.unsplash.com/photo-1511556820780-d912e42b4980?auto=format&fit=crop&w=1200&q=80"
          }
        />
        <div className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-brand-pine">
          {getStockSummary(availableUnits, product.total_units)}
        </div>
      </div>

      {/* Content Section */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        {/* Product Name */}
        <div>
          <h3 className="line-clamp-2 text-sm font-semibold leading-tight text-brand-ink sm:text-base">
            {product.name}
          </h3>
          {product.custom_product_id ? (
            <p className="mt-1 text-xs uppercase tracking-[0.24em] text-slate-500">
              SKU: {product.custom_product_id}
            </p>
          ) : null}
        </div>

        {/* Price and Categories */}
        <div className="flex flex-col gap-2">
          <p className="text-base font-bold text-brand-pine">
            {formatCurrency(product.price)}
          </p>
          {product.categories && product.categories.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {product.categories.slice(0, 2).map((category) => (
                <span
                  key={category.id}
                  className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700"
                >
                  {category.name}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* View Product Button */}
        <div className="mt-auto pt-2">
          <Link className="block" href={`/product/${product.id}`}>
            <Button className="w-full py-2 text-sm">View product</Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}
