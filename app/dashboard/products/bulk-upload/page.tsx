import Link from "next/link";
import { BulkProductUploadForm } from "@/components/forms/bulk-product-upload-form";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { bulkCreateProductsAction } from "@/lib/actions/products";

export default function BulkUploadProductsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        action={
          <Link href="/dashboard/products/add">
            <Button variant="secondary">Single product</Button>
          </Link>
        }
        description="Upload a JSON file to create multiple products at once, each with its own custom product ID and optional unit metadata."
        eyebrow="Product creation"
        title="Bulk product upload"
      />

      <Card className="space-y-5">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-brand-ink">JSON import</h2>
          <p className="text-sm text-slate-600">
            Existing single-product creation stays unchanged. This page adds a faster path for larger catalogs.
          </p>
        </div>

        <BulkProductUploadForm action={bulkCreateProductsAction} />
      </Card>
    </div>
  );
}
