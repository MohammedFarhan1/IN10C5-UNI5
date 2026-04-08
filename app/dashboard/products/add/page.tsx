import Link from "next/link";
import { Card } from "@/components/ui/card";
import { ProductForm } from "@/components/forms/product-form";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { createProductAction } from "@/lib/actions/products";
import { getCategories } from "@/lib/data";

export default async function AddProductPage() {
  const categories = await getCategories();

  return (
    <div className="space-y-8">
      <PageHeader
        action={
          <Link href="/dashboard/products/bulk-upload">
            <Button variant="secondary">Bulk upload</Button>
          </Link>
        }
        description="Create a product once and uni5 will generate a unique unit code for each physical item."
        eyebrow="Product creation"
        title="Add a new product"
      />

      <Card>
        <ProductForm action={createProductAction} categories={categories} />
      </Card>
    </div>
  );
}
