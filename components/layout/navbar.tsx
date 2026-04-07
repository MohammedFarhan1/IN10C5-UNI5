import Link from "next/link";
import { SearchBar } from "@/components/forms/search-bar";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/lib/constants";
import { Role } from "@/types";
import { logoutAction } from "@/lib/actions/auth";

type NavbarProps = {
  email?: string;
  role?: Role;
};

export function Navbar({ email, role }: NavbarProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-white/60 bg-[#fcfaf5]/85 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-3 py-3 sm:px-4 md:flex-row md:items-center md:justify-between md:gap-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3">
          <Link className="group flex items-center gap-3" href="/">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-ink text-base font-bold text-white shadow-soft transition group-hover:-translate-y-0.5 sm:h-11 sm:w-11 sm:text-lg">
              V
            </div>
            <div className="min-w-0">
              <p className="text-base font-semibold text-brand-ink sm:text-lg">{APP_NAME}</p>
              <p className="text-[10px] uppercase tracking-[0.2em] text-brand-pine sm:text-xs sm:tracking-[0.24em]">
                Unit-level commerce
              </p>
            </div>
          </Link>
          <div className="md:hidden">
            {role ? (
              <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold capitalize text-slate-600 shadow-sm">
                {role}
              </div>
            ) : null}
          </div>
        </div>

        <div className="w-full md:max-w-xl">
          <SearchBar />
        </div>

        <div className="flex flex-wrap items-center gap-2 md:justify-end">
          {role === "seller" ? (
            <Link href="/dashboard">
              <Button className="px-3 py-2 text-xs sm:text-sm" variant="ghost">Dashboard</Button>
            </Link>
          ) : null}
          {role === "customer" ? (
            <Link href="/orders">
              <Button className="px-3 py-2 text-xs sm:text-sm" variant="ghost">My orders</Button>
            </Link>
          ) : null}
          {role === "admin" ? (
            <Link href="/admin">
              <Button className="px-3 py-2 text-xs sm:text-sm" variant="ghost">Admin</Button>
            </Link>
          ) : null}

          {role ? (
            <form action={logoutAction}>
              <Button className="px-3 py-2 text-xs sm:text-sm" type="submit" variant="secondary">
                Logout
              </Button>
            </form>
          ) : (
            <>
              <Link href="/login">
                <Button className="px-3 py-2 text-xs sm:text-sm" variant="ghost">Login</Button>
              </Link>
              <Link href="/signup">
                <Button className="px-3 py-2 text-xs sm:text-sm">Sign up</Button>
              </Link>
            </>
          )}

          {email ? (
            <p className="hidden rounded-full bg-white px-3 py-2 text-xs text-slate-500 md:block">
              {email}
            </p>
          ) : null}
        </div>
      </div>
    </header>
  );
}
