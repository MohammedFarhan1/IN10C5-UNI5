import { EmptyState } from "@/components/ui/empty-state";
import { OrderStatusForm } from "@/components/forms/order-status-form";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageHeader } from "@/components/layout/page-header";
import { OrderTimeline } from "@/components/orders/order-timeline";
import { updateOrderStatusAction } from "@/lib/actions/orders";
import { getMarketplaceSellerOrders } from "@/lib/marketplace";
import { requireRole } from "@/lib/auth";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function SellerOrdersPage() {
  const { profile } = await requireRole(["seller"]);
  const orders = await getMarketplaceSellerOrders(profile.id);

  return (
    <div className="space-y-8">
      <PageHeader
        description="Update seller-owned order progress and keep the customer timeline in sync."
        eyebrow="Order flow"
        title="Seller orders"
      />

      {orders.length === 0 ? (
        <EmptyState
          actionHref="/dashboard/products/add"
          actionLabel="Add a product"
          description="Orders will appear here once a buyer purchases one of your active listings."
          title="No orders yet"
        />
      ) : (
        <div className="space-y-6">
          {orders.map((order) => {
            const suborder = order.suborders?.[0];

            return (
              <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-soft" key={order.id}>
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-pine">
                      {order.order_id}
                    </p>
                    <p className="mt-2 text-sm text-slate-600">{order.buyer?.email}</p>
                    <p className="text-xs text-slate-500">{formatDate(order.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge value={suborder?.status ?? order.status} />
                    {suborder ? (
                      <OrderStatusForm
                        action={updateOrderStatusAction}
                        status={suborder.status}
                        subOrderId={suborder.id}
                      />
                    ) : null}
                  </div>
                </div>

                <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                  <div className="space-y-3">
                    {(order.items ?? []).map((item) => (
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" key={item.id}>
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-medium text-brand-ink">{item.product_name}</p>
                            <p className="mt-1 text-sm text-slate-600">{item.variant_name}</p>
                            <p className="mt-1 text-xs text-slate-500">SKU {item.seller_sku}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-brand-pine">{formatCurrency(item.unit_price)}</p>
                            <p className="text-xs text-slate-500">Qty {item.quantity}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div>
                    <p className="mb-3 text-sm font-semibold text-brand-ink">Tracking timeline</p>
                    <OrderTimeline entries={order.tracking ?? []} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
