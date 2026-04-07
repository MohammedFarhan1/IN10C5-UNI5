import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[24px] border border-white/70 bg-white/85 p-4 shadow-soft backdrop-blur sm:rounded-[28px] sm:p-6",
        className
      )}
      {...props}
    />
  );
}
