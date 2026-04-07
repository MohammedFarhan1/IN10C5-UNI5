import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { Table } from "@/components/ui/table";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { getSellerProducts } from "@/lib/data";
import { requireRole } from "@/lib/auth";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function SellerProductsPage() {
  const { profile } = await requireRole(["seller"]);
  const products = await getSellerProducts(profile.id);

  return (
    <div className="space-y-8">
      <PageHeader
        action={
          <Link href="/dashboard/products/add">
            <Button>Add product</Button>
          </Link>
        }
        description="Every product here owns a pool of individual units with unique codes."
        eyebrow="Inventory"
        title="Your products"
      />

      {products.length === 0 ? (
        <EmptyState
          actionHref="/dashboard/products/add"
          actionLabel="Create your first product"
          description="Add a product to generate its unit-level inventory automatically."
          title="No products yet"
        />
      ) : (
        <Table headers={["Product", "Price", "Available", "Created", "Total units", "Actions"]}>
          {products.map((product) => {
            const available = product.units?.filter((unit) => unit.status === "available").length ?? 0;
            return (
              <tr key={product.id}>
                <td className="px-5 py-4">
                  <div>
                    <p className="font-medium text-brand-ink">{product.name}</p>
                    <p className="text-xs text-slate-500">{product.id}</p>
                  </div>
                </td>
                <td className="px-5 py-4 font-medium text-brand-ink">{formatCurrency(product.price)}</td>
                <td className="px-5 py-4 text-slate-600">{available}</td>
                <td className="px-5 py-4 text-slate-600">{formatDate(product.created_at)}</td>
                <td className="px-5 py-4 text-slate-600">{product.total_units}</td>
                <td className="px-5 py-4">
                  <Link href={`/dashboard/products/${product.id}/edit`}>
                    <Button variant="secondary">Edit</Button>
                  </Link>
                </td>
              </tr>
            );
          })}
        </Table>
      )}
    </div>
  );
}
