"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { ActionState } from "@/types";

type BulkProductUploadFormProps = {
  action: (
    prevState: ActionState,
    formData: FormData
  ) => Promise<ActionState>;
};

const initialState: ActionState = {};

const exampleJson = `[
  {
    "custom_product_id": "TSHIRT-OVERSIZED-001",
    "product_name": "Oversized Cotton T-Shirt",
    "brand": "Vericart Basics",
    "category": "Clothing",
    "description": "Heavyweight cotton oversized t-shirt for everyday wear.",
    "main_image": "https://images.example.com/products/tshirt-front.jpg",
    "gallery_images": [
      "https://images.example.com/products/tshirt-back.jpg",
      "https://images.example.com/products/tshirt-detail.jpg"
    ],
    "variants": [
      {
        "custom_variant_id": "BLK-M-OVER",
        "attributes": {
          "Size": "M",
          "Color": "Black",
          "Fit": "Oversized"
        },
        "seller_sku": "TSHIRT-BLK-M",
        "price": 799,
        "mrp": 999,
        "stock_quantity": 25
      },
      {
        "custom_variant_id": "BLK-L-OVER",
        "attributes": {
          "Size": "L",
          "Color": "Black",
          "Fit": "Oversized"
        },
        "seller_sku": "TSHIRT-BLK-L",
        "price": 799,
        "mrp": 999,
        "stock_quantity": 18
      }
    ]
  }
]`;

export function BulkProductUploadForm({ action }: BulkProductUploadFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="products_json_file">
            JSON file
          </label>
          <input
            accept="application/json,.json"
            className="block w-full rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-3 text-sm text-slate-600 file:mr-3 file:rounded-full file:border-0 file:bg-brand-ink file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-slate-900"
            id="products_json_file"
            name="products_json_file"
            type="file"
          />
          <p className="text-xs text-slate-500">
            Upload a JSON array of catalog products. Each product can include shared product data and
            a required <span className="font-semibold">variants</span> array with seller listing fields.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-brand-ink">Supported structure</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
  <li>
    Product fields: <span className="font-medium text-brand-ink">custom_product_id</span>,{" "}
    <span className="font-medium text-brand-ink">product_name</span>,{" "}
    <span className="font-medium text-brand-ink">brand</span>,{" "}
    <span className="font-medium text-brand-ink">category</span>,{" "}
    <span className="font-medium text-brand-ink">description</span>
  </li>
  <li>
    Image fields: <span className="font-medium text-brand-ink">main_image</span> and{" "}
    <span className="font-medium text-brand-ink">gallery_images</span> (array)
  </li>
  <li>
    Each variant should include <span className="font-medium text-brand-ink">attributes</span> (map),{" "}
    <span className="font-medium text-brand-ink">seller_sku</span>,{" "}
    <span className="font-medium text-brand-ink">price</span>,{" "}
    <span className="font-medium text-brand-ink">mrp</span>, and{" "}
    <span className="font-medium text-brand-ink">stock_quantity</span>
  </li>
  <li>
    Optional aliases also work: <span className="font-medium text-brand-ink">customProductId</span>,{" "}
    <span className="font-medium text-brand-ink">name</span>,{" "}
    <span className="font-medium text-brand-ink">categoryName</span>,{" "}
    <span className="font-medium text-brand-ink">mainImage</span>, and{" "}
    <span className="font-medium text-brand-ink">galleryImages</span>. Variants may also include{" "}
    <span className="font-medium text-brand-ink">size</span> or{" "}
    <span className="font-medium text-brand-ink">color</span> for compatibility.
  </li>
</ul>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700" htmlFor="products_json">
          Or paste JSON
        </label>
        <textarea
          className="min-h-72 w-full rounded-[24px] border border-slate-200 bg-white px-4 py-3 font-mono text-sm text-brand-ink outline-none transition placeholder:text-slate-400 focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20"
          placeholder={exampleJson}
          id="products_json"
          name="products_json"
          spellCheck={false}
        />
        <p className="text-xs text-slate-500">
          The selected category will be reused if it already exists. New category names are created
          automatically when the seller has permission to add categories.
        </p>
      </div>

      {state.error ? (
        <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{state.error}</p>
      ) : null}

      {state.success ? (
        <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{state.success}</p>
      ) : null}

      <Button disabled={pending} type="submit">
        {pending ? "Uploading products..." : "Create catalog products from JSON"}
      </Button>
    </form>
  );
}




