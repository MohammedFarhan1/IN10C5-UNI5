"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { ActionState } from "@/types";

type ProductUnitImportFormProps = {
  action: (
    prevState: ActionState,
    formData: FormData
  ) => Promise<ActionState>;
  productId: string;
};

const initialState: ActionState = {};

export function ProductUnitImportForm({ action, productId }: ProductUnitImportFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-5">
      <input name="product_id" type="hidden" value={productId} />

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="manual_units">
            Manual unit lines
          </label>
          <textarea
            className="min-h-40 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-brand-ink outline-none transition placeholder:text-slate-400 focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20"
            id="manual_units"
            name="manual_units"
            placeholder={"UNIT-001 | batch:A1, shelf:Top\nUNIT-002 | {\"batch\":\"A1\",\"color\":\"Black\"}"}
          />
          <p className="text-xs text-slate-500">
            Use one line per unit. Add details after a <span className="font-semibold">|</span> using
            plain text, key/value pairs, or a JSON object.
          </p>
        </div>

        <div className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="units_json">
              JSON payload
            </label>
            <textarea
              className="min-h-28 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-brand-ink outline-none transition placeholder:text-slate-400 focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20"
              id="units_json"
              name="units_json"
              placeholder={'[{"unitId":"UNIT-003","details":{"batch":"A2","size":"Large"}}]'}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="units_json_file">
              JSON file upload
            </label>
            <input
              accept="application/json,.json"
              className="block w-full rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-3 text-sm text-slate-600 file:mr-3 file:rounded-full file:border-0 file:bg-brand-ink file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-slate-900"
              id="units_json_file"
              name="units_json_file"
              type="file"
            />
          </div>
        </div>
      </div>

      {state.error ? (
        <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{state.error}</p>
      ) : null}

      {state.success ? (
        <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{state.success}</p>
      ) : null}

      <Button disabled={pending} type="submit">
        {pending ? "Importing units..." : "Import unit IDs and details"}
      </Button>
    </form>
  );
}
