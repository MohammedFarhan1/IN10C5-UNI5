export type Role = "customer" | "seller" | "admin";
export type AccountStatus = "pending" | "approved" | "rejected";

export type ProductUnitStatus = "available" | "sold" | "delivered";
export type OrderStatus = "ordered" | "shipped" | "delivered" | "cancelled";
export type FulfillmentType = "seller" | "platform";
export type ListingCondition = "new" | "refurbished" | "used";
export type ListingStatus = "draft" | "active" | "inactive" | "archived";
export type MarketplaceOrderStatus =
  | "placed"
  | "confirmed"
  | "packed"
  | "shipped"
  | "out_for_delivery"
  | "delivered"
  | "cancelled"
  | "returned";

export type ActionState = {
  error?: string;
  success?: string;
};

export type UserProfile = {
  id: string;
  email: string;
  role: Role;
  full_name: string | null;
  business_name: string | null;
  spoc_name: string | null;
  cin: string | null;
  gst: string | null;
  trademark_url: string | null;
  document_url: string | null;
  mobile_number: string | null;
  address: string | null;
  account_status: AccountStatus;
  created_at: string;
};

export type Product = {
  id: string;
  seller_id: string;
  custom_product_id: string | null;
  name: string;
  description: string;
  price: number;
  image_url: string | null;
  total_units: number;
  created_at: string;
};

export type ProductUnit = {
  id: string;
  product_id: string;
  unit_code: string;
  custom_unit_id: string | null;
  details: Record<string, string> | null;
  status: ProductUnitStatus;
  created_at: string;
};

export type Order = {
  id: string;
  order_group_id: string;
  buyer_id: string;
  product_id: string;
  unit_id: string;
  status: OrderStatus;
  created_at: string;
};

export type Category = {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
};

export type CartItem = {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
  updated_at: string;
  product?: ProductWithDetails;
};

export type ProductWithDetails = Product & {
  seller?: Pick<UserProfile, "id" | "email" | "role">;
  units?: ProductUnit[];
  categories?: Category[];
};

export type OrderWithDetails = Order & {
  buyer?: Pick<UserProfile, "id" | "email">;
  product?: Pick<Product, "id" | "custom_product_id" | "name" | "price" | "image_url" | "seller_id">;
  unit?: Pick<ProductUnit, "id" | "unit_code" | "custom_unit_id" | "status">;
};

export type OrderGroupSummary = {
  order_group_id: string;
  buyer_id: string;
  product_id: string;
  product_name: string;
  product_image_url: string | null;
  quantity: number;
  unit_codes: string[];
  status: "ordered" | "shipped" | "delivered" | "cancelled" | "partially_shipped";
  created_at: string;
  total_amount: number;
};

export type TrackingDetails = {
  id: string;
  product_id: string;
  unit_code: string;
  custom_unit_id: string | null;
  details: Record<string, string> | null;
  status: ProductUnitStatus;
  created_at: string;
  product?: (Pick<
    Product,
    "id" | "custom_product_id" | "name" | "description" | "price" | "image_url" | "total_units" | "seller_id"
  > & {
    seller?: Pick<UserProfile, "id" | "email" | "role">;
  });
  order?: (Pick<
    Order,
    "id" | "order_group_id" | "buyer_id" | "product_id" | "unit_id" | "status" | "created_at"
  > & {
    buyer?: Pick<UserProfile, "id" | "email">;
  }) | null;
};

export type MarketplaceSeller = {
  id: string;
  email: string;
  display_name: string | null;
  business_name: string | null;
  is_active: boolean;
  metadata: Record<string, string> | null;
  created_at: string;
  updated_at: string;
};

export type MarketplaceProduct = {
  id: string;
  custom_product_id: string | null;
  name: string;
  brand: string;
  category_id: string | null;
  description: string;
  primary_image_url: string | null;
  gallery_image_urls: string[];
  metadata: Record<string, string> | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  category?: Category;
};

export type MarketplaceVariant = {
  id: string;
  product_id: string;
  custom_variant_id: string | null;
  name: string;
  size: string | null;
  color: string | null;
  barcode: string | null;
  attributes: Record<string, string> | null;
  qr_target_path: string | null;
  created_at: string;
  updated_at: string;
};

export type MarketplaceListing = {
  id: string;
  variant_id: string;
  seller_id: string;
  seller_sku: string;
  price: number;
  mrp: number;
  currency_code: string;
  stock_on_hand: number;
  reserved_stock: number;
  available_stock: number;
  fulfillment_type: FulfillmentType;
  delivery_min_days: number;
  delivery_max_days: number;
  gst_percentage: number;
  condition: ListingCondition;
  status: ListingStatus;
  qr_target_path: string | null;
  metadata: Record<string, string> | null;
  created_at: string;
  updated_at: string;
  seller?: MarketplaceSeller;
};

export type MarketplaceOrder = {
  id: string;
  order_id: string;
  buyer_id: string;
  status: MarketplaceOrderStatus;
  currency_code: string;
  subtotal_amount: number;
  shipping_amount: number;
  total_amount: number;
  shipping_address: Record<string, string> | null;
  created_at: string;
  updated_at: string;
  buyer?: Pick<UserProfile, "id" | "email">;
};

export type MarketplaceSubOrder = {
  id: string;
  order_id: string;
  seller_id: string;
  sub_order_number: string;
  status: MarketplaceOrderStatus;
  fulfillment_type: FulfillmentType;
  subtotal_amount: number;
  shipping_amount: number;
  total_amount: number;
  created_at: string;
  updated_at: string;
  seller?: MarketplaceSeller;
};

export type MarketplaceOrderTrackingEntry = {
  tracking_id: string;
  order_id: string;
  status: MarketplaceOrderStatus;
  timestamp: string;
  updated_by: string;
};

export type MarketplaceOrderItem = {
  id: string;
  order_id: string;
  sub_order_id: string;
  seller_id: string;
  listing_id: string;
  product_id: string;
  variant_id: string;
  seller_sku: string;
  product_name: string;
  variant_name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  status: MarketplaceOrderStatus;
  created_at: string;
  updated_at: string;
  seller?: MarketplaceSeller;
};

export type MarketplaceProductWithDetails = MarketplaceProduct & {
  variants?: Array<MarketplaceVariant & { listings?: MarketplaceListing[] }>;
};

export type MarketplaceOrderWithDetails = MarketplaceOrder & {
  suborders?: MarketplaceSubOrder[];
  items?: MarketplaceOrderItem[];
  tracking?: MarketplaceOrderTrackingEntry[];
};

export type MarketplaceCartItem = {
  id: string;
  user_id: string;
  listing_id: string;
  quantity: number;
  created_at: string;
  updated_at: string;
  listing?: MarketplaceListing & {
    variant?: MarketplaceVariant & {
      product?: MarketplaceProduct;
    };
  };
};
