const toneMap: Record<string, string> = {
  available: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  sold: "bg-amber-50 text-amber-700 ring-amber-100",
  delivered: "bg-sky-50 text-sky-700 ring-sky-100",
  ordered: "bg-amber-50 text-amber-700 ring-amber-100",
  placed: "bg-amber-50 text-amber-700 ring-amber-100",
  confirmed: "bg-cyan-50 text-cyan-700 ring-cyan-100",
  packed: "bg-orange-50 text-orange-700 ring-orange-100",
  shipped: "bg-violet-50 text-violet-700 ring-violet-100",
  out_for_delivery: "bg-blue-50 text-blue-700 ring-blue-100",
  cancelled: "bg-rose-50 text-rose-700 ring-rose-100",
  returned: "bg-slate-100 text-slate-700 ring-slate-200",
  partially_shipped: "bg-indigo-50 text-indigo-700 ring-indigo-100",
  customer: "bg-slate-100 text-slate-700 ring-slate-200",
  seller: "bg-teal-50 text-teal-700 ring-teal-100",
  admin: "bg-rose-50 text-rose-700 ring-rose-100"
};

export function StatusBadge({ value }: { value: string }) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ring-1 ${
        toneMap[value] ?? "bg-slate-100 text-slate-700 ring-slate-200"
      }`}
    >
      {value.replace(/_/g, " ")}
    </span>
  );
}
