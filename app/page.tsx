import { OffersBanner } from "@/components/home/offers-banner";
import { ProductCard } from "@/components/products/product-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getCategories, getHomepageProducts } from "@/lib/data";

type HomePageProps = {
  searchParams?: Promise<{
    q?: string;
    stock?: string;
    sort?: string;
    maxPrice?: string;
    category?: string;
  }>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const query = params?.q?.trim() ?? "";
  const stock =
    params?.stock === "in_stock" || params?.stock === "sold_out"
      ? params.stock
      : "all";
  const sort =
    params?.sort === "price_asc" || params?.sort === "price_desc"
      ? params.sort
      : "newest";
  const maxPrice = params?.maxPrice ? Number(params.maxPrice) : undefined;
  const safeMaxPrice =
    typeof maxPrice === "number" && Number.isFinite(maxPrice) && maxPrice > 0
      ? maxPrice
      : undefined;
  const category = params?.category?.trim() ?? "";

  const products = await getHomepageProducts({
    search: query,
    stock,
    sort,
    maxPrice: safeMaxPrice,
    category: category || undefined
  });
  const categories = await getCategories();

  return (
    <div className="mx-auto max-w-7xl px-3 py-6 sm:px-4 md:px-6 lg:px-8 lg:py-8">
      <OffersBanner />

      <section className="mt-10">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-pine">
              Product catalog
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-brand-ink sm:text-3xl">
              Discover trackable inventory
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              {query
                ? `Showing results for "${query}".`
                : "Browse the current marketplace inventory with unit-aware stock counts."}
            </p>
          </div>
          <p className="text-sm text-slate-500">{products.length} products listed</p>
        </div>

        <Card className="mt-6">
          <form className="grid gap-4 sm:grid-cols-2 md:grid-cols-[1.1fr_180px_180px_180px_140px_auto] md:items-end">
            {query ? <input name="q" type="hidden" value={query} /> : null}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="maxPrice">
                Max price
              </label>
              <Input
                defaultValue={safeMaxPrice?.toString() ?? ""}
                id="maxPrice"
                min="1"
                name="maxPrice"
                placeholder="e.g. 3000"
                type="number"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="category">
                Category
              </label>
              <select
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-brand-ink outline-none focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20"
                defaultValue={category}
                id="category"
                name="category"
              >
                <option value="">All categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="stock">
                Stock
              </label>
              <select
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-brand-ink outline-none focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20"
                defaultValue={stock}
                id="stock"
                name="stock"
              >
                <option value="all">All products</option>
                <option value="in_stock">In stock</option>
                <option value="sold_out">Sold out</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="sort">
                Sort by
              </label>
              <select
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-brand-ink outline-none focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20"
                defaultValue={sort}
                id="sort"
                name="sort"
              >
                <option value="newest">Newest</option>
                <option value="price_asc">Price: low to high</option>
                <option value="price_desc">Price: high to low</option>
              </select>
            </div>

            <div className="sm:col-span-2 md:col-span-2 flex flex-wrap gap-3">
              <Button type="submit">Apply filters</Button>
              <a
                className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-brand-ink transition hover:bg-slate-50"
                href={query ? `/?q=${encodeURIComponent(query)}` : "/"}
              >
                Reset
              </a>
            </div>
          </form>
        </Card>

        {products.length === 0 ? (
          <div className="mt-8 rounded-[28px] border border-dashed border-slate-300 bg-white/70 p-10 text-center text-slate-600">
            No products matched this search yet.
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-3 xl:gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
