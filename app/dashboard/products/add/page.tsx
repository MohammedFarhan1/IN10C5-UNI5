import { Card } from "@/components/ui/card";
import { ProductForm } from "@/components/forms/product-form";
import { PageHeader } from "@/components/layout/page-header";
import { createProductAction } from "@/lib/actions/products";

export default function AddProductPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        description="Create a product once and uni5 will generate a unique unit code for each physical item."
        eyebrow="Product creation"
        title="Add a new product"
      />

      <Card>
        <ProductForm action={createProductAction} />
      </Card>
    </div>
  );
}
