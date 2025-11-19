import type { SupabaseClient } from "npm:@supabase/supabase-js";
import type {
    EnrichedServiceCategory,
    ServiceCategoryInsert,
    ServiceCategoryRow,
    ServiceCategoryUpdate,
} from "./service_categories.types.ts";

export class SupabaseServiceCategoriesService {
    private static normalizeParentIds(parentIds: unknown): string[] {
        if (!parentIds) return [];
        if (Array.isArray(parentIds)) {
            return parentIds
                .filter((v) => typeof v === "string" && v.trim().length > 0)
                .map((v) => v.trim());
        }
        if (typeof parentIds === "string" && parentIds.trim().length > 0) {
            return [parentIds.trim()];
        }
        return [];
    }

    static async create(
        client: SupabaseClient,
        payload: Partial<ServiceCategoryInsert> & Record<string, unknown>,
    ): Promise<ServiceCategoryRow> {
        const parent_ids = this.normalizeParentIds((payload as { parent_ids?: unknown }).parent_ids);

        const toInsert: ServiceCategoryInsert = {
            // required fields are assumed (e.g., name)
            ...(payload as ServiceCategoryInsert),
            parent_ids,
        };

        const { data, error } = await client
            .from("service_categories")
            .insert(toInsert)
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to create service category: ${error.message}`);
        }
        return data as ServiceCategoryRow;
    }

    static async getById(
        client: SupabaseClient,
        id: string,
    ): Promise<EnrichedServiceCategory | null> {
        const { data, error } = await client
            .from("service_categories")
            .select("*")
            .eq("id", id)
            .is("deleted_at", null)
            .single();

        if (error) {
            // PGRST116 = No rows found
            // deno-lint-ignore no-explicit-any
            const anyErr = error as any;
            if (anyErr.code === "PGRST116") return null;
            throw new Error(`Failed to get service category: ${error.message}`);
        }

        let parentNames: string[] = [];
        if (data.parent_ids && data.parent_ids.length > 0) {
            try {
                const { data: parentData } = await client
                    .from("service_categories")
                    .select("id, name")
                    .in("id", data.parent_ids)
                    .is("deleted_at", null);

                if (parentData) {
                    const parentMap = new Map(parentData.map((p) => [p.id, p.name]));
                    parentNames = data.parent_ids
                        .map((pid: string) => parentMap.get(pid))
                        .filter((name): name is string => typeof name !== "undefined");
                }
            } catch (_e) {
                parentNames = [];
            }
        }

        return { ...(data as ServiceCategoryRow), parent_names: parentNames };
    }

    static async list(
        client: SupabaseClient,
        options: {
            limit?: number;
            offset?: number;
            search?: string;
            hierarchical?: boolean;
            parentsOnly?: boolean;
            parentId?: string;
        } = {},
    ): Promise<{ data: (EnrichedServiceCategory | (EnrichedServiceCategory & { children: EnrichedServiceCategory[] }))[]; count: number }> {
        const {
            limit = 20,
            offset = 0,
            search,
            hierarchical,
            parentsOnly,
            parentId,
        } = options;

        let query = client
            .from("service_categories")
            .select("*", { count: "exact" })
            .is("deleted_at", null);

        if (search) {
            query = query.or(`name.ilike.%${search}%`);
        }

        if (parentsOnly) {
            // parent_ids is null OR empty array {}
            query = query.or("parent_ids.is.null,parent_ids.eq.{}");
        }

        if (parentId) {
            query = query.contains("parent_ids", [parentId]); // uuid[] contains given id
        }

        const { data, error, count } = hierarchical
            ? await query.order("name", { ascending: true })
            : await query.order("name", { ascending: true }).range(offset, offset + limit - 1);

        if (error) {
            throw new Error(`Failed to list service categories: ${error.message}`);
        }

        const enrichedData: EnrichedServiceCategory[] = await Promise.all(
            (data || []).map(async (item) => {
                let parentNames: string[] = [];
                if (item.parent_ids && item.parent_ids.length > 0) {
                    try {
                        const { data: parentData } = await client
                            .from("service_categories")
                            .select("id, name")
                            .in("id", item.parent_ids)
                            .is("deleted_at", null);

                        if (parentData) {
                            const parentMap = new Map(parentData.map((p) => [p.id, p.name]));
                            parentNames = item.parent_ids
                                .map((pid: string) => parentMap.get(pid))
                                .filter((name): name is string => typeof name !== "undefined");
                        }
                    } catch (_e) {
                        parentNames = [];
                    }
                }
                return { ...(item as ServiceCategoryRow), parent_names: parentNames };
            }),
        );

        if (hierarchical) {
            return {
                data: this.buildHierarchy(enrichedData),
                count: count || 0,
            };
        }

        return {
            data: enrichedData,
            count: count || 0,
        };
    }

    static buildHierarchy(
        categories: EnrichedServiceCategory[],
    ): (EnrichedServiceCategory & { children: EnrichedServiceCategory[] })[] {
        const categoryMap = new Map<string, EnrichedServiceCategory & { children: EnrichedServiceCategory[] }>();
        const roots: (EnrichedServiceCategory & { children: EnrichedServiceCategory[] })[] = [];

        categories.forEach((c) => {
            categoryMap.set(c.id as string, { ...c, children: [] });
        });

        categories.forEach((c) => {
            const node = categoryMap.get(c.id as string)!;

            const children = categories.filter(
                (other) =>
                    Array.isArray(other.parent_ids) &&
                    other.parent_ids.includes(c.id as string) &&
                    other.id !== c.id,
            );

            children.forEach((child) => {
                const childNode = categoryMap.get(child.id as string)!;
                node.children.push(childNode);
            });

            node.children.sort((a, b) => (a.name || "").localeCompare(b.name || ""));

            if (!c.parent_ids || c.parent_ids.length === 0) {
                roots.push(node);
            }
        });

        roots.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        return roots;
    }

    static async update(
        client: SupabaseClient,
        id: string,
        payload: Partial<ServiceCategoryUpdate> & Record<string, unknown>,
    ): Promise<ServiceCategoryRow> {
        const parent_ids = this.normalizeParentIds((payload as { parent_ids?: unknown }).parent_ids);

        const toUpdate: Partial<ServiceCategoryUpdate> = {
            ...(payload as ServiceCategoryUpdate),
            parent_ids,
        };

        const { data, error } = await client
            .from("service_categories")
            .update(toUpdate)
            .eq("id", id)
            .is("deleted_at", null)
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to update service category: ${error.message}`);
        }
        return data as ServiceCategoryRow;
    }

    static async softDelete(client: SupabaseClient, id: string) {
        const { data: children, error: childrenError } = await client
            .from("service_categories")
            .select("id")
            .contains("parent_ids", [id])
            .is("deleted_at", null);

        if (childrenError) {
            throw new Error(`Failed to check for child categories: ${childrenError.message}`);
        }
        if (children && children.length > 0) {
            throw new Error(`Cannot delete category with child categories. Found ${children.length} children.`);
        }

        const now = new Date().toISOString();

        const { data, error } = await client
            .from("service_categories")
            .update({ deleted_at: now, updated_at: now })
            .eq("id", id)
            .is("deleted_at", null)
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to delete service category: ${error.message}`);
        }
        return data;
    }
}
