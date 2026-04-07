import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { Table } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageHeader } from "@/components/layout/page-header";
import { getBuyerOrders } from "@/lib/data";
import { requireRole } from "@/lib/auth";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function OrdersPage() {
  const { profile } = await requireRole(["customer"]);
  const orders = await getBuyerOrders(profile.id);

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
          <Table headers={["Product", "Unit code", "Status", "Date", "Amount"]}>
            {orders.map((order) => (
              <tr key={order.id}>
                <td className="px-5 py-4">
                  <div>
                    <p className="font-medium text-brand-ink">{order.product?.name}</p>
                    <p className="text-xs text-slate-500">Order #{order.id.slice(0, 8)}</p>
                  </div>
                </td>
                <td className="px-5 py-4">
                  {order.unit?.unit_code ? (
                    <Link className="font-medium text-brand-pine hover:text-brand-ink" href={`/track/${order.unit.unit_code}`}>
                      {order.unit.unit_code}
                    </Link>
                  ) : (
                    <span className="text-slate-400">Pending</span>
                  )}
                </td>
                <td className="px-5 py-4">
                  <StatusBadge value={order.status} />
                </td>
                <td className="px-5 py-4 text-slate-600">{formatDate(order.created_at)}</td>
                <td className="px-5 py-4 font-medium text-brand-ink">
                  {formatCurrency(order.product?.price ?? 0)}
                </td>
              </tr>
            ))}
          </Table>
        </div>
      )}
    </div>
  );
}