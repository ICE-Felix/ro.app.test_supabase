import type { Database } from "../database.types.ts";

export type Tables<T extends keyof Database["public"]["Tables"]> =
    Database["public"]["Tables"][T]["Row"];
export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
    Database["public"]["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
    Database["public"]["Tables"][T]["Update"];

export type ServiceProviderRow = Tables<"service_providers">;
export type ServiceProviderInsert = TablesInsert<"service_providers">;
export type ServiceProviderUpdate = TablesUpdate<"service_providers">;
