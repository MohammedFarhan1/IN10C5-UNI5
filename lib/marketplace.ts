import {
  Category,
  FulfillmentType,
  ListingCondition,
  ListingStatus,
  MarketplaceCartItem,
  MarketplaceListing,
  MarketplaceOrder,
  MarketplaceOrderItem,
  MarketplaceOrderStatus,
  MarketplaceOrderTrackingEntry,
  MarketplaceOrderWithDetails,
  MarketplaceProduct,
  MarketplaceProductWithDetails,
  MarketplaceSubOrder,
  MarketplaceVariant,
  UserProfile
} from "@/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const MARKETPLACE_SETUP_GUIDE =
  "Run `supabase/2026_04_10_marketplace_core.sql` in your Supabase SQL editor and add `marketplace` under Supabase Dashboard -> Settings -> API -> Exposed schemas.";

type MarketplaceProductFilters = {
  search?: string;
  categoryId?: string;
  brand?: string;
  sort?: "newest" | "price_asc" | "price_desc";
};

type RawRecord = Record<string, unknown>;

type PostgrestLikeError = {
  code?: string | null;
  message?: string | null;
  hint?: string | null;
  details?: string | null;
};

function asRecord(value: unknown): RawRecord | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as RawRecord)
    : undefined;
}

function asRecords(value: unknown): RawRecord[] {
  return Array.isArray(value)
    ? value.filter((item): item is RawRecord => typeof item === "object" && item !== null)
    : [];
}

function asError(value: unknown): PostgrestLikeError | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  return value as PostgrestLikeError;
}

function formatMarketplaceError(error: unknown) {
  const record = asError(error);
  const message = record?.message ?? "";
  const code = record?.code ?? "";
  const combined = `${code} ${message}`.toLowerCase();

  if (
    combined.includes("marketplace") &&
    (
      combined.includes("schema") ||
      combined.includes("relation") ||
      combined.includes("column") ||
      combined.includes("cache") ||
      code === "PGRST106" ||
      code === "42P01" ||
      code === "42703"
    )
  ) {
    return `${MARKETPLACE_SETUP_GUIDE}${message ? ` Supabase said: ${message}` : ""}`;
  }

  return `${MARKETPLACE_SETUP_GUIDE}${message ? ` Supabase said: ${message}` : ""}`;
}

export async function getMarketplaceAvailability() {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .schema("marketplace")
    .from("products")
    .select("id", { head: true, count: "exact" });

  if (error) {
    return {
      available: false,
      message: formatMarketplaceError(error)
    };
  }

  return {
    available: true,
    message: ""
  };
}

function asString(value: unknown) {
  return typeof value === "string" ? value : value == null ? "" : String(value);
}

function asNullableString(value: unknown) {
  return value == null ? null : String(value);
}

function asNumber(value: unknown) {
  return typeof value === "number" ? value : Number(value ?? 0);
}

function asStringMap(value: unknown) {
  const record = asRecord(value);

  if (!record) {
    return null;
  }

  const entries = Object.entries(record)
    .map(([key, entryValue]) => [key, entryValue == null ? "" : String(entryValue)] as const)
    .filter(([, entryValue]) => entryValue.trim().length > 0);

  return entries.length > 0 ? Object.fromEntries(entries) : null;
}

function asFulfillmentType(value: unknown): FulfillmentType {
  return asString(value) === "platform" ? "platform" : "seller";
}

function asListingCondition(value: unknown): ListingCondition {
  const condition = asString(value);
  if (condition === "refurbished" || condition === "used") {
    return condition;
  }

  return "new";
}

function asListingStatus(value: unknown): ListingStatus {
  const status = asString(value);
  if (status === "draft" || status === "inactive" || status === "archived") {
    return status;
  }

  return "active";
}

function asMarketplaceOrderStatus(value: unknown): MarketplaceOrderStatus {
  const status = asString(value);
  if (
    status === "confirmed" ||
    status === "packed" ||
    status === "shipped" ||
    status === "out_for_delivery" ||
    status === "delivered" ||
    status === "cancelled" ||
    status === "returned"
  ) {
    return status;
  }

  return "placed";
}

function mapUserPreview(record: RawRecord | undefined): Pick<UserProfile, "id" | "email"> | undefined {
  if (!record) {
    return undefined;
  }

  return {
    id: asString(record.id),
    email: asString(record.email)
  };
}

function mapCategory(record: RawRecord): Category {
  return {
    id: asString(record.id),
    name: asString(record.name),
    description: asNullableString(record.description),
    created_at: asString(record.created_at)
  };
}

function mapMarketplaceProduct(record: RawRecord): MarketplaceProduct {
  return {
    id: asString(record.id),
    custom_product_id: asNullableString(record.custom_product_id),
    name: asString(record.name),
    brand: asString(record.brand),
    category_id: asNullableString(record.category_id),
    description: asString(record.description),
    primary_image_url: asNullableString(record.primary_image_url),
    gallery_image_urls: Array.isArray(record.gallery_image_urls)
      ? record.gallery_image_urls.map((entry) => String(entry))
      : [],
    metadata: asStringMap(record.metadata),
    created_by: asNullableString(record.created_by),
    created_at: asString(record.created_at),
    updated_at: asString(record.updated_at),
    category: asRecord(record.category) ? mapCategory(asRecord(record.category)!) : undefined
  };
}

function mapMarketplaceVariant(record: RawRecord): MarketplaceVariant {
  return {
    id: asString(record.id),
    product_id: asString(record.product_id),
    custom_variant_id: asNullableString(record.custom_variant_id),
    name: asString(record.name),
    size: asNullableString(record.size),
    color: asNullableString(record.color),
    barcode: asNullableString(record.barcode),
    attributes: asStringMap(record.attributes),
    qr_target_path: asNullableString(record.qr_target_path),
    created_at: asString(record.created_at),
    updated_at: asString(record.updated_at)
  };
}

function mapMarketplaceListing(record: RawRecord): MarketplaceListing {
  return {
    id: asString(record.id),
    variant_id: asString(record.variant_id),
    seller_id: asString(record.seller_id),
    seller_sku: asString(record.seller_sku),
    price: asNumber(record.price),
    mrp: asNumber(record.mrp),
    currency_code: asString(record.currency_code),
    stock_on_hand: asNumber(record.stock_on_hand),
    reserved_stock: asNumber(record.reserved_stock),
    available_stock: asNumber(record.available_stock),
    fulfillment_type: asFulfillmentType(record.fulfillment_type),
    delivery_min_days: asNumber(record.delivery_min_days),
    delivery_max_days: asNumber(record.delivery_max_days),
    gst_percentage: asNumber(record.gst_percentage),
    condition: asListingCondition(record.condition),
    status: asListingStatus(record.status),
    qr_target_path: asNullableString(record.qr_target_path),
    metadata: asStringMap(record.metadata),
    created_at: asString(record.created_at),
    updated_at: asString(record.updated_at),
    seller: asRecord(record.seller)
      ? {
          id: asString(asRecord(record.seller)!.id),
          email: asString(asRecord(record.seller)!.email),
          display_name: asNullableString(asRecord(record.seller)!.display_name),
          business_name: asNullableString(asRecord(record.seller)!.business_name),
          is_active: Boolean(asRecord(record.seller)!.is_active),
          metadata: asStringMap(asRecord(record.seller)!.metadata),
          created_at: asString(asRecord(record.seller)!.created_at),
          updated_at: asString(asRecord(record.seller)!.updated_at)
        }
      : undefined
  };
}

function mapMarketplaceOrder(record: RawRecord): MarketplaceOrder {
  return {
    id: asString(record.id),
    order_id: asString(record.order_id || record.order_number),
    buyer_id: asString(record.buyer_id),
    status: asMarketplaceOrderStatus(record.status),
    currency_code: asString(record.currency_code),
    subtotal_amount: asNumber(record.subtotal_amount),
    shipping_amount: asNumber(record.shipping_amount),
    total_amount: asNumber(record.total_amount),
    shipping_address: asStringMap(record.shipping_address),
    created_at: asString(record.created_at),
    updated_at: asString(record.updated_at),
    buyer: mapUserPreview(asRecord(record.buyer))
  };
}

function mapMarketplaceSubOrder(record: RawRecord): MarketplaceSubOrder {
  return {
    id: asString(record.id),
    order_id: asString(record.order_id),
    seller_id: asString(record.seller_id),
    sub_order_number: asString(record.sub_order_number),
    status: asMarketplaceOrderStatus(record.status),
    fulfillment_type: asFulfillmentType(record.fulfillment_type),
    subtotal_amount: asNumber(record.subtotal_amount),
    shipping_amount: asNumber(record.shipping_amount),
    total_amount: asNumber(record.total_amount),
    created_at: asString(record.created_at),
    updated_at: asString(record.updated_at),
    seller: asRecord(record.seller)
      ? {
          id: asString(asRecord(record.seller)!.id),
          email: asString(asRecord(record.seller)!.email),
          display_name: asNullableString(asRecord(record.seller)!.display_name),
          business_name: asNullableString(asRecord(record.seller)!.business_name),
          is_active: Boolean(asRecord(record.seller)!.is_active),
          metadata: asStringMap(asRecord(record.seller)!.metadata),
          created_at: asString(asRecord(record.seller)!.created_at),
          updated_at: asString(asRecord(record.seller)!.updated_at)
        }
      : undefined
  };
}

function mapMarketplaceOrderItem(record: RawRecord): MarketplaceOrderItem {
  return {
    id: asString(record.id),
    order_id: asString(record.order_id),
    sub_order_id: asString(record.sub_order_id),
    seller_id: asString(record.seller_id),
    listing_id: asString(record.listing_id),
    product_id: asString(record.product_id),
    variant_id: asString(record.variant_id),
    seller_sku: asString(record.seller_sku),
    product_name: asString(record.product_name),
    variant_name: asString(record.variant_name),
    quantity: asNumber(record.quantity),
    unit_price: asNumber(record.unit_price),
    line_total: asNumber(record.line_total),
    status: asMarketplaceOrderStatus(record.status),
    created_at: asString(record.created_at),
    updated_at: asString(record.updated_at),
    seller: asRecord(record.seller)
      ? {
          id: asString(asRecord(record.seller)!.id),
          email: asString(asRecord(record.seller)!.email),
          display_name: asNullableString(asRecord(record.seller)!.display_name),
          business_name: asNullableString(asRecord(record.seller)!.business_name),
          is_active: Boolean(asRecord(record.seller)!.is_active),
          metadata: asStringMap(asRecord(record.seller)!.metadata),
          created_at: asString(asRecord(record.seller)!.created_at),
          updated_at: asString(asRecord(record.seller)!.updated_at)
        }
      : undefined
  };
}

function mapMarketplaceOrderTrackingEntry(record: RawRecord): MarketplaceOrderTrackingEntry {
  return {
    tracking_id: asString(record.tracking_id),
    order_id: asString(record.order_id),
    status: asMarketplaceOrderStatus(record.status),
    timestamp: asString(record.timestamp),
    updated_by: asString(record.updated_by)
  };
}

async function getCategoryMap(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>, categoryIds: string[]) {
  const uniqueCategoryIds = Array.from(new Set(categoryIds.filter(Boolean)));

  if (uniqueCategoryIds.length === 0) {
    return new Map<string, Category>();
  }

  const { data, error } = await supabase
    .from("categories")
    .select("id, name, description, created_at")
    .in("id", uniqueCategoryIds);

  if (error) {
    throw new Error(error.message);
  }

  return new Map(asRecords(data).map((record) => {
    const category = mapCategory(record);
    return [category.id, category] as const;
  }));
}

async function getUserPreviewMap(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userIds: string[]
) {
  const uniqueUserIds = Array.from(new Set(userIds.filter(Boolean)));

  if (uniqueUserIds.length === 0) {
    return new Map<string, Pick<UserProfile, "id" | "email">>();
  }

  const { data, error } = await supabase
    .from("users")
    .select("id, email")
    .in("id", uniqueUserIds);

  if (error) {
    throw new Error(error.message);
  }

  return new Map(
    asRecords(data).map((record) => {
      const preview = mapUserPreview(record);
      return preview ? ([preview.id, preview] as const) : null;
    }).filter((entry): entry is readonly [string, Pick<UserProfile, "id" | "email">] => Boolean(entry))
  );
}

async function hydrateProducts(productRows: RawRecord[]) {
  if (productRows.length === 0) {
    return [] as MarketplaceProductWithDetails[];
  }

  const supabase = await createSupabaseServerClient();
  const productIds = productRows.map((product) => asString(product.id));
  const { data: variantsData, error: variantsError } = await supabase
    .schema("marketplace")
    .from("variants")
    .select("*")
    .in("product_id", productIds)
    .order("created_at");

  if (variantsError) {
    throw new Error(formatMarketplaceError(variantsError));
  }

  const variants = asRecords(variantsData).map(mapMarketplaceVariant);
  const variantIds = variants.map((variant) => variant.id);
  const listingsByVariantId = new Map<string, MarketplaceListing[]>();

  if (variantIds.length > 0) {
    const { data: listingsData, error: listingsError } = await supabase
      .schema("marketplace")
      .from("listings")
      .select("*, seller:sellers(*)")
      .in("variant_id", variantIds)
      .eq("status", "active")
      .order("price");

    if (listingsError) {
      throw new Error(formatMarketplaceError(listingsError));
    }

    for (const listing of asRecords(listingsData).map(mapMarketplaceListing)) {
      const current = listingsByVariantId.get(listing.variant_id) ?? [];
      current.push(listing);
      listingsByVariantId.set(listing.variant_id, current);
    }
  }

  const variantsByProductId = new Map<
    string,
    Array<MarketplaceVariant & { listings?: MarketplaceListing[] }>
  >();

  for (const variant of variants) {
    const current = variantsByProductId.get(variant.product_id) ?? [];
    current.push({
      ...variant,
      listings: listingsByVariantId.get(variant.id) ?? []
    });
    variantsByProductId.set(variant.product_id, current);
  }

  const categoryMap = await getCategoryMap(
    supabase,
    productRows.map((product) => asString(product.category_id))
  );

  return productRows.map((product) => {
    const mappedProduct = mapMarketplaceProduct(product);

    return {
      ...mappedProduct,
      category: mappedProduct.category_id ? categoryMap.get(mappedProduct.category_id) : undefined,
      variants: variantsByProductId.get(mappedProduct.id) ?? []
    };
  });
}

function minListingPrice(product: MarketplaceProductWithDetails) {
  const prices = (product.variants ?? []).flatMap((variant) =>
    (variant.listings ?? []).map((listing) => listing.price)
  );

  return prices.length > 0 ? Math.min(...prices) : Number.MAX_SAFE_INTEGER;
}

function maxListingPrice(product: MarketplaceProductWithDetails) {
  const prices = (product.variants ?? []).flatMap((variant) =>
    (variant.listings ?? []).map((listing) => listing.price)
  );

  return prices.length > 0 ? Math.max(...prices) : 0;
}

export async function getMarketplaceProducts(filters: MarketplaceProductFilters = {}) {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .schema("marketplace")
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (filters.search) {
    query = query.textSearch("search_document", filters.search, {
      type: "websearch"
    });
  }

  if (filters.categoryId) {
    query = query.eq("category_id", filters.categoryId);
  }

  if (filters.brand) {
    query = query.ilike("brand", `%${filters.brand}%`);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(formatMarketplaceError(error));
  }

  const products = await hydrateProducts(asRecords(data));

  if (filters.sort === "price_asc") {
    products.sort((left, right) => minListingPrice(left) - minListingPrice(right));
  }

  if (filters.sort === "price_desc") {
    products.sort((left, right) => maxListingPrice(right) - maxListingPrice(left));
  }

  return products;
}

export async function getMarketplaceProductById(productId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .schema("marketplace")
    .from("products")
    .select("*")
    .eq("id", productId)
    .maybeSingle();

  if (error) {
    throw new Error(formatMarketplaceError(error));
  }

  const record = asRecord(data);

  if (!record) {
    return null;
  }

  const [product] = await hydrateProducts([record]);
  return product ?? null;
}

export async function getMarketplaceSellerListings(sellerId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .schema("marketplace")
    .from("listings")
    .select("*")
    .eq("seller_id", sellerId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(formatMarketplaceError(error));
  }

  return asRecords(data).map(mapMarketplaceListing);
}

export async function getMarketplaceSellerProducts(sellerId: string, search?: string) {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .schema("marketplace")
    .from("products")
    .select("*")
    .eq("created_by", sellerId)
    .order("created_at", { ascending: false });

  if (search) {
    query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,brand.ilike.%${search}%`);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(formatMarketplaceError(error));
  }

  return hydrateProducts(asRecords(data));
}

export async function getMarketplaceSellerProductById(productId: string, sellerId: string) {
  const product = await getMarketplaceProductById(productId);

  if (!product || product.created_by !== sellerId) {
    return null;
  }

  return product;
}

export async function getMarketplaceBuyerOrders(buyerId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: ordersData, error: ordersError } = await supabase
    .schema("marketplace")
    .from("orders")
    .select("*")
    .eq("buyer_id", buyerId)
    .order("created_at", { ascending: false });

  if (ordersError) {
    throw new Error(formatMarketplaceError(ordersError));
  }

  const orderRows = asRecords(ordersData);
  const orderIds = orderRows.map((order) => asString(order.id));
  const buyerMap = await getUserPreviewMap(
    supabase,
    orderRows.map((order) => asString(order.buyer_id))
  );

  if (orderIds.length === 0) {
    return [] as MarketplaceOrderWithDetails[];
  }

  const [
    { data: subordersData, error: subordersError },
    { data: itemsData, error: itemsError },
    { data: trackingData, error: trackingError }
  ] =
    await Promise.all([
      supabase
        .schema("marketplace")
        .from("order_suborders")
        .select("*, seller:sellers(*)")
        .in("order_id", orderIds)
        .order("created_at"),
      supabase
        .schema("marketplace")
        .from("order_items")
        .select("*, seller:sellers(*)")
        .in("order_id", orderIds)
        .order("created_at"),
      supabase
        .schema("marketplace")
        .from("order_tracking")
        .select("*")
        .in(
          "order_id",
          orderRows.map((order) => asString(order.id))
        )
        .order("timestamp")
    ]);

  if (subordersError) {
    throw new Error(formatMarketplaceError(subordersError));
  }

  if (itemsError) {
    throw new Error(formatMarketplaceError(itemsError));
  }

  if (trackingError) {
    throw new Error(formatMarketplaceError(trackingError));
  }

  const subordersByOrderId = new Map<string, MarketplaceSubOrder[]>();

  for (const suborder of asRecords(subordersData).map(mapMarketplaceSubOrder)) {
    const current = subordersByOrderId.get(suborder.order_id) ?? [];
    current.push(suborder);
    subordersByOrderId.set(suborder.order_id, current);
  }

  const itemsByOrderId = new Map<string, MarketplaceOrderItem[]>();

  for (const item of asRecords(itemsData).map(mapMarketplaceOrderItem)) {
    const current = itemsByOrderId.get(item.order_id) ?? [];
    current.push(item);
    itemsByOrderId.set(item.order_id, current);
  }

  const trackingByOrderId = new Map<string, MarketplaceOrderTrackingEntry[]>();

  for (const entry of asRecords(trackingData).map(mapMarketplaceOrderTrackingEntry)) {
    const current = trackingByOrderId.get(entry.order_id) ?? [];
    current.push(entry);
    trackingByOrderId.set(entry.order_id, current);
  }

  return orderRows.map((order) => {
    const mappedOrder = mapMarketplaceOrder({
      ...order,
      buyer: buyerMap.get(asString(order.buyer_id))
    });

    return {
      ...mappedOrder,
      suborders: subordersByOrderId.get(mappedOrder.id) ?? [],
      items: itemsByOrderId.get(mappedOrder.id) ?? [],
      tracking: trackingByOrderId.get(mappedOrder.id) ?? []
    };
  });
}

export async function getMarketplaceSellerOrders(sellerId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: subordersData, error: subordersError } = await supabase
    .schema("marketplace")
    .from("order_suborders")
    .select("*, seller:sellers(*)")
    .eq("seller_id", sellerId)
    .order("created_at", { ascending: false });

  if (subordersError) {
    throw new Error(formatMarketplaceError(subordersError));
  }

  const suborderRows = asRecords(subordersData);
  const orderIds = Array.from(new Set(suborderRows.map((suborder) => asString(suborder.order_id))));

  if (orderIds.length === 0) {
    return [] as MarketplaceOrderWithDetails[];
  }

  const [
    { data: ordersData, error: ordersError },
    { data: itemsData, error: itemsError },
    { data: trackingData, error: trackingError }
  ] =
    await Promise.all([
      supabase
        .schema("marketplace")
        .from("orders")
        .select("*")
        .in("id", orderIds)
        .order("created_at", { ascending: false }),
      supabase
        .schema("marketplace")
        .from("order_items")
        .select("*, seller:sellers(*)")
        .in("sub_order_id", suborderRows.map((suborder) => asString(suborder.id)))
        .order("created_at"),
      supabase
        .schema("marketplace")
        .from("order_tracking")
        .select("*")
        .in("order_id", orderIds)
        .order("timestamp")
    ]);

  if (ordersError) {
    throw new Error(formatMarketplaceError(ordersError));
  }

  if (itemsError) {
    throw new Error(formatMarketplaceError(itemsError));
  }

  if (trackingError) {
    throw new Error(formatMarketplaceError(trackingError));
  }

  const buyerMap = await getUserPreviewMap(
    supabase,
    asRecords(ordersData).map((order) => asString(order.buyer_id))
  );

  const subordersByOrderId = new Map<string, MarketplaceSubOrder[]>();

  for (const suborder of suborderRows.map(mapMarketplaceSubOrder)) {
    const current = subordersByOrderId.get(suborder.order_id) ?? [];
    current.push(suborder);
    subordersByOrderId.set(suborder.order_id, current);
  }

  const itemsByOrderId = new Map<string, MarketplaceOrderItem[]>();

  for (const item of asRecords(itemsData).map(mapMarketplaceOrderItem)) {
    const current = itemsByOrderId.get(item.order_id) ?? [];
    current.push(item);
    itemsByOrderId.set(item.order_id, current);
  }

  const trackingByOrderId = new Map<string, MarketplaceOrderTrackingEntry[]>();

  for (const entry of asRecords(trackingData).map(mapMarketplaceOrderTrackingEntry)) {
    const current = trackingByOrderId.get(entry.order_id) ?? [];
    current.push(entry);
    trackingByOrderId.set(entry.order_id, current);
  }

  return asRecords(ordersData).map((order) => {
    const mappedOrder = mapMarketplaceOrder({
      ...order,
      buyer: buyerMap.get(asString(order.buyer_id))
    });

    return {
      ...mappedOrder,
      suborders: subordersByOrderId.get(mappedOrder.id) ?? [],
      items: itemsByOrderId.get(mappedOrder.id) ?? [],
      tracking: trackingByOrderId.get(mappedOrder.id) ?? []
    };
  });
}

export async function getMarketplaceAdminOrders() {
  const supabase = await createSupabaseServerClient();
  const { data: ordersData, error: ordersError } = await supabase
    .schema("marketplace")
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (ordersError) {
    throw new Error(formatMarketplaceError(ordersError));
  }

  const orderRows = asRecords(ordersData);
  const orderIds = orderRows.map((order) => asString(order.id));
  const buyerMap = await getUserPreviewMap(
    supabase,
    orderRows.map((order) => asString(order.buyer_id))
  );

  if (orderIds.length === 0) {
    return [] as MarketplaceOrderWithDetails[];
  }

  const [
    { data: subordersData, error: subordersError },
    { data: itemsData, error: itemsError },
    { data: trackingData, error: trackingError }
  ] = await Promise.all([
    supabase
      .schema("marketplace")
      .from("order_suborders")
      .select("*, seller:sellers(*)")
      .in("order_id", orderIds)
      .order("created_at"),
    supabase
      .schema("marketplace")
      .from("order_items")
      .select("*, seller:sellers(*)")
      .in("order_id", orderIds)
      .order("created_at"),
    supabase
      .schema("marketplace")
      .from("order_tracking")
      .select("*")
      .in("order_id", orderIds)
      .order("timestamp")
  ]);

  if (subordersError) {
    throw new Error(formatMarketplaceError(subordersError));
  }

  if (itemsError) {
    throw new Error(formatMarketplaceError(itemsError));
  }

  if (trackingError) {
    throw new Error(formatMarketplaceError(trackingError));
  }

  const subordersByOrderId = new Map<string, MarketplaceSubOrder[]>();

  for (const suborder of asRecords(subordersData).map(mapMarketplaceSubOrder)) {
    const current = subordersByOrderId.get(suborder.order_id) ?? [];
    current.push(suborder);
    subordersByOrderId.set(suborder.order_id, current);
  }

  const itemsByOrderId = new Map<string, MarketplaceOrderItem[]>();

  for (const item of asRecords(itemsData).map(mapMarketplaceOrderItem)) {
    const current = itemsByOrderId.get(item.order_id) ?? [];
    current.push(item);
    itemsByOrderId.set(item.order_id, current);
  }

  const trackingByOrderId = new Map<string, MarketplaceOrderTrackingEntry[]>();

  for (const entry of asRecords(trackingData).map(mapMarketplaceOrderTrackingEntry)) {
    const current = trackingByOrderId.get(entry.order_id) ?? [];
    current.push(entry);
    trackingByOrderId.set(entry.order_id, current);
  }

  return orderRows.map((order) => {
    const mappedOrder = mapMarketplaceOrder({
      ...order,
      buyer: buyerMap.get(asString(order.buyer_id))
    });

    return {
      ...mappedOrder,
      suborders: subordersByOrderId.get(mappedOrder.id) ?? [],
      items: itemsByOrderId.get(mappedOrder.id) ?? [],
      tracking: trackingByOrderId.get(mappedOrder.id) ?? []
    };
  });
}

export async function getMarketplaceCartItems(userId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .schema("marketplace")
    .from("cart_items")
    .select(
      `
      *,
      listing:listings (
        *,
        seller:sellers(*),
        variant:variants (
          *,
          product:products (*)
        )
      )
    `
    )
    .eq("user_id", userId)
    .order("created_at");

  if (error) {
    throw new Error(formatMarketplaceError(error));
  }

  const cartRows = asRecords(data);
  const categoryMap = await getCategoryMap(
    supabase,
    cartRows.map((record) => asString(asRecord(asRecord(asRecord(record.listing)?.variant)?.product)?.category_id))
  );

  return cartRows.map((record) => {
    const listingRecord = asRecord(record.listing);
    const variantRecord = asRecord(listingRecord?.variant);
    const productRecord = asRecord(variantRecord?.product);
    const product = productRecord ? mapMarketplaceProduct(productRecord) : undefined;

    return {
      id: asString(record.id),
      user_id: asString(record.user_id),
      listing_id: asString(record.listing_id),
      quantity: asNumber(record.quantity),
      created_at: asString(record.created_at),
      updated_at: asString(record.updated_at),
      listing: listingRecord
        ? {
            ...mapMarketplaceListing(listingRecord),
            variant: variantRecord
              ? {
                  ...mapMarketplaceVariant(variantRecord),
                  product: product
                    ? {
                        ...product,
                        category: product.category_id ? categoryMap.get(product.category_id) : undefined
                      }
                    : undefined
                }
              : undefined
          }
        : undefined
    } satisfies MarketplaceCartItem;
  });
}

export async function addMarketplaceItemToCart(userId: string, listingId: string, quantity: number) {
  const supabase = await createSupabaseServerClient();
  const { data: existingItem, error: fetchError } = await supabase
    .schema("marketplace")
    .from("cart_items")
    .select("id, quantity")
    .eq("user_id", userId)
    .eq("listing_id", listingId)
    .maybeSingle();

  if (fetchError) {
    throw new Error(formatMarketplaceError(fetchError));
  }

  if (existingItem?.id) {
    const { error } = await supabase
      .schema("marketplace")
      .from("cart_items")
      .update({
        quantity: asNumber(existingItem.quantity) + quantity
      })
      .eq("id", existingItem.id);

    if (error) {
      throw new Error(formatMarketplaceError(error));
    }

    return;
  }

  const { error } = await supabase
    .schema("marketplace")
    .from("cart_items")
    .insert({
      user_id: userId,
      listing_id: listingId,
      quantity
    });

  if (error) {
    throw new Error(formatMarketplaceError(error));
  }
}

export async function updateMarketplaceCartItem(cartItemId: string, quantity: number) {
  const supabase = await createSupabaseServerClient();

  if (quantity <= 0) {
    const { error } = await supabase
      .schema("marketplace")
      .from("cart_items")
      .delete()
      .eq("id", cartItemId);

    if (error) {
      throw new Error(formatMarketplaceError(error));
    }

    return;
  }

  const { error } = await supabase
    .schema("marketplace")
    .from("cart_items")
    .update({ quantity })
    .eq("id", cartItemId);

  if (error) {
    throw new Error(formatMarketplaceError(error));
  }
}

export async function removeMarketplaceCartItem(cartItemId: string) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .schema("marketplace")
    .from("cart_items")
    .delete()
    .eq("id", cartItemId);

  if (error) {
    throw new Error(formatMarketplaceError(error));
  }
}

export async function clearMarketplaceCart(userId: string) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .schema("marketplace")
    .from("cart_items")
    .delete()
    .eq("user_id", userId);

  if (error) {
    throw new Error(formatMarketplaceError(error));
  }
}

export async function placeMarketplaceOrder(input: {
  buyerId: string;
  items: Array<{ listing_id: string; quantity: number }>;
  shippingAddress?: Record<string, string>;
}) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .schema("marketplace")
    .rpc("create_order", {
      buyer_uuid: input.buyerId,
      items_json: input.items,
      shipping_address_json: input.shippingAddress ?? null
    });

  if (error) {
    throw new Error(formatMarketplaceError(error));
  }

  return asString(data);
}

export async function cancelMarketplaceOrder(orderId: string, buyerId: string) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .schema("marketplace")
    .rpc("cancel_order", {
      order_uuid: orderId,
      buyer_uuid: buyerId
    });

  if (error) {
    throw new Error(formatMarketplaceError(error));
  }
}
