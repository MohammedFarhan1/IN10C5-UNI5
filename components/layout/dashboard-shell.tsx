import { ReactNode } from "react";
import { Sidebar } from "@/components/layout/sidebar";

type DashboardShellProps = {
  title: string;
  items: Array<{ href: string; label: string }>;
  children: ReactNode;
};

export function DashboardShell({
  title,
  items,
  children
}: DashboardShellProps) {
  return (
    <div className="mx-auto grid max-w-7xl gap-4 px-3 py-6 sm:px-4 md:px-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-6 lg:px-8 lg:py-8">
      <div className="lg:sticky lg:top-28 lg:self-start">
        <Sidebar items={items} title={title} />
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
