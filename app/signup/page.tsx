import { redirectIfAuthenticated } from "@/lib/auth";
import { AuthForm } from "@/components/forms/auth-form";
import { Card } from "@/components/ui/card";
import { signupAction } from "@/lib/actions/auth";

export default async function SignupPage() {
  await redirectIfAuthenticated();

  return (
    <div className="flex min-h-[calc(100vh-5rem)] items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
      <Card className="w-full max-w-[560px] rounded-[28px] px-5 py-6 sm:px-7 sm:py-7">
        <div className="space-y-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-pine">
              New account
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-brand-ink sm:text-3xl">Sign up</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Follow the guided onboarding flow for your account type. Seller accounts start in review
              mode, while customer accounts can continue immediately.
            </p>
            <div className="mt-5">
              <AuthForm action={signupAction} mode="signup" />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
