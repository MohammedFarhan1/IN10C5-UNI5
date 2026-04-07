import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { getProductById } from "@/lib/data";
import { formatCurrency, formatDate, getStockSummary } from "@/lib/utils";

type ProductPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  const product = await getProductById(id);

  if (!product) {
    notFound();
  }

  const availableUnits =
    product.units?.filter((unit) => unit.status === "available").length ?? 0;

  return (
    <div className="mx-auto max-w-6xl px-3 py-6 sm:px-4 md:px-6 lg:px-8 lg:py-8">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_420px] lg:gap-8">
        <div className="overflow-hidden rounded-[24px] border border-white/70 bg-white shadow-soft sm:rounded-[32px]">
          <img
            alt={product.name}
            className="aspect-square w-full object-cover sm:aspect-[5/4]"
            src={
              product.image_url ||
              "https://images.unsplash.com/photo-1511556820780-d912e42b4980?auto=format&fit=crop&w=1200&q=80"
            }
          />
        </div>

        <Card className="space-y-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-pine">
              Unit-tracked product
            </p>
            <h1 className="mt-3 text-2xl font-semibold text-brand-ink sm:text-4xl">{product.name}</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600 sm:leading-7">{product.description}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Price</p>
              <p className="mt-1 text-2xl font-semibold text-brand-pine">
                {formatCurrency(product.price)}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Inventory</p>
              <p className="mt-1 text-lg font-semibold text-brand-ink">
                {getStockSummary(availableUnits, product.total_units)}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Seller</p>
              <p className="mt-1 text-sm font-medium text-brand-ink">{product.seller?.email}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Created</p>
              <p className="mt-1 text-sm font-medium text-brand-ink">
                {formatDate(product.created_at)}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge value={availableUnits > 0 ? "available" : "sold"} />
            <span className="text-sm text-slate-500">
              Every sale is assigned exactly one unique unit.
            </span>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            {availableUnits > 0 ? (
              <Link className="w-full sm:w-auto" href={`/checkout/${product.id}`}>
                <Button className="w-full sm:w-auto">Buy one tracked unit</Button>
              </Link>
            ) : (
              <Button className="w-full sm:w-auto" disabled>Sold out</Button>
            )}
            <Link className="w-full sm:w-auto" href="/">
              <Button className="w-full sm:w-auto" variant="secondary">Back to catalog</Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
