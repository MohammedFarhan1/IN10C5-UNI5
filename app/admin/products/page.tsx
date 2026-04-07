import { Table } from "@/components/ui/table";
import { PageHeader } from "@/components/layout/page-header";
import { getAdminProducts } from "@/lib/data";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function AdminProductsPage() {
  const products = await getAdminProducts();

  return (
    <div className="space-y-8">
      <PageHeader
        description="Inspect seller-owned products and the unit counts created for each listing."
        eyebrow="Catalog oversight"
        title="Products"
      />
      <Table headers={["Product", "Seller", "Price", "Units", "Created"]}>
        {products.map((product) => (
          <tr key={product.id}>
            <td className="px-5 py-4 font-medium text-brand-ink">{product.name}</td>
            <td className="px-5 py-4 text-slate-600">{product.seller?.email}</td>
            <td className="px-5 py-4 text-brand-ink">{formatCurrency(product.price)}</td>
            <td className="px-5 py-4 text-slate-600">{product.total_units}</td>
            <td className="px-5 py-4 text-slate-600">{formatDate(product.created_at)}</td>
          </tr>
        ))}
      </Table>
    </div>
  );
}