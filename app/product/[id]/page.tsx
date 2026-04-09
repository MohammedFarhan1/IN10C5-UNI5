import { notFound } from "next/navigation";
import { getCategories } from "@/lib/data";
import { getMarketplaceProductById } from "@/lib/marketplace";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ProductDetailView } from "@/components/products/product-detail-view";

type ProductPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  const product = await getMarketplaceProductById(id);

  if (!product) {
    notFound();
  }

  const [categories, supabase] = await Promise.all([
    getCategories(),
    createSupabaseServerClient()
  ]);
  const {
    data: { user }
  } = await supabase.auth.getUser();

  let isCustomer = false;

  if (user) {
    const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).maybeSingle();
    isCustomer = profile?.role === "customer";
  }

  const categoryName = categories.find((category) => category.id === product.category_id)?.name ?? null;

  return <ProductDetailView categoryName={categoryName} isCustomer={isCustomer} product={product} />;
}
