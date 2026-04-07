"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type SidebarItem = {
  href: string;
  label: string;
};

type SidebarProps = {
  title: string;
  items: SidebarItem[];
};

export function Sidebar({ title, items }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="rounded-[24px] border border-white/70 bg-white/90 p-4 shadow-soft sm:rounded-[28px] sm:p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-pine">
        {title}
      </p>
      <nav className="mt-4 flex gap-2 overflow-x-auto pb-1 lg:mt-5 lg:block lg:space-y-2 lg:overflow-visible lg:pb-0">
        {items.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              className={cn(
                "block shrink-0 rounded-2xl px-4 py-2.5 text-sm font-medium transition lg:px-4 lg:py-3",
                isActive
                  ? "bg-brand-ink text-white shadow-soft"
                  : "text-slate-600 hover:bg-slate-50 hover:text-brand-ink"
              )}
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
