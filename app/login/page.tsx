import { redirectIfAuthenticated } from "@/lib/auth";
import { AuthForm } from "@/components/forms/auth-form";
import { Card } from "@/components/ui/card";
import { loginAction } from "@/lib/actions/auth";
import { ADMIN_DEMO } from "@/lib/constants";

export default async function LoginPage() {
  await redirectIfAuthenticated();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 md:px-6 lg:px-8">
      <div className="grid gap-6 md:grid-cols-[1.1fr_420px]">
        <div className="rounded-[32px] bg-brand-ink p-8 text-white shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-gold">
            Welcome back
          </p>
          <h1 className="mt-4 text-4xl font-semibold">Sign in to uni5</h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300">
            Buyers can track purchases at the unit level, sellers can create traceable inventory,
            and admins can oversee the whole marketplace.
          </p>

          <div className="mt-8 rounded-[28px] bg-white/10 p-5">
            <p className="text-sm font-semibold text-white">Demo admin credentials</p>
            <p className="mt-3 text-sm text-slate-200">Email: {ADMIN_DEMO.email}</p>
            <p className="text-sm text-slate-200">Password: {ADMIN_DEMO.password}</p>
          </div>
        </div>

        <Card>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-pine">
            Account access
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-brand-ink">Log in</h2>
          <p className="mt-3 text-sm text-slate-600">
            Use your customer, seller, or admin credentials to continue.
          </p>
          <div className="mt-6">
            <AuthForm action={loginAction} mode="login" />
          </div>
        </Card>
      </div>
    </div>
  );
}
