import { redirectIfAuthenticated } from "@/lib/auth";
import { AuthForm } from "@/components/forms/auth-form";
import { Card } from "@/components/ui/card";
import { signupAction } from "@/lib/actions/auth";

export default async function SignupPage() {
  await redirectIfAuthenticated();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 md:px-6 lg:px-8">
      <div className="grid gap-6 md:grid-cols-[1fr_420px]">
        <div className="rounded-[32px] bg-white/85 p-8 shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-pine">
            Join uni5
          </p>
          <h1 className="mt-4 text-4xl font-semibold text-brand-ink">Create your marketplace account</h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600">
            Choose a buyer account to purchase trackable units or a seller account to publish products
            that automatically generate individual unit identities.
          </p>
          <div className="mt-6 rounded-[24px] bg-brand-ink p-5 text-sm text-slate-200">
            <p className="font-semibold text-white">Demo signup tip</p>
            <p className="mt-2 leading-7">
              If Supabase shows an email rate limit error, turn off email confirmation in Supabase Auth
              and then you can sign up instantly with a placeholder address like
              <span className="font-semibold text-brand-gold"> user@example.com</span>.
            </p>
          </div>
        </div>

        <Card>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-pine">
            New account
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-brand-ink">Sign up</h2>
          <p className="mt-3 text-sm text-slate-600">
            Supabase Auth powers email and password signup for customers and sellers. Demo signups
            work best with email confirmation disabled.
          </p>
          <div className="mt-6">
            <AuthForm action={signupAction} mode="signup" />
          </div>
        </Card>
      </div>
    </div>
  );
}
