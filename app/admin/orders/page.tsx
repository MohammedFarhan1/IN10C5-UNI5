import { OrderStatusForm } from "@/components/forms/order-status-form";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageHeader } from "@/components/layout/page-header";
import { OrderTimeline } from "@/components/orders/order-timeline";
import { updateOrderStatusAction } from "@/lib/actions/orders";
import { getMarketplaceAdminOrders } from "@/lib/marketplace";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function AdminOrdersPage() {
  const orders = await getMarketplaceAdminOrders();

  return (
    <div className="space-y-8">
      <PageHeader
        description="Review all marketplace orders, seller progress, and customer-facing tracking timelines."
        eyebrow="Order oversight"
        title="Orders"
      />

      <div className="space-y-6">
        {orders.map((order) => (
          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-soft" key={order.id}>
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-pine">
                  {order.order_id}
                </p>
                <p className="mt-2 text-sm text-slate-600">{order.buyer?.email}</p>
                <p className="text-xs text-slate-500">{formatDate(order.created_at)}</p>
              </div>
              <StatusBadge value={order.status} />
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-4">
                {(order.suborders ?? []).map((suborder) => (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4" key={suborder.id}>
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="font-medium text-brand-ink">
                          {suborder.seller?.display_name || suborder.seller?.business_name || suborder.seller?.email}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">{suborder.sub_order_number}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <StatusBadge value={suborder.status} />
                        <OrderStatusForm
                          action={updateOrderStatusAction}
                          status={suborder.status}
                          subOrderId={suborder.id}
                        />
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      {(order.items ?? [])
                        .filter((item) => item.sub_order_id === suborder.id)
                        .map((item) => (
                          <div className="flex items-start justify-between gap-4" key={item.id}>
                            <div>
                              <p className="text-sm font-medium text-brand-ink">{item.product_name}</p>
                              <p className="text-xs text-slate-500">{item.variant_name}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold text-brand-pine">
                                {formatCurrency(item.unit_price)}
                              </p>
                              <p className="text-xs text-slate-500">Qty {item.quantity}</p>
                            </div>
                          </div>
                        ))}
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
        ))}
      </div>
    </div>
  );
}
