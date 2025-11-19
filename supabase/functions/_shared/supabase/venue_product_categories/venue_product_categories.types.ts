import type { Database } from "../database.types.ts";

export type Tables<T extends keyof Database["public"]["Tables"]> =
    Database["public"]["Tables"][T]["Row"];
export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
    Database["public"]["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
    Database["public"]["Tables"][T]["Update"];

export type VenueProductCategoryRow = Tables<"venue_product_categories">;
export type VenueProductCategoryInsert = TablesInsert<
    "venue_product_categories"
>;
export type VenueProductCategoryUpdate = TablesUpdate<
    "venue_product_categories"
>;

// Extended type for API responses with parent name
export interface VenueProductCategoryWithParent
    extends VenueProductCategoryRow {
    parent_name?: string | null;
}
