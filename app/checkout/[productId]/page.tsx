import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckoutForm } from "@/components/forms/checkout-form";
import { createOrderAction } from "@/lib/actions/orders";
import { requireRole } from "@/lib/auth";
import { getProductById } from "@/lib/data";
import { formatCurrency, getStockSummary } from "@/lib/utils";

type CheckoutPageProps = {
  params: Promise<{ productId: string }>;
};

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  await requireRole(["customer"]);
  const { productId } = await params;
  const product = await getProductById(productId);

  if (!product) {
    notFound();
  }

  const availableUnits =
    product.units?.filter((unit) => unit.status === "available").length ?? 0;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 md:px-6 lg:px-8">
      <div className="grid gap-6 md:grid-cols-[1.1fr_420px]">
        <Card className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-pine">
            Checkout
          </p>
          <h1 className="text-3xl font-semibold text-brand-ink">Confirm your tracked unit purchase</h1>
          <p className="text-sm leading-7 text-slate-600">
            Choose how many units you want, and the system will assign that many available tracked units into one grouped order.
          </p>
          <div className="rounded-[24px] bg-slate-50 p-4">
            <p className="text-sm font-medium text-brand-ink">{product.name}</p>
            <p className="mt-2 text-sm text-slate-600">{product.description}</p>
          </div>
        </Card>

        <Card className="space-y-5">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Unit availability</p>
            <p className="mt-2 text-2xl font-semibold text-brand-ink">
              {getStockSummary(availableUnits, product.total_units)}
            </p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Price</p>
            <p className="mt-2 text-3xl font-semibold text-brand-pine">
              {formatCurrency(product.price)}
            </p>
            <p className="mt-1 text-xs text-slate-500">Price shown per unit.</p>
          </div>

          {availableUnits > 0 ? (
            <CheckoutForm
              action={createOrderAction}
              availableUnits={availableUnits}
              productId={product.id}
            />
          ) : (
            <Button className="w-full" disabled>
              No units available
            </Button>
          )}
        </Card>
      </div>
    </div>
  );
}
