import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center md:px-6 lg:px-8">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-pine">
        404
      </p>
      <h1 className="mt-4 text-4xl font-semibold text-brand-ink">That page could not be found.</h1>
      <p className="mt-4 text-sm leading-7 text-slate-600">
        The product, order, or tracking record you requested may not exist.
      </p>
      <div className="mt-8">
        <Link href="/">
          <Button>Return home</Button>
        </Link>
      </div>
    </div>
  );
}