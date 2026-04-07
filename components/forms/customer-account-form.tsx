"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ActionState, UserProfile } from "@/types";

type CustomerAccountFormProps = {
  action: (
    prevState: ActionState,
    formData: FormData
  ) => Promise<ActionState>;
  profile: UserProfile;
};

const initialState: ActionState = {};

export function CustomerAccountForm({ action, profile }: CustomerAccountFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="email">
            Email
          </label>
          <Input defaultValue={profile.email} disabled id="email" name="email_readonly" />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="full_name">
            Full name
          </label>
          <Input
            defaultValue={profile.full_name ?? ""}
            id="full_name"
            name="full_name"
            placeholder="Riya Sharma"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="mobile_number">
            Mobile number
          </label>
          <Input
            defaultValue={profile.mobile_number ?? ""}
            id="mobile_number"
            inputMode="tel"
            name="mobile_number"
            placeholder="9876543210"
            required
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="address">
            Delivery address
          </label>
          <textarea
            className="min-h-32 w-full rounded-[24px] border border-slate-200 bg-white px-4 py-3 text-sm text-brand-ink outline-none transition placeholder:text-slate-400 focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20"
            defaultValue={profile.address ?? ""}
            id="address"
            name="address"
            placeholder="House no, street, city, state, pincode"
            required
          />
        </div>
      </div>

      {state.error ? (
        <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{state.error}</p>
      ) : null}

      {state.success ? (
        <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {state.success}
        </p>
      ) : null}

      <Button disabled={pending} type="submit">
        {pending ? "Saving account..." : "Save account details"}
      </Button>
    </form>
  );
}
