import Link from "next/link";
import { cn, getQrCodeUrl } from "@/lib/utils";

type QrCodePreviewProps = {
  href: string;
  title: string;
  description?: string;
  size?: number;
  className?: string;
};

export function QrCodePreview({
  href,
  title,
  description,
  size = 180,
  className
}: QrCodePreviewProps) {
  return (
    <div className={cn("rounded-lg border border-slate-200 bg-white p-4", className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <img
          alt={`${title} QR code`}
          className="h-32 w-32 rounded-md border border-slate-100 object-contain"
          height={size}
          loading="lazy"
          src={getQrCodeUrl(href, size)}
          width={size}
        />
        <div className="space-y-2 min-w-0">
          <p className="text-sm font-semibold text-brand-ink">{title}</p>
          {description ? <p className="text-sm text-slate-600">{description}</p> : null}
          <Link
            className="break-all text-sm font-medium text-brand-pine hover:text-brand-ink"
            href={href}
            target="_blank"
          >
            {href}
          </Link>
        </div>
      </div>
    </div>
  );
}
