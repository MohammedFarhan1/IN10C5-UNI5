import { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
};

const variantClasses: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "bg-brand-ink text-white shadow-soft hover:bg-slate-900 disabled:bg-slate-400",
  secondary:
    "bg-white text-brand-ink ring-1 ring-slate-200 hover:bg-slate-50 disabled:text-slate-400",
  ghost:
    "bg-transparent text-brand-ink hover:bg-white/70 disabled:text-slate-400",
  danger:
    "bg-brand-coral text-white hover:bg-[#d95d40] disabled:bg-[#f2b0a2]"
};

export function Button({
  className,
  variant = "primary",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-full px-4 py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-brand-gold/40 disabled:cursor-not-allowed",
        variantClasses[variant],
        className
      )}
      type={type}
      {...props}
    />
  );
}

