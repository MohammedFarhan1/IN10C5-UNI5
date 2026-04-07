import {
  OrderStatus,
  OrderWithDetails,
  ProductUnit,
  ProductUnitStatus,
  ProductWithDetails,
  Role,
  TrackingDetails,
  UserProfile
} from "@/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type HomepageProductFilters = {
  search?: string;
  stock?: "all" | "in_stock" | "sold_out";
  maxPrice?: number;
  sort?: "newest" | "price_asc" | "price_desc";
};

type RawRecord = Record<string, unknown>;

function asRecord(value: unknown): RawRecord | undefined {
  if (Array.isArray(value)) {
    const [first] = value;
    return typeof first === "object" && first !== null ? (first as RawRecord) : undefined;
  }

  return typeof value === "object" && value !== null ? (value as RawRecord) : undefined;
}

function asRecords(value: unknown): RawRecord[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (item): item is RawRecord => typeof item === "object" && item !== null
  );
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

function asRole(value: unknown): Role {
  const role = asString(value);
  return role === "seller" || role === "admin" ? role : "customer";
}

function asUnitStatus(value: unknown): ProductUnitStatus {
  const status = asString(value);
  if (status === "sold" || status === "delivered") {
    return status;
  }

  return "available";
}

function asOrderStatus(value: unknown): OrderStatus {
  const status = asString(value);
  if (status === "shipped" || status === "delivered") {
    return status;
  }

  return "ordered";
}

function mapUserPreview(value: unknown) {
  const record = asRecord(value);

  if (!record) {
    return undefined;
  }

  return {
    id: asString(record.id),
    email: asString(record.email),
    role: asRole(record.role)
  };
}

function mapBuyerPreview(value: unknown) {
  const record = asRecord(value);

  if (!record) {
    return undefined;
  }

  return {
    id: asString(record.id),
    email: asString(record.email)
  };
}

function mapUnit(record: RawRecord): ProductUnit {
  return {
    id: asString(record.id),
    product_id: asString(record.product_id),
    unit_code: asString(record.unit_code),
    status: asUnitStatus(record.status),
    created_at: asString(record.created_at)
  };
}

function mapProduct(record: RawRecord): ProductWithDetails {
  return {
    id: asString(record.id),
    seller_id: asString(record.seller_id),
    name: asString(record.name),
    description: asString(record.description),
    price: asNumber(record.price),
    image_url: asNullableString(record.image_url),
    total_units: asNumber(record.total_units),
    created_at: asString(record.created_at),
    seller: mapUserPreview(record.seller),
    units: asRecords(record.units).map(mapUnit)
  };
}

function mapOrder(record: RawRecord): OrderWithDetails {
  const product = asRecord(record.product);
  const unit = asRecord(record.unit);

  return {
    id: asString(record.id),
    buyer_id: asString(record.buyer_id),
    product_id: asString(record.product_id),
    unit_id: asString(record.unit_id),
    status: asOrderStatus(record.status),
    created_at: asString(record.created_at),
    buyer: mapBuyerPreview(record.buyer),
    product: product
      ? {
          id: asString(product.id),
          name: asString(product.name),
          price: asNumber(product.price),
          image_url: asNullableString(product.image_url),
          seller_id: asString(product.seller_id)
        }
      : undefined,
    unit: unit
      ? {
          id: asString(unit.id),
          unit_code: asString(unit.unit_code),
          status: asUnitStatus(unit.status)
        }
      : undefined
  };
}

function mapTracking(record: RawRecord): TrackingDetails {
  const product = asRecord(record.product);
  const order = asRecord(record.order);

  return {
    id: asString(record.id),
    product_id: asString(record.product_id),
    unit_code: asString(record.unit_code),
    status: asUnitStatus(record.status),
    created_at: asString(record.created_at),
    product: product
      ? {
          id: asString(product.id),
          name: asString(product.name),
          description: asString(product.description),
          price: asNumber(product.price),
          image_url: asNullableString(product.image_url),
          total_units: asNumber(product.total_units),
          seller_id: asString(product.seller_id),
          seller: mapUserPreview(product.seller)
        }
      : undefined,
    order: order
      ? {
          id: asString(order.id),
          buyer_id: asString(order.buyer_id),
          product_id: asString(order.product_id),
          unit_id: asString(order.unit_id),
          status: asOrderStatus(order.status),
          created_at: asString(order.created_at),
          buyer: mapBuyerPreview(order.buyer)
        }
      : null
  };
}

export async function getHomepageProducts(filters: HomepageProductFilters = {}) {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("products")
    .select(
      `
      id,
      seller_id,
      name,
      description,
      price,
      image_url,
      total_units,
      created_at,
      seller:users!products_seller_id_fkey (
        id,
        email,
        role
      ),
      units:product_units (
        id,
        product_id,
        unit_code,
        status,
        created_at
      )
    `
    )
    .order("created_at", { ascending: false });

  if (filters.search) {
    query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
  }

  const { data } = await query;
  let products = asRecords(data).map(mapProduct);

  if (typeof filters.maxPrice === "number" && Number.isFinite(filters.maxPrice)) {
    products = products.filter((product) => product.price <= filters.maxPrice!);
  }

  if (filters.stock === "in_stock") {
    products = products.filter(
      (product) =>
        (product.units?.filter((unit) => unit.status === "available").length ?? 0) > 0
    );
  }

  if (filters.stock === "sold_out") {
    products = products.filter(
      (product) =>
        (product.units?.filter((unit) => unit.status === "available").length ?? 0) === 0
    );
  }

  if (filters.sort === "price_asc") {
    products.sort((a, b) => a.price - b.price);
  } else if (filters.sort === "price_desc") {
    products.sort((a, b) => b.price - a.price);
  }

  return products;
}

export async function getProductById(productId: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("products")
    .select(
      `
      id,
      seller_id,
      name,
      description,
      price,
      image_url,
      total_units,
      created_at,
      seller:users!products_seller_id_fkey (
        id,
        email,
        role
      ),
      units:product_units (
        id,
        product_id,
        unit_code,
        status,
        created_at
      )
    `
    )
    .eq("id", productId)
    .maybeSingle();

  const record = asRecord(data);
  return record ? mapProduct(record) : null;
}

export async function getSellerProducts(sellerId: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("products")
    .select(
      `
      id,
      seller_id,
      name,
      description,
      price,
      image_url,
      total_units,
      created_at,
      units:product_units (
        id,
        product_id,
        unit_code,
        status,
        created_at
      )
    `
    )
    .eq("seller_id", sellerId)
    .order("created_at", { ascending: false });

  return asRecords(data).map(mapProduct);
}

export async function getBuyerOrders(buyerId: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("orders")
    .select(
      `
      id,
      buyer_id,
      product_id,
      unit_id,
      status,
      created_at,
      product:products!orders_product_id_fkey (
        id,
        name,
        price,
        image_url,
        seller_id
      ),
      unit:product_units!orders_unit_id_fkey (
        id,
        unit_code,
        status
      )
    `
    )
    .eq("buyer_id", buyerId)
    .order("created_at", { ascending: false });

  return asRecords(data).map(mapOrder);
}

export async function getSellerOrders(sellerId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: ownedProducts } = await supabase
    .from("products")
    .select("id")
    .eq("seller_id", sellerId);

  const productIds = asRecords(ownedProducts).map((product) => asString(product.id));

  if (productIds.length === 0) {
    return [];
  }

  const { data } = await supabase
    .from("orders")
    .select(
      `
      id,
      buyer_id,
      product_id,
      unit_id,
      status,
      created_at,
      buyer:users!orders_buyer_id_fkey (
        id,
        email
      ),
      product:products!orders_product_id_fkey (
        id,
        name,
        price,
        image_url,
        seller_id
      ),
      unit:product_units!orders_unit_id_fkey (
        id,
        unit_code,
        status
      )
    `
    )
    .in("product_id", productIds)
    .order("created_at", { ascending: false });

  return asRecords(data).map(mapOrder);
}

export async function getTrackingDetails(unitCode: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("product_units")
    .select(
      `
      id,
      product_id,
      unit_code,
      status,
      created_at,
      product:products!product_units_product_id_fkey (
        id,
        name,
        description,
        price,
        image_url,
        total_units,
        seller_id,
        seller:users!products_seller_id_fkey (
          id,
          email,
          role
        )
      ),
      order:orders!orders_unit_id_fkey (
        id,
        buyer_id,
        product_id,
        unit_id,
        status,
        created_at,
        buyer:users!orders_buyer_id_fkey (
          id,
          email
        )
      )
    `
    )
    .eq("unit_code", unitCode)
    .maybeSingle();

  const record = asRecord(data);
  return record ? mapTracking(record) : null;
}

export async function getAdminUsers() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("users")
    .select("id, email, role, created_at")
    .order("created_at", { ascending: false });

  return asRecords(data).map((record) => ({
    id: asString(record.id),
    email: asString(record.email),
    role: asRole(record.role),
    created_at: asString(record.created_at)
  })) as UserProfile[];
}

export async function getAdminUserById(userId: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("users")
    .select("id, email, role, created_at")
    .eq("id", userId)
    .maybeSingle();

  const record = asRecord(data);

  if (!record) {
    return null;
  }

  return {
    id: asString(record.id),
    email: asString(record.email),
    role: asRole(record.role),
    created_at: asString(record.created_at)
  } as UserProfile;
}

export async function getAdminProducts() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("products")
    .select(
      `
      id,
      seller_id,
      name,
      description,
      price,
      image_url,
      total_units,
      created_at,
      seller:users!products_seller_id_fkey (
        id,
        email,
        role
      ),
      units:product_units (
        id,
        product_id,
        unit_code,
        status,
        created_at
      )
    `
    )
    .order("created_at", { ascending: false });

  return asRecords(data).map(mapProduct);
}

export async function getSellerOwnedProduct(productId: string, sellerId: string) {
  const product = await getProductById(productId);

  if (!product || product.seller_id !== sellerId) {
    return null;
  }

  return product;
}

export async function getAdminOrders() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("orders")
    .select(
      `
      id,
      buyer_id,
      product_id,
      unit_id,
      status,
      created_at,
      buyer:users!orders_buyer_id_fkey (
        id,
        email
      ),
      product:products!orders_product_id_fkey (
        id,
        name,
        price,
        image_url,
        seller_id
      ),
      unit:product_units!orders_unit_id_fkey (
        id,
        unit_code,
        status
      )
    `
    )
    .order("created_at", { ascending: false });

  return asRecords(data).map(mapOrder);
}

export async function getAdminSummary() {
  const supabase = await createSupabaseServerClient();
  const [{ count: userCount }, { count: productCount }, { count: orderCount }] =
    await Promise.all([
      supabase.from("users").select("*", { count: "exact", head: true }),
      supabase.from("products").select("*", { count: "exact", head: true }),
      supabase.from("orders").select("*", { count: "exact", head: true })
    ]);

  return {
    userCount: userCount ?? 0,
    productCount: productCount ?? 0,
    orderCount: orderCount ?? 0
  };
}
