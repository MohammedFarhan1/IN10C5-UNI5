import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function UnauthorizedPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center md:px-6 lg:px-8">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-pine">
        Access denied
      </p>
      <h1 className="mt-4 text-4xl font-semibold text-brand-ink">You do not have permission to view this page.</h1>
      <p className="mt-4 text-sm leading-7 text-slate-600">
        Sign in with an account that matches the required role for this area.
      </p>
      <div className="mt-8">
        <Link href="/login">
          <Button>Go to login</Button>
        </Link>
      </div>
    </div>
  );
}