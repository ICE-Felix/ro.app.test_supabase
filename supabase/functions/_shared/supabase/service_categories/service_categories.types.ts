import type { Database } from "../database.types.ts"; // adjust relative path if needed

export type Tables<T extends keyof Database["public"]["Tables"]> =
    Database["public"]["Tables"][T]["Row"];
export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
    Database["public"]["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
    Database["public"]["Tables"][T]["Update"];

export type ServiceCategoryRow = Tables<"service_categories">;
export type ServiceCategoryInsert = TablesInsert<"service_categories">;
export type ServiceCategoryUpdate = TablesUpdate<"service_categories">;

export interface EnrichedServiceCategory extends ServiceCategoryRow {
    parent_names?: string[];
}
