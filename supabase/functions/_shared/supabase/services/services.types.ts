import type { Database } from "../database.types.ts";

export type ServiceRow = Database["public"]["Tables"]["services"]["Row"] & {
    woo_product_id?: number | null;
};
export type ServiceInsert = Database["public"]["Tables"]["services"]["Insert"];
export type ServiceUpdate = Database["public"]["Tables"]["services"]["Update"];

export interface ServiceWithImages extends ServiceRow {
    image_url?: string | null;
    images: Array<{ id: string; file_name: string; url: string }>;
    service_provider_name?: string | null;
    service_category_titles?: string[];
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

export interface ServiceInsertPayload extends ServiceInsert {
    image_file?: File | Blob;
    image_base64?: string;
    gallery_images?: string[];
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

export interface ServiceUpdatePayload extends ServiceUpdate {
    image_file?: File | Blob;
    image_base64?: string;
    deleteImage?: boolean;
    gallery_images?: string[];
    deleted_images?: string[];
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
