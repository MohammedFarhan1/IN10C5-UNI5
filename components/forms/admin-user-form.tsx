"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ActionState, Role, UserProfile } from "@/types";

type AdminUserFormProps = {
  action: (
    prevState: ActionState,
    formData: FormData
  ) => Promise<ActionState>;
  mode: "create" | "edit";
  user?: Pick<UserProfile, "id" | "email" | "role">;
};

const initialState: ActionState = {};

export function AdminUserForm({ action, mode, user }: AdminUserFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const isEdit = mode === "edit";
  const roles: Role[] = ["customer", "seller", "admin"];

  return (
    <form action={formAction} className="space-y-5">
      {isEdit && user ? <input name="userId" type="hidden" value={user.id} /> : null}

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700" htmlFor="email">
          Email
        </label>
        <Input defaultValue={user?.email ?? ""} id="email" name="email" required type="email" />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700" htmlFor="password">
          {isEdit ? "New password (optional)" : "Password"}
        </label>
        <Input
          id="password"
          minLength={6}
          name="password"
          placeholder={isEdit ? "Leave blank to keep current password" : "Enter password"}
          required={!isEdit}
          type="password"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700" htmlFor="role">
          Role
        </label>
        <select
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-brand-ink outline-none focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20"
          defaultValue={user?.role ?? "customer"}
          id="role"
          name="role"
          required
        >
          {roles.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
      </div>

      {state.error ? (
        <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {state.error}
        </p>
      ) : null}

      <Button disabled={pending} type="submit">
        {pending
          ? isEdit
            ? "Saving user..."
            : "Creating user..."
          : isEdit
            ? "Save user"
            : "Create user"}
      </Button>
    </form>
  );
}
