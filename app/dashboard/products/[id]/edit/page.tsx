import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductEditForm } from "@/components/forms/product-edit-form";
import { ProductUnitImportForm } from "@/components/forms/product-unit-import-form";
import { PageHeader } from "@/components/layout/page-header";
import { QrCodePreview } from "@/components/products/qr-code-preview";
import { Card } from "@/components/ui/card";
import { Table } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth";
import { getSellerOwnedProduct } from "@/lib/data";
import { importProductUnitsAction, updateProductAction } from "@/lib/actions/products";
import {
  formatCurrency,
  formatDate,
  formatUnitDetails,
  getProductDetailUrl,
  getQrCodeUrl,
  getUnitTrackingUrl
} from "@/lib/utils";

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

  const units = [...(product.units ?? [])].sort((left, right) => {
    const leftLabel = left.custom_unit_id ?? left.unit_code;
    const rightLabel = right.custom_unit_id ?? right.unit_code;
    return leftLabel.localeCompare(rightLabel);
  });
  const configuredUnits = units.filter((unit) => unit.custom_unit_id).length;
  const productUrl = getProductDetailUrl(product.id);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Inventory"
        title="Edit product"
        description="Update product details, import seller-defined unit IDs, and open QR links for product or unit pages without disturbing existing orders."
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_360px]">
        <Card>
          <ProductEditForm action={updateProductAction} product={product} />
        </Card>

        <Card className="space-y-5">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-brand-ink">Product access QR</h2>
            <p className="text-sm text-slate-600">
              Share a quick product lookup using the product ID page for this item.
            </p>
          </div>

          <QrCodePreview
            description={`Product ID: ${product.id}`}
            href={productUrl}
            title={product.name}
          />

          <div className="grid gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Price</p>
              <p className="mt-1 font-semibold text-brand-ink">{formatCurrency(product.price)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Created</p>
              <p className="mt-1 font-semibold text-brand-ink">{formatDate(product.created_at)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Configured units</p>
              <p className="mt-1 font-semibold text-brand-ink">
                {configuredUnits} of {product.total_units}
              </p>
            </div>
            <Link href={`/product/${product.id}`}>
              <Button className="w-full" variant="secondary">Open product page</Button>
            </Link>
          </div>
        </Card>
      </div>

      <Card className="space-y-5">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-brand-ink">Manual unit import</h2>
          <p className="text-sm text-slate-600">
            Attach your own unit IDs and metadata to the generated unit records after the product exists.
            Existing unit codes and tracking links remain intact.
          </p>
        </div>

        <div className="grid gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 sm:grid-cols-3">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Generated records</p>
            <p className="mt-1 font-semibold text-brand-ink">{units.length}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Imported IDs</p>
            <p className="mt-1 font-semibold text-brand-ink">{configuredUnits}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Remaining slots</p>
            <p className="mt-1 font-semibold text-brand-ink">{Math.max(product.total_units - configuredUnits, 0)}</p>
          </div>
        </div>

        <ProductUnitImportForm action={importProductUnitsAction} productId={product.id} />
      </Card>

      <section className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-brand-ink">Unit records and QR codes</h2>
          <p className="text-sm text-slate-600">
            Every unit keeps its platform tracking code, and imported unit IDs appear alongside QR shortcuts to the public detail page.
          </p>
        </div>

        <Table headers={["Seller unit ID", "Platform code", "Status", "Details", "QR", "Open"]}>
          {units.map((unit) => {
            const detailEntries = formatUnitDetails(unit.details);
            const trackingUrl = getUnitTrackingUrl(unit.unit_code);

            return (
              <tr key={unit.id}>
                <td className="px-5 py-4">
                  <div>
                    <p className="font-medium text-brand-ink">
                      {unit.custom_unit_id ?? "Not assigned yet"}
                    </p>
                    {!unit.custom_unit_id ? (
                      <p className="text-xs text-slate-500">Use the import form to attach your own ID.</p>
                    ) : null}
                  </div>
                </td>
                <td className="px-5 py-4 text-slate-600">{unit.unit_code}</td>
                <td className="px-5 py-4">
                  <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-600">
                    {unit.status}
                  </span>
                </td>
                <td className="px-5 py-4 text-slate-600">
                  {detailEntries.length > 0 ? (
                    <div className="space-y-1 text-xs">
                      {detailEntries.map(([key, value]) => (
                        <p key={key}>
                          <span className="font-semibold text-brand-ink">{key}:</span> {value}
                        </p>
                      ))}
                    </div>
                  ) : (
                    <span className="text-slate-400">No extra details</span>
                  )}
                </td>
                <td className="px-5 py-4">
                  <img
                    alt={`QR for ${unit.custom_unit_id ?? unit.unit_code}`}
                    className="h-16 w-16 rounded-md border border-slate-100 object-contain"
                    height={96}
                    loading="lazy"
                    src={getQrCodeUrl(trackingUrl, 96)}
                    width={96}
                  />
                </td>
                <td className="px-5 py-4">
                  <Link className="font-medium text-brand-pine hover:text-brand-ink" href={trackingUrl} target="_blank">
                    View unit page
                  </Link>
                </td>
              </tr>
            );
          })}
        </Table>
      </section>
    </div>
  );
}
