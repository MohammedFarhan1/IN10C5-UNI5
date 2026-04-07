import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type EmptyStateProps = {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
};

export function EmptyState({
  title,
  description,
  actionHref,
  actionLabel
}: EmptyStateProps) {
  return (
    <Card className="text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-pine">
        Nothing here yet
      </p>
      <h3 className="mt-3 text-2xl font-semibold text-brand-ink">{title}</h3>
      <p className="mx-auto mt-3 max-w-xl text-sm text-slate-600">{description}</p>
      {actionHref && actionLabel ? (
        <div className="mt-6">
          <Link href={actionHref}>
            <Button>{actionLabel}</Button>
          </Link>
        </div>
      ) : null}
    </Card>
  );
}

