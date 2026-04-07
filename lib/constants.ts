import { Role } from "@/types";

export const APP_NAME = "uni5";

export const ADMIN_DEMO = {
  email: "admin@uni5.com",
  password: "admin123"
};

export const ROLE_LABELS: Record<Role, string> = {
  customer: "Customer",
  seller: "Seller",
  admin: "Admin"
};

export const ROLE_HOME: Record<Role, string> = {
  customer: "/",
  seller: "/dashboard",
  admin: "/admin"
};
