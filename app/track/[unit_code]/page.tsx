import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { getTrackingDetails } from "@/lib/data";
import { formatCurrency, formatDate } from "@/lib/utils";

type TrackingRecord = {
  unit_code: string;
  status: string;
  product?: {
    name?: string;
    description?: string;
    price?: number;
    seller?: {
      email?: string;
    };
  };
  order?:
    | {
        id: string;
        status: string;
        created_at: string;
        buyer?: {
          email?: string;
        };
      }
    | Array<{
        id: string;
        status: string;
        created_at: string;
        buyer?: {
          email?: string;
        };
      }>;
};

type TrackingPageProps = {
  params: Promise<{ unit_code: string }>;
};

export default async function TrackingPage({ params }: TrackingPageProps) {
  const { unit_code } = await params;
  const tracking = (await getTrackingDetails(unit_code)) as TrackingRecord | null;

  if (!tracking) {
    notFound();
  }

  const product = tracking.product;
  const orderRelation = tracking.order;
  const order = Array.isArray(orderRelation) ? orderRelation[0] : orderRelation;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 md:px-6 lg:px-8">
      <Card className="space-y-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-pine">
            Tracking lookup
          </p>
          <h1 className="mt-3 text-4xl font-semibold text-brand-ink">Unit code: {tracking.unit_code}</h1>
          <p className="mt-3 text-sm text-slate-600">
            Public traceability for the physical unit tied to a uni5 order.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border border-slate-100 shadow-none">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Product</p>
            <h2 className="mt-3 text-2xl font-semibold text-brand-ink">{product?.name}</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">{product?.description}</p>
            <div className="mt-5 space-y-2 text-sm text-slate-600">
              <p>Seller: <span className="font-medium text-brand-ink">{product?.seller?.email}</span></p>
              <p>Price: <span className="font-medium text-brand-ink">{formatCurrency(product?.price ?? 0)}</span></p>
              <div className="flex items-center gap-3">
                <span>Unit status:</span>
                <StatusBadge value={tracking.status} />
              </div>
            </div>
          </Card>

          <Card className="border border-slate-100 shadow-none">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Order linkage</p>
            {order ? (
              <div className="mt-3 space-y-3 text-sm text-slate-600">
                <p>Order ID: <span className="font-medium text-brand-ink">{order.id}</span></p>
                <p>Buyer: <span className="font-medium text-brand-ink">{order.buyer?.email ?? "Hidden"}</span></p>
                <p>Placed on: <span className="font-medium text-brand-ink">{formatDate(order.created_at)}</span></p>
                <div className="flex items-center gap-3">
                  <span>Order status:</span>
                  <StatusBadge value={order.status} />
                </div>
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-600">
                This unit has not been assigned to an order yet.
              </p>
            )}
          </Card>
        </div>
      </Card>
    </div>
  );
}
