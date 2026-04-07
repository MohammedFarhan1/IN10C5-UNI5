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
    "customProductId": "DRIPPER-001",
    "name": "Limited edition coffee dripper",
    "description": "Batch-tracked dripper for specialty coffee brews.",
    "price": 2499,
    "imageUrl": "https://images.example.com/dripper.jpg",
    "totalUnits": 3,
    "units": [
      { "unitId": "DRIPPER-001-A", "details": { "batch": "A1", "color": "Black" } },
      { "unitId": "DRIPPER-001-B", "details": { "batch": "A1", "color": "Cream" } }
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
            Upload a JSON array of products. Each entry must include a unique <span className="font-semibold">customProductId</span>.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-brand-ink">Supported keys</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li><span className="font-medium text-brand-ink">customProductId</span>, <span className="font-medium text-brand-ink">name</span>, <span className="font-medium text-brand-ink">description</span></li>
            <li><span className="font-medium text-brand-ink">price</span>, <span className="font-medium text-brand-ink">imageUrl</span>, <span className="font-medium text-brand-ink">totalUnits</span></li>
            <li><span className="font-medium text-brand-ink">units</span> with optional unit IDs and metadata</li>
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
      </div>

      {state.error ? (
        <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{state.error}</p>
      ) : null}

      {state.success ? (
        <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{state.success}</p>
      ) : null}

      <Button disabled={pending} type="submit">
        {pending ? "Uploading products..." : "Create products from JSON"}
      </Button>
    </form>
  );
}

