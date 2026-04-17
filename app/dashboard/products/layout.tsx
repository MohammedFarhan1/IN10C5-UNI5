import { requireApprovedSeller } from "@/lib/auth";

export default async function SellerProductsLayout({
  children
}: {
  children: React.ReactNode;
}) {
  await requireApprovedSeller();

  return children;
}
