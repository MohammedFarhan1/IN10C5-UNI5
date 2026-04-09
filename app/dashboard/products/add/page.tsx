import Link from "next/link";
import { Card } from "@/components/ui/card";
import { ProductForm } from "@/components/forms/product-form";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { createProductAction } from "@/lib/actions/products";
import { getCategories } from "@/lib/data";
import { getMarketplaceAvailability } from "@/lib/marketplace";

export default async function AddProductPage() {
  const [categories, marketplaceStatus] = await Promise.all([
    getCategories(),
    getMarketplaceAvailability()
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        action={
          <Link href="/dashboard/products/bulk-upload">
            <Button variant="secondary">Bulk upload</Button>
          </Link>
        }
        description="Create shared catalog data once, generate variant combinations, and attach seller-specific listings with price, stock, and dispatch details."
        eyebrow="Product creation"
        title="Add a new catalog product"
      />

      {marketplaceStatus.available ? (
        <Card>
          <ProductForm action={createProductAction} categories={categories} />
        </Card>
      ) : (
        <Card>
          <div className="space-y-3">
            <p className="text-lg font-semibold text-brand-ink">Marketplace setup needed</p>
            <p className="text-sm text-slate-600">{marketplaceStatus.message}</p>
            <p className="text-sm text-slate-600">
              After that, reload this page and the variant-based product form will work normally.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
