import { notFound } from "next/navigation";
import { ProductEditForm } from "@/components/forms/product-edit-form";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { requireRole } from "@/lib/auth";
import { getSellerOwnedProduct } from "@/lib/data";
import { updateProductAction } from "@/lib/actions/products";

type SellerEditProductPageProps = {
  params: Promise<{ id: string }>;
};

export default async function SellerEditProductPage({
  params
}: SellerEditProductPageProps) {
  const { profile } = await requireRole(["seller"]);
  const { id } = await params;
  const product = await getSellerOwnedProduct(id, profile.id);

  if (!product) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Inventory"
        title="Edit product"
        description="Sellers can update their own product details without changing already-generated unit identities."
      />
      <Card>
        <ProductEditForm action={updateProductAction} product={product} />
      </Card>
    </div>
  );
}
