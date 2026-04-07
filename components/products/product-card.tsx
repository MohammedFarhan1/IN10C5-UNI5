import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProductWithDetails } from "@/types";
import { clampText, formatCurrency, getStockSummary } from "@/lib/utils";

export function ProductCard({ product }: { product: ProductWithDetails }) {
  const availableUnits =
    product.units?.filter((unit) => unit.status === "available").length ?? 0;

  return (
    <Card className="flex h-full flex-col overflow-hidden p-0">
      <div className="relative aspect-square overflow-hidden sm:aspect-[4/3]">
        <img
          alt={product.name}
          className="h-full w-full object-cover"
          src={
            product.image_url ||
            "https://images.unsplash.com/photo-1511556820780-d912e42b4980?auto=format&fit=crop&w=1200&q=80"
          }
        />
        <div className="absolute left-2 top-2 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold text-brand-pine sm:left-4 sm:top-4 sm:px-3 sm:text-xs">
          {getStockSummary(availableUnits, product.total_units)}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-3 sm:p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="min-w-0">
            <p className="truncate text-[10px] uppercase tracking-[0.18em] text-slate-500 sm:text-xs sm:tracking-[0.24em]">
              {product.seller?.email ?? "Marketplace seller"}
            </p>
            <h3 className="mt-1.5 line-clamp-2 text-base font-semibold leading-tight text-brand-ink sm:mt-2 sm:text-xl">
              {product.name}
            </h3>
          </div>
          <p className="text-base font-semibold text-brand-pine sm:shrink-0 sm:text-lg">
            {formatCurrency(product.price)}
          </p>
        </div>

        <p className="mt-2 hidden flex-1 text-xs leading-5 text-slate-600 sm:mt-3 sm:block sm:text-sm sm:leading-6">
          {clampText(product.description)}
        </p>

        <div className="mt-4 flex flex-col gap-2 sm:mt-5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <div className="hidden text-[10px] uppercase tracking-[0.18em] text-slate-500 sm:block sm:text-xs sm:tracking-[0.24em]">
            Each unit is individually tracked
          </div>
          <Link className="w-full sm:w-auto" href={`/product/${product.id}`}>
            <Button className="w-full px-3 py-2 text-xs sm:w-auto sm:text-sm">
              View product
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}
