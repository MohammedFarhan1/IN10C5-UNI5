import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SellerProductsTable } from "@/components/products/seller-products-table";
import { getSellerProducts } from "@/lib/data";
import { requireRole } from "@/lib/auth";
import { deleteSelectedProductsAction } from "@/lib/actions/products";

type SellerProductsPageProps = {
  searchParams?: Promise<{ q?: string }>;
};

export default async function SellerProductsPage({ searchParams }: SellerProductsPageProps) {
  const { profile } = await requireRole(["seller"]);
  const params = searchParams ? await searchParams : undefined;
  const query = params?.q?.trim() ?? "";
  const products = await getSellerProducts(profile.id, query);

  return (
    <div className="space-y-8">
      <PageHeader
        action={
          <div className="flex flex-wrap gap-2">
            <Link href="/dashboard/products/bulk-upload">
              <Button variant="secondary">Bulk upload</Button>
            </Link>
            <Link href="/dashboard/products/add">
              <Button>Add product</Button>
            </Link>
          </div>
        }
        description="Every product here owns a pool of individual units with unique codes."
        eyebrow="Inventory"
        title="Your products"
      />

      <form className="flex flex-col gap-3 rounded-[24px] border border-slate-200 bg-white p-4 shadow-soft sm:flex-row sm:items-center">
        <Input
          defaultValue={query}
          name="q"
          placeholder="Search products by name, description, or custom product ID"
        />
        <div className="flex gap-2">
          <Button className="sm:min-w-[112px]" type="submit">
            Search
          </Button>
          {query ? (
            <Link href="/dashboard/products">
              <Button className="w-full sm:w-auto" variant="secondary">Reset</Button>
            </Link>
          ) : null}
        </div>
      </form>

      {products.length === 0 ? (
        <EmptyState
          actionHref="/dashboard/products/add"
          actionLabel="Create your first product"
          description={
            query
              ? "Try a different keyword or clear the search to view the full product list."
              : "Add a product to generate its unit-level inventory automatically."
          }
          title={query ? "No matching products" : "No products yet"}
        />
      ) : (
        <SellerProductsTable
          action={deleteSelectedProductsAction}
          products={products}
          query={query}
        />
      )}
    </div>
  );
}
