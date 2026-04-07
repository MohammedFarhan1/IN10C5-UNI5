export type Role = "customer" | "seller" | "admin";

export type ProductUnitStatus = "available" | "sold" | "delivered";
export type OrderStatus = "ordered" | "shipped" | "delivered";

export type ActionState = {
  error?: string;
  success?: string;
};

export type UserProfile = {
  id: string;
  email: string;
  role: Role;
  created_at: string;
};

export type Product = {
  id: string;
  seller_id: string;
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
  status: ProductUnitStatus;
  created_at: string;
};

export type Order = {
  id: string;
  buyer_id: string;
  product_id: string;
  unit_id: string;
  status: OrderStatus;
  created_at: string;
};

export type ProductWithDetails = Product & {
  seller?: Pick<UserProfile, "id" | "email" | "role">;
  units?: ProductUnit[];
};

export type OrderWithDetails = Order & {
  buyer?: Pick<UserProfile, "id" | "email">;
  product?: Pick<Product, "id" | "name" | "price" | "image_url" | "seller_id">;
  unit?: Pick<ProductUnit, "id" | "unit_code" | "status">;
};

export type TrackingDetails = {
  id: string;
  product_id: string;
  unit_code: string;
  status: ProductUnitStatus;
  created_at: string;
  product?: (Pick<
    Product,
    "id" | "name" | "description" | "price" | "image_url" | "total_units" | "seller_id"
  > & {
    seller?: Pick<UserProfile, "id" | "email" | "role">;
  });
  order?: (Pick<Order, "id" | "buyer_id" | "product_id" | "unit_id" | "status" | "created_at"> & {
    buyer?: Pick<UserProfile, "id" | "email">;
  }) | null;
};