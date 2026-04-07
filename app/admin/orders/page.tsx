import Link from "next/link";
import { OrderStatusForm } from "@/components/forms/order-status-form";
import { Table } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageHeader } from "@/components/layout/page-header";
import { updateOrderStatusAction } from "@/lib/actions/orders";
import { getAdminOrders } from "@/lib/data";
import { formatDate } from "@/lib/utils";

export default async function AdminOrdersPage() {
  const orders = await getAdminOrders();

  return (
    <div className="space-y-8">
      <PageHeader
        description="Review every order, adjust fake delivery updates, and jump to the public tracking page for the assigned unit."
        eyebrow="Order oversight"
        title="Orders"
      />
      <Table headers={["Product", "Buyer", "Unit code", "Status", "Created", "Tracking update"]}>
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
            <td className="px-5 py-4"><StatusBadge value={order.status} /></td>
            <td className="px-5 py-4 text-slate-600">{formatDate(order.created_at)}</td>
            <td className="px-5 py-4">
              <OrderStatusForm action={updateOrderStatusAction} orderId={order.id} status={order.status} />
            </td>
          </tr>
        ))}
      </Table>
    </div>
  );
}
