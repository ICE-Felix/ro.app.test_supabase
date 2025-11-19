import type { Database } from "../database.types.ts";

// Base types from database
export type VenueProductRow =
  Database["public"]["Tables"]["venue_products"]["Row"];
export type VenueProductInsert =
  Database["public"]["Tables"]["venue_products"]["Insert"];
export type VenueProductUpdate =
  Database["public"]["Tables"]["venue_products"]["Update"];

// Note: We can now use VenueProductRow directly since ad_hoc_dates is properly typed as Json | null

// Extended types for API responses
export interface VenueProductWithImages extends VenueProductRow {
  image_url?: string | null;
  images: Array<{ id: string; file_name: string; url: string }>;
  // Related data
  venue_name?: string | null;
  venue_product_categories_name?: string[];
  // WooCommerce product fields flattened (excluding id, categories, images)
  woo_name?: string;
  woo_description?: string;
  woo_short_description?: string;
  woo_price?: string;
  woo_regular_price?: string;
  woo_sale_price?: string;
  woo_sku?: string;
  woo_status?: string;
  woo_stock_status?: string;
  woo_stock_quantity?: number;
  woo_manage_stock?: boolean;
  woo_featured?: boolean;
  woo_date_on_sale_from?: string;
  woo_date_on_sale_to?: string;
  woo_tags?: Array<{
    id: number;
    name: string;
    slug: string;
  }>;
}

// Request payload types
export interface VenueProductInsertPayload
  extends Omit<VenueProductInsert, "woo_product_id"> {
  // Image upload fields
  image_file?: File | Blob;
  image_base64?: string;
  // Gallery fields
  gallery_images?: string[];
  // WooCommerce product fields
  woo_name: string;
  woo_description?: string;
  woo_short_description?: string;
  woo_regular_price?: string;
  woo_sale_price?: string;
  woo_sku?: string;
  woo_stock_quantity?: number;
  woo_manage_stock?: boolean;
  woo_base_price?: string;
  woo_status?: string;
  woo_catalog_visibility?: string;
  woo_type?: string;
  woo_featured?: boolean;
  woo_shop_id?: number;
  woo_categories?: Array<{ id: number; name: string; slug: string }>;
  woo_tags?: Array<{ id: number; name: string; slug: string }>;
  woo_date_on_sale_from?: string;
  woo_date_on_sale_to?: string;
  [key: string]: unknown;
}

export interface VenueProductUpdatePayload extends VenueProductUpdate {
  // Image upload fields
  image_file?: File | Blob;
  image_base64?: string;
  deleteImage?: boolean;
  // Gallery fields
  gallery_images?: string[];
  deleted_images?: string[];
  // WooCommerce product fields
  woo_name?: string;
  woo_description?: string;
  woo_short_description?: string;
  woo_regular_price?: string;
  woo_sale_price?: string;
  woo_sku?: string;
  woo_stock_quantity?: number;
  woo_manage_stock?: boolean;
  woo_base_price?: string;
  woo_status?: string;
  woo_catalog_visibility?: string;
  woo_type?: string;
  woo_featured?: boolean;
  woo_shop_id?: number;
  woo_categories?: Array<{ id: number; name: string; slug: string }>;
  woo_tags?: Array<{ id: number; name: string; slug: string }>;
  woo_date_on_sale_from?: string;
  woo_date_on_sale_to?: string;
  [key: string]: unknown;
}
