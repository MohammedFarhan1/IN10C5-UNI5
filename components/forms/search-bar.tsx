"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams(searchParams.toString());

    if (query.trim()) {
      params.set("q", query.trim());
    } else {
      params.delete("q");
    }

    const nextQuery = params.toString();
    router.push(nextQuery ? `/?${nextQuery}` : "/");
  }

  return (
    <form className="flex w-full items-center gap-2" onSubmit={onSubmit}>
      <Input
        aria-label="Search products"
        className="min-w-0 rounded-full bg-white/80 text-sm"
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search products"
        value={query}
      />
      <Button className="shrink-0 px-3 sm:px-4" type="submit" variant="secondary">
        Search
      </Button>
    </form>
  );
}
