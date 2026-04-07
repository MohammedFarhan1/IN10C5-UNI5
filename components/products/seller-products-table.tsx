"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Table } from "@/components/ui/table";
import { ActionState, ProductWithDetails } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";

type SellerProductsTableProps = {
  action: (
    prevState: ActionState,
    formData: FormData
  ) => Promise<ActionState>;
  products: ProductWithDetails[];
  query?: string;
};

const initialState: ActionState = {};

export function SellerProductsTable({ action, products, query = "" }: SellerProductsTableProps) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const productIds = useMemo(() => products.map((product) => product.id), [products]);
  const allSelected = productIds.length > 0 && selectedIds.length === productIds.length;

  function toggleSelection(productId: string) {
    setSelectedIds((current) =>
      current.includes(productId)
        ? current.filter((id) => id !== productId)
        : [...current, productId]
    );
  }

  function toggleSelectAll() {
    setSelectedIds(allSelected ? [] : productIds);
  }

  return (
    <form action={formAction} className="space-y-4">
      <input name="return_query" type="hidden" value={query} />

      <div className="flex flex-col gap-3 rounded-[24px] border border-slate-200 bg-white p-4 shadow-soft sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-brand-ink">Bulk actions</p>
          <p className="text-sm text-slate-600">
            Select multiple products or all visible products to delete them in one step.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button disabled={productIds.length === 0} onClick={toggleSelectAll} type="button" variant="secondary">
            {allSelected ? "Clear selection" : "Select all"}
          </Button>
          <Button disabled={selectedIds.length === 0 || pending} type="submit" variant="danger">
            {pending ? "Deleting..." : `Delete selected (${selectedIds.length})`}
          </Button>
        </div>
      </div>

      {state.error ? (
        <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{state.error}</p>
      ) : null}

      <Table headers={["Select", "Product", "Price", "Available", "Created", "Total units", "Actions"]}>
        {products.map((product) => {
          const available = product.units?.filter((unit) => unit.status === "available").length ?? 0;
          const checked = selectedIds.includes(product.id);

          return (
            <tr key={product.id}>
              <td className="px-5 py-4">
                <input
                  checked={checked}
                  className="h-4 w-4 rounded border-slate-300 text-brand-ink focus:ring-brand-gold"
                  name="product_ids"
                  onChange={() => toggleSelection(product.id)}
                  type="checkbox"
                  value={product.id}
                />
              </td>
              <td className="px-5 py-4">
                <div>
                  <p className="font-medium text-brand-ink">{product.name}</p>
                  {product.custom_product_id ? (
                    <p className="text-xs font-medium text-brand-pine">Custom ID: {product.custom_product_id}</p>
                  ) : null}
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
    </form>
  );
}
