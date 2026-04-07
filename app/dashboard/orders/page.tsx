import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { OrderStatusForm } from "@/components/forms/order-status-form";
import { Table } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageHeader } from "@/components/layout/page-header";
import { updateOrderStatusAction } from "@/lib/actions/orders";
import { getSellerOrders } from "@/lib/data";
import { requireRole } from "@/lib/auth";
import { formatDate } from "@/lib/utils";

export default async function SellerOrdersPage() {
  const { profile } = await requireRole(["seller"]);
  const orders = await getSellerOrders(profile.id);

  return (
    <div className="space-y-8">
      <PageHeader
        description="Track which specific unit was assigned to each customer order."
        eyebrow="Order flow"
        title="Seller orders"
      />

      {orders.length === 0 ? (
        <EmptyState
          actionHref="/dashboard/products/add"
          actionLabel="Add a product"
          description="Orders will appear here once a buyer purchases one of your available units."
          title="No orders yet"
        />
      ) : (
        <Table headers={["Product", "Buyer", "Unit code", "Status", "Date", "Tracking update"]}>
          {orders.map((order) => (
            <tr key={order.id}>
              <td className="px-5 py-4 font-medium text-brand-ink">{order.product?.name}</td>
              <td className="px-5 py-4 text-slate-600">{order.buyer?.email}</td>
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
              <td className="px-5 py-4">
                <OrderStatusForm action={updateOrderStatusAction} orderId={order.id} status={order.status} />
              </td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
}
