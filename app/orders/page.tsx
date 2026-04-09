import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageHeader } from "@/components/layout/page-header";
import { CancelOrderButton } from "@/components/cart/cancel-order-button";
import { OrderTimeline } from "@/components/orders/order-timeline";
import { getMarketplaceBuyerOrders } from "@/lib/marketplace";
import { requireRole } from "@/lib/auth";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function OrdersPage() {
  const { profile } = await requireRole(["customer"]);
  const orders = await getMarketplaceBuyerOrders(profile.id);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-6 lg:px-8">
      <PageHeader
        description="Track every order with a structured order ID and a live delivery timeline."
        eyebrow="Buyer account"
        title="My orders"
      />

      {orders.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            actionHref="/"
            actionLabel="Browse products"
            description="Your marketplace orders and delivery timeline will appear here."
            title="No orders yet"
          />
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          {orders.map((order) => (
            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-soft" key={order.id}>
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-pine">
                    {order.order_id}
                  </p>
                  <p className="mt-2 text-sm text-slate-500">{formatDate(order.created_at)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge value={order.status} />
                  {order.status !== "delivered" &&
                  order.status !== "cancelled" &&
                  order.status !== "returned" ? (
                    <CancelOrderButton orderId={order.id} />
                  ) : null}
                </div>
              </div>

              <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-brand-ink">Order items</p>
                  {(order.items ?? []).map((item) => (
                    <div
                      className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                      key={item.id}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-medium text-brand-ink">{item.product_name}</p>
                          <p className="mt-1 text-sm text-slate-600">{item.variant_name}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            SKU {item.seller_sku}
                            {item.seller?.display_name || item.seller?.business_name
                              ? ` • ${item.seller.display_name || item.seller.business_name}`
                              : ""}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-brand-pine">{formatCurrency(item.unit_price)}</p>
                          <p className="text-xs text-slate-500">Qty {item.quantity}</p>
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="flex items-center justify-between rounded-2xl bg-slate-900 px-4 py-3 text-white">
                    <span className="text-sm font-medium">Order total</span>
                    <span className="text-lg font-semibold">{formatCurrency(order.total_amount)}</span>
                  </div>
                </div>

                <div>
                  <p className="mb-3 text-sm font-semibold text-brand-ink">Tracking timeline</p>
                  <OrderTimeline entries={order.tracking ?? []} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
