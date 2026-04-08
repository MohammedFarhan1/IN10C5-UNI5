import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { getProductById } from "@/lib/data";
import { formatCurrency, getStockSummary } from "@/lib/utils";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AddToCartForm } from "@/components/cart/add-to-cart-form";

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

  // Check if user is authenticated customer
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isCustomer = user ? (await supabase.from("users").select("role").eq("id", user.id).single()).data?.role === "customer" : false;

  return (
    <div className="mx-auto max-w-6xl px-3 py-6 sm:px-4 md:px-6 lg:px-8 lg:py-8">
      <div className="grid grid-cols-2 gap-8">
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

        <Card className="space-y-6 p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-pine">
              Unit-tracked product
            </p>
            <h1 className="mt-3 text-2xl font-semibold text-brand-ink sm:text-4xl">{product.name}</h1>
            {product.custom_product_id ? (
              <p className="mt-2 text-xs uppercase tracking-[0.24em] text-slate-500">
                SKU: {product.custom_product_id}
              </p>
            ) : null}
            <p className="mt-3 text-sm leading-6 text-slate-600 sm:leading-7">{product.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
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
          </div>

          <div className="flex items-center gap-3">
            <StatusBadge value={availableUnits > 0 ? "available" : "sold"} />
            <span className="text-sm text-slate-500">
              Every sale is assigned exactly one unique unit.
            </span>
          </div>

          <div className="mt-6">
            <div className="flex items-center gap-4">
              {availableUnits > 0 ? (
                <Link href={`/checkout/${product.id}`}>
                  <Button className="h-12 rounded-xl px-6">Buy Now</Button>
                </Link>
              ) : (
                <Button className="h-12 rounded-xl px-6" disabled>Sold out</Button>
              )}
              {isCustomer && availableUnits > 0 && (
                <AddToCartForm productId={product.id} maxQuantity={availableUnits} />
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
