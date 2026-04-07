import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { Table } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageHeader } from "@/components/layout/page-header";
import { getBuyerOrderGroups } from "@/lib/data";
import { requireRole } from "@/lib/auth";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function OrdersPage() {
  const { profile } = await requireRole(["customer"]);
  const orders = await getBuyerOrderGroups(profile.id);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 lg:px-8">
      <PageHeader
        description="Review the unit assigned to each purchase and jump directly into the tracking page."
        eyebrow="Buyer account"
        title="My orders"
      />

      {orders.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            actionHref="/"
            actionLabel="Browse products"
            description="Once you buy a product, the assigned unit code and order status will appear here."
            title="No orders yet"
          />
        </div>
      ) : (
        <div className="mt-8">
          <Table headers={["Product", "Quantity", "Units", "Status", "Date", "Amount"]}>
            {orders.map((order) => (
              <tr key={order.order_group_id}>
                <td className="px-5 py-4">
                  <div>
                    <p className="font-medium text-brand-ink">{order.product_name}</p>
                    <p className="text-xs text-slate-500">Order #{order.order_group_id.slice(0, 8)}</p>
                  </div>
                </td>
                <td className="px-5 py-4 text-slate-600">{order.quantity}</td>
                <td className="px-5 py-4">
                  <div className="flex flex-col gap-1">
                    {order.unit_codes.slice(0, 3).map((unitCode) => (
                      <Link
                        className="font-medium text-brand-pine hover:text-brand-ink"
                        href={`/track/${unitCode}`}
                        key={unitCode}
                      >
                        {unitCode}
                      </Link>
                    ))}
                    {order.unit_codes.length > 3 ? (
                      <span className="text-xs text-slate-500">
                        +{order.unit_codes.length - 3} more units
                      </span>
                    ) : null}
                  </div>
                </td>
                <td className="px-5 py-4">
                  <StatusBadge value={order.status} />
                </td>
                <td className="px-5 py-4 text-slate-600">{formatDate(order.created_at)}</td>
                <td className="px-5 py-4 font-medium text-brand-ink">
                  {formatCurrency(order.total_amount)}
                </td>
              </tr>
            ))}
          </Table>
        </div>
      )}
    </div>
  );
}
