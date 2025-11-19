import { SupabaseClient } from "../supabaseClient.ts";
import type {
    ServiceProviderInsert,
    ServiceProviderRow,
    ServiceProviderUpdate,
} from "./service_providers.types.ts";
import { SupabaseFunctionUtils } from "../supabaseFunctionUtils.ts";

export class SupabaseServiceProvidersService {
    static async create(
        client: SupabaseClient,
        payload: ServiceProviderInsert,
    ): Promise<ServiceProviderRow> {
        const { data, error } = await client
            .from("service_providers")
            .insert(payload)
            .select()
            .single();

        if (error) {
            throw new Error(
                `Failed to create service provider: ${error.message}`,
            );
        }

        return data;
    }

    static async getById(
        client: SupabaseClient,
        id: string,
    ): Promise<ServiceProviderRow | null> {
        const { data, error } = await client
            .from("service_providers")
            .select("*")
            .eq("id", id)
            .is("deleted_at", null)
            .single();

        if (error) {
            if (error.code === "PGRST116") {
                return null;
            }
            throw new Error(`Failed to get service provider: ${error.message}`);
        }

        return data;
    }

    static async list(
        client: SupabaseClient,
        options: {
            limit?: number;
            offset?: number;
            search?: string;
        } = {},
    ): Promise<{ data: ServiceProviderRow[]; count: number }> {
        const { limit = 20, offset = 0, search } = options;

        let query = client
            .from("service_providers")
            .select("*", { count: "exact" })
            .is("deleted_at", null);

        if (search) {
            query = query.or(
                `name.ilike.%${search}%,description.ilike.%${search}%`,
            );
        }

        const { data, error, count } = await query
            .order("created_at", { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            throw new Error(
                `Failed to list service providers: ${error.message}`,
            );
        }

        return {
            data: data || [],
            count: count || 0,
        };
    }

    static async update(
        client: SupabaseClient,
        id: string,
        payload: ServiceProviderUpdate,
    ): Promise<ServiceProviderRow> {
        const { data, error } = await client
            .from("service_providers")
            .update(payload)
            .eq("id", id)
            .select()
            .single();

        if (error) {
            throw new Error(
                `Failed to update service provider: ${error.message}`,
            );
        }

        return data;
    }

    static async softDelete(
        client: SupabaseClient,
        id: string,
    ): Promise<ServiceProviderRow> {
        const { data, error } = await client
            .from("service_providers")
            .update({ deleted_at: new Date().toISOString() })
            .eq("id", id)
            .select()
            .single();

        if (error) {
            throw new Error(
                `Failed to delete service provider: ${error.message}`,
            );
        }

        return data;
    }

    /**
     * Enrich service provider row with related data
     */
    static async enrichServiceProviderRow(
        client: SupabaseClient,
        row: ServiceProviderRow,
    ): Promise<
        ServiceProviderRow & {
            contact_name?: string;
            image_url?: string;
        }
    > {
        const enriched = { ...row } as ServiceProviderRow & {
            contact_name?: string;
            image_url?: string;
        };

        const promises: Array<Promise<void>> = [];

        // Contact name
        if (row.contact_id) {
            promises.push((async () => {
                const { data } = await client
                    .from("contacts")
                    .select("first_name, last_name")
                    .eq("id", row.contact_id)
                    .single();
                if (data) {
                    const first =
                        (data as { first_name?: string | null }).first_name ||
                        "";
                    const last =
                        (data as { last_name?: string | null }).last_name || "";
                    const name = `${first} ${last}`.trim();
                    if (name.length > 0) enriched.contact_name = name;
                }
            })());
        }

        // Image URL from featured_image_path
        if (row.featured_image_path) {
            const url = SupabaseFunctionUtils.buildPublicImageUrl(
                "service-providers-images",
                row.featured_image_path,
            );
            enriched.image_url = url;
        }

        await Promise.all(promises);
        return enriched;
    }

    /**
     * List enriched service providers with contact and image data
     */
    static async listEnriched(
        client: SupabaseClient,
        q: {
            limit?: number;
            offset?: number;
            search?: string;
        },
    ): Promise<{ data: ServiceProviderRow[]; count: number }> {
        const { data, count } = await this.list(client, q);
        const enriched = await Promise.all(
            data.map((row) => this.enrichServiceProviderRow(client, row)),
        );
        return { data: enriched, count };
    }

    /**
     * Create service provider with featured image
     */
    static async createWithImage(
        client: SupabaseClient,
        payload: ServiceProviderInsert,
        imageData?: File | Blob | string,
        fileName?: string,
    ): Promise<ServiceProviderRow> {
        // First create the service provider
        const serviceProvider = await this.create(client, payload);

        // Handle image upload if provided
        if (imageData && fileName) {
            const uploadResult = await SupabaseFunctionUtils.uploadImage(
                client,
                imageData,
                fileName,
                "service-providers-images",
                serviceProvider.id,
            );

            if (uploadResult) {
                // Update the service provider with the image path
                const updated = await this.update(client, serviceProvider.id, {
                    featured_image_path: uploadResult.path,
                });
                return updated;
            }
        }

        return serviceProvider;
    }

    /**
     * Update service provider with featured image handling
     */
    static async updateWithImage(
        client: SupabaseClient,
        id: string,
        payload: ServiceProviderUpdate,
        imageData?: File | Blob | string,
        fileName?: string,
        shouldDeleteImage?: boolean,
    ): Promise<ServiceProviderRow> {
        // Get current service provider to check for existing image
        const current = await this.getById(client, id);
        if (!current) {
            throw new Error("Service provider not found");
        }

        const updatePayload = { ...payload };

        // Handle image operations
        if (shouldDeleteImage) {
            // Delete existing image if it exists
            if (current.featured_image_path) {
                await SupabaseFunctionUtils.deleteImage(
                    client,
                    "service-providers-images",
                    current.featured_image_path,
                );
                updatePayload.featured_image_path = null;
            }
        } else if (imageData && fileName) {
            // Handle new image upload
            const uploadResult = await SupabaseFunctionUtils
                .handleFeaturedImageUpload(
                    client,
                    imageData,
                    fileName,
                    "service-providers-images",
                    id,
                    current.featured_image_path,
                );

            if (uploadResult) {
                updatePayload.featured_image_path = uploadResult.path;
            }
        }

        // Update the service provider
        return await this.update(client, id, updatePayload);
    }

    /**
     * Delete service provider with image cleanup
     */
    static async deleteWithImageCleanup(
        client: SupabaseClient,
        id: string,
    ): Promise<ServiceProviderRow> {
        // Get current service provider to check for existing image
        const current = await this.getById(client, id);
        if (!current) {
            throw new Error("Service provider not found");
        }

        // Delete existing image if it exists
        if (current.featured_image_path) {
            await SupabaseFunctionUtils.deleteImage(
                client,
                "service-providers-images",
                current.featured_image_path,
            );
        }

        // Soft delete the service provider
        return await this.softDelete(client, id);
    }
}
