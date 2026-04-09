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

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700" htmlFor="manual_units">
          Manual unit lines
        </label>
        <textarea
          className="min-h-40 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-brand-ink outline-none transition placeholder:text-slate-400 focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20"
          id="manual_units"
          name="manual_units"
          placeholder={"UNIT-001 | batch:A1, shelf:Top\nUNIT-002 | batch:A1, color:Black"}
          required
        />
        <p className="text-xs text-slate-500">
          Enter one unit per line. Format: UNIT-ID | details (optional). Details can be simple text or key:value pairs separated by commas.
        </p>
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
