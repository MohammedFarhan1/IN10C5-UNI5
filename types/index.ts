export type Role = "customer" | "seller" | "admin";

export type ProductUnitStatus = "available" | "sold" | "delivered";
export type OrderStatus = "ordered" | "shipped" | "delivered" | "cancelled";

export type ActionState = {
  error?: string;
  success?: string;
};

export type UserProfile = {
  id: string;
  email: string;
  role: Role;
  full_name: string | null;
  mobile_number: string | null;
  address: string | null;
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
