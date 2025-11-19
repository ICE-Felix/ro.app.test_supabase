/* eslint-disable @typescript-eslint/no-explicit-any */
import { SupabaseClient } from "../supabaseClient.ts";
import { SupabaseAdmin } from "../supabaseAdmin.ts";
import { SupabaseVenueGeneralAttributesService } from "../venue_general_attributes/supabaseVenueGeneralAttributes.ts";
import { gridDisk, latLngToCell } from "npm:h3-js";
import type {
    Tables as _Tables,
    TablesInsert,
    TablesUpdate,
} from "./venues.types.ts";

export type VenueRow = _Tables<"venues">;
export type VenueInsert = TablesInsert<"venues">;
export type VenueUpdate = TablesUpdate<"venues">;

export interface PaginationMeta {
    total: number;
    limit: number;
    offset: number;
    page: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
}

export interface VenuesQuery {
    venue_category_id?: string;
    include_subcategories?: boolean;
    attribute_ids?: string[];
    attribute_filters?: string[]; // Filter by attribute UUIDs
    search?: string;
    is_active?: boolean;
    has_contact?: boolean;
    has_image?: boolean;
    location_latitude?: number;
    location_longitude?: number;
    radius_km?: number;
    nearby?: boolean; // Simple nearby venues flag
    orderBy?: string; // "distance" for H3-based spatial filtering
    limit?: number;
    offset?: number;
    page?: number;
}

// H3 constants
const H3_RES = 9; // Resolution 9 ≈ city block cells
const EARTH = 6371e3; // Earth radius in meters

// Calculate k for radius at resolution 9 (k ~ radius/140m)
const kForRadiusRes9 = (r: number) => Math.ceil(r / 140);

// Maximum number of H3 cells to avoid URL/compute limits
const MAX_H3_CELLS = 50;

// Check if radius is too large for H3 filtering
const isRadiusTooLargeForH3 = (radiusM: number): boolean => {
    // For radii larger than 5km, use bounding box instead of H3
    if (radiusM > 5000) return true;

    const k = kForRadiusRes9(radiusM);
    // Estimate number of cells (rough approximation)
    const estimatedCells = Math.PI * k * k;
    return estimatedCells > MAX_H3_CELLS;
};

// Calculate bounding box for rough prefiltering
function bbox(lat: number, lon: number, r: number) {
    const dLat = (r / EARTH) * (180 / Math.PI);
    const dLon = (r / (EARTH * Math.cos((lat * Math.PI) / 180))) *
        (180 / Math.PI);
    return {
        minLat: lat - dLat,
        maxLat: lat + dLat,
        minLon: lon - dLon,
        maxLon: lon + dLon,
    };
}

export interface EnrichedVenue extends VenueRow {
    venue_category_titles?: string[];
    attribute_names?: string[];
    attributes?: Array<{
        id: string;
        type: string | null;
        value: string | null;
    }>;
    contact_name?: string;
    image_url?: string;
    image_error?: string;
    distance_m?: number; // Distance in meters when distance ordering is used
}

export class SupabaseVenuesService {
    /**
     * Calculate H3 cell for given coordinates
     */
    static calculateH3Cell(latitude: number, longitude: number): string {
        return latLngToCell(latitude, longitude, H3_RES);
    }

    /**
     * Apply bounding box filtering to queries
     */
    private static applyBoundingBoxFilter(
        dataQuery: any,
        countQuery: any,
        minLat: number,
        maxLat: number,
        minLon: number,
        maxLon: number,
    ): void {
        dataQuery
            .gte("location_latitude", minLat)
            .lte("location_latitude", maxLat)
            .gte("location_longitude", minLon)
            .lte("location_longitude", maxLon)
            .not("location_latitude", "is", null)
            .not("location_longitude", "is", null)
            .order("created_at", { ascending: false });

        countQuery
            .gte("location_latitude", minLat)
            .lte("location_latitude", maxLat)
            .gte("location_longitude", minLon)
            .lte("location_longitude", maxLon)
            .not("location_latitude", "is", null)
            .not("location_longitude", "is", null);
    }

    /**
     * Update venue H3 cell based on coordinates
     */
    static async updateVenueH3(
        client: SupabaseClient,
        venueId: string,
        latitude: number,
        longitude: number,
    ): Promise<void> {
        const h3Cell = this.calculateH3Cell(latitude, longitude);
        await client
            .from("venues")
            .update({ h3: h3Cell })
            .eq("id", venueId);
    }

    static async getById(
        client: SupabaseClient,
        id: string,
    ): Promise<VenueRow | null> {
        const { data, error } = await client
            .from("venues")
            .select("*")
            .eq("id", id)
            .is("deleted_at", null)
            .single();
        if (error) throw error;
        return data as VenueRow;
    }

    private static async getAllSubcategoryIds(
        client: SupabaseClient,
        parentCategoryId: string,
    ): Promise<string[]> {
        const { data: allCategories, error } = await client
            .from("venue_categories")
            .select("id, parent_id")
            .is("deleted_at", null);
        if (error || !allCategories) return [];

        const getAllDescendants = (parentId: string): string[] => {
            const children = allCategories.filter((c) =>
                c.parent_id === parentId
            );
            let descendants = children.map((c) => c.id);
            children.forEach((child) => {
                descendants = [...descendants, ...getAllDescendants(child.id)];
            });
            return descendants;
        };

        return getAllDescendants(parentCategoryId);
    }

    static async list(
        client: SupabaseClient,
        q: VenuesQuery,
    ): Promise<{ data: VenueRow[]; pagination: PaginationMeta }> {
        const limit = q.limit && q.limit > 0 && q.limit <= 100 ? q.limit : 20;
        const page = q.page && q.page >= 1
            ? q.page
            : (q.offset !== undefined ? Math.floor(q.offset / limit) + 1 : 1);
        const offset = q.offset !== undefined ? q.offset : (page - 1) * limit;

        let countQuery = client
            .from("venues")
            .select("*", { count: "exact", head: true })
            .is("deleted_at", null);

        let dataQuery = client
            .from("venues")
            .select("*")
            .is("deleted_at", null);

        if (q.venue_category_id) {
            const includeSubs = q.include_subcategories !== false;
            if (includeSubs) {
                const subIds = await this.getAllSubcategoryIds(
                    client,
                    q.venue_category_id,
                );
                const allIds = [q.venue_category_id, ...subIds];
                dataQuery = dataQuery.overlaps("venue_category_id", allIds);
                countQuery = countQuery.overlaps("venue_category_id", allIds);
            } else {
                dataQuery = dataQuery.contains("venue_category_id", [
                    q.venue_category_id,
                ]);
                countQuery = countQuery.contains("venue_category_id", [
                    q.venue_category_id,
                ]);
            }
        }

        if (q.attribute_ids && q.attribute_ids.length > 0) {
            dataQuery = dataQuery.overlaps("attribute_ids", q.attribute_ids);
            countQuery = countQuery.overlaps("attribute_ids", q.attribute_ids);
        }

        // Filter by attribute UUIDs
        if (q.attribute_filters && q.attribute_filters.length > 0) {
            dataQuery = dataQuery.overlaps(
                "attribute_ids",
                q.attribute_filters,
            );
            countQuery = countQuery.overlaps(
                "attribute_ids",
                q.attribute_filters,
            );
        }

        if (q.search && q.search.trim().length > 0) {
            const pattern = `%${q.search.trim()}%`;
            try {
                dataQuery = dataQuery.or(
                    `name.ilike.${pattern},description.ilike.${pattern}`,
                );
                countQuery = countQuery.or(
                    `name.ilike.${pattern},description.ilike.${pattern}`,
                );
            } catch {
                dataQuery = dataQuery.ilike("name", pattern);
                countQuery = countQuery.ilike("name", pattern);
            }
        }

        // Filter by active status
        if (q.is_active !== undefined) {
            dataQuery = dataQuery.eq("is_active", q.is_active);
            countQuery = countQuery.eq("is_active", q.is_active);
        }

        // Filter by contact presence
        if (q.has_contact !== undefined) {
            if (q.has_contact) {
                dataQuery = dataQuery.not("contact_id", "is", null);
                countQuery = countQuery.not("contact_id", "is", null);
            } else {
                dataQuery = dataQuery.is("contact_id", null);
                countQuery = countQuery.is("contact_id", null);
            }
        }

        // Filter by image presence
        if (q.has_image !== undefined) {
            if (q.has_image) {
                dataQuery = dataQuery.not("image_featured_id", "is", null);
                countQuery = countQuery.not("image_featured_id", "is", null);
            } else {
                dataQuery = dataQuery.is("image_featured_id", null);
                countQuery = countQuery.is("image_featured_id", null);
            }
        }

        // Handle spatial filtering (triggered by nearby=true or orderBy=distance)
        if (
            (q.nearby || q.orderBy === "distance") && q.location_latitude &&
            q.location_longitude
        ) {
            const lat = q.location_latitude;
            const lng = q.location_longitude;
            const radiusM = (q.radius_km || (q.nearby ? 30 : 500)) * 1000; // Convert km to meters (30km for nearby, 500km for distance ordering)

            // Get bounding box for spatial filtering
            const { minLat, maxLat, minLon, maxLon } = bbox(
                lat,
                lng,
                radiusM,
            );

            // Use H3 filtering only for small radii to avoid URL/compute limits
            if (!isRadiusTooLargeForH3(radiusM)) {
                try {
                    // Get H3 cells to query
                    const center = latLngToCell(lat, lng, H3_RES);
                    const cells = gridDisk(center, kForRadiusRes9(radiusM));

                    // Apply H3 spatial filtering with bounding box prefiltering
                    dataQuery = dataQuery
                        .in("h3", cells)
                        .not("h3", "is", null)
                        .gte("location_latitude", minLat)
                        .lte("location_latitude", maxLat)
                        .gte("location_longitude", minLon)
                        .lte("location_longitude", maxLon)
                        .not("location_latitude", "is", null)
                        .not("location_longitude", "is", null)
                        .order("created_at", { ascending: false });

                    countQuery = countQuery
                        .in("h3", cells)
                        .not("h3", "is", null)
                        .gte("location_latitude", minLat)
                        .lte("location_latitude", maxLat)
                        .gte("location_longitude", minLon)
                        .lte("location_longitude", maxLon)
                        .not("location_latitude", "is", null)
                        .not("location_longitude", "is", null);
                } catch (h3Error) {
                    console.error("H3 spatial filtering error:", h3Error);
                    // Fallback to bounding box only
                    SupabaseVenuesService.applyBoundingBoxFilter(
                        dataQuery,
                        countQuery,
                        minLat,
                        maxLat,
                        minLon,
                        maxLon,
                    );
                }
            } else {
                // Use bounding box filtering for larger radii
                console.log(
                    `Using bounding box filtering for radius ${radiusM}m (too large for H3)`,
                );
                SupabaseVenuesService.applyBoundingBoxFilter(
                    dataQuery,
                    countQuery,
                    minLat,
                    maxLat,
                    minLon,
                    maxLon,
                );
            }
        } else {
            // Default ordering
            dataQuery = dataQuery.order("created_at", { ascending: false });
        }

        const countRes = await countQuery;
        const total = countRes.count || 0;

        const { data, error } = await dataQuery.range(
            offset,
            offset + limit - 1,
        );
        if (error) throw error;

        const venues = (data || []) as VenueRow[];

        // No distance calculation needed - H3 filtering handles spatial queries

        const pagination: PaginationMeta = {
            total,
            limit,
            offset,
            page,
            totalPages: Math.ceil(total / limit),
            hasNext: offset + limit < total,
            hasPrevious: offset > 0,
        };

        return { data: venues, pagination };
    }

    static async create(
        client: SupabaseClient,
        payload: Partial<VenueInsert>,
    ): Promise<VenueRow> {
        // Calculate H3 cell if coordinates are provided
        const enrichedPayload = { ...payload } as Record<string, unknown>;
        if (payload.location_latitude && payload.location_longitude) {
            enrichedPayload.h3 = this.calculateH3Cell(
                parseFloat(payload.location_latitude),
                parseFloat(payload.location_longitude),
            );
        }

        const { data, error } = await client
            .from("venues")
            .insert(enrichedPayload)
            .select()
            .single();
        if (error) throw error;
        return data as VenueRow;
    }

    static async update(
        client: SupabaseClient,
        id: string,
        changes: Partial<VenueUpdate>,
    ): Promise<VenueRow> {
        // Recalculate H3 cell if coordinates are being updated
        const enrichedChanges = { ...changes } as Record<string, unknown>;
        if (changes.location_latitude && changes.location_longitude) {
            enrichedChanges.h3 = this.calculateH3Cell(
                parseFloat(changes.location_latitude),
                parseFloat(changes.location_longitude),
            );
        }

        const { data, error } = await client
            .from("venues")
            .update({
                ...enrichedChanges,
                updated_at: new Date().toISOString(),
            })
            .eq("id", id)
            .is("deleted_at", null)
            .select()
            .single();
        if (error) throw error;
        return data as VenueRow;
    }

    static async softDelete(
        client: SupabaseClient,
        id: string,
    ): Promise<{ deleted: boolean; id: string }> {
        const { data, error } = await client
            .from("venues")
            .update({
                deleted_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .eq("id", id)
            .is("deleted_at", null)
            .select()
            .single();
        if (error) throw error;
        return { deleted: true, id: (data as { id: string }).id };
    }

    static async getStorageObjectById(
        bucket: string,
        id: string,
    ): Promise<{ id?: string; name?: string; metadata?: unknown } | null> {
        try {
            const adminClient = SupabaseAdmin.initialize();
            const { data, error } = await adminClient
                .schema("storage")
                .from("objects")
                .select("id, name, metadata")
                .eq("id", id)
                .single();
            if (!error) {
                return data as {
                    id?: string;
                    name?: string;
                    metadata?: unknown;
                };
            }

            const { data: files } = await adminClient.storage.from(bucket).list(
                "",
                { limit: 1000, offset: 0 },
            );
            const found = (files || []).find((
                f: { id?: string; name: string },
            ) => f.id === id || f.name.includes(id));
            return found || null;
        } catch {
            return null;
        }
    }

    static buildPublicImageUrl(
        bucket: string,
        objectPath: string,
    ): string | null {
        const supabaseUrl = Deno.env.get("SUPABASE_URL") as string | undefined;
        if (!supabaseUrl) return null;
        return `${supabaseUrl}/storage/v1/object/public/${bucket}/${objectPath}`;
    }

    static async uploadVenueImage(
        client: SupabaseClient,
        imageData: File | Blob | string,
        fileName: string,
    ): Promise<{ path: string; url: string; id?: string } | null> {
        try {
            let fileData: File | Blob;
            if (typeof imageData === "string") {
                const base64Data = imageData.replace(
                    /^data:image\/[a-z]+;base64,/,
                    "",
                );
                const bytes = Uint8Array.from(
                    atob(base64Data),
                    (c) => c.charCodeAt(0),
                );
                fileData = new Blob([bytes], { type: "image/jpeg" });
            } else {
                fileData = imageData;
            }

            const uploadFileName = `${Date.now()}-${fileName}`;
            const { data: uploadData } = await client.storage
                .from("venue-images")
                .upload(uploadFileName, fileData);
            if (!uploadData) return null;

            const url = this.buildPublicImageUrl(
                "venue-images",
                uploadData.path,
            );
            const storageId = (uploadData as { id?: string }).id;
            return { path: uploadData.path, url: url || "", id: storageId };
        } catch {
            return null;
        }
    }

    static async enrichVenueRow(
        client: SupabaseClient,
        row: VenueRow,
        uploadedImagePath?: string,
    ): Promise<EnrichedVenue> {
        const enriched: EnrichedVenue = { ...row };

        const promises: Array<Promise<void>> = [];

        // Categories
        if (
            Array.isArray(row.venue_category_id) &&
            row.venue_category_id.length > 0
        ) {
            promises.push((async () => {
                const { data } = await client
                    .from("venue_categories")
                    .select("id, name")
                    .in(
                        "id",
                        row.venue_category_id as unknown as readonly string[],
                    );
                if (data && Array.isArray(data)) {
                    enriched.venue_category_titles = data.map((
                        c: { id: string; name: string | null },
                    ) => c.name || "");
                }
            })());
        }

        // Attributes
        if (Array.isArray(row.attribute_ids) && row.attribute_ids.length > 0) {
            promises.push((async () => {
                const attributes = await SupabaseVenueGeneralAttributesService
                    .getAttributesByIds(
                        client,
                        row.attribute_ids as unknown as string[],
                    );
                if (attributes && Array.isArray(attributes)) {
                    enriched.attribute_names = attributes.map((
                        a: { type: string | null; value: string | null },
                    ) => `${a.type ?? ""} ${a.value ?? ""}`.trim());

                    // Add full attribute objects
                    enriched.attributes = attributes.map((attr) => ({
                        id: attr.id,
                        type: attr.type,
                        value: attr.value,
                    }));
                }
            })());
        }

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

        // Image URL
        if (uploadedImagePath) {
            const url = this.buildPublicImageUrl(
                "venue-images",
                uploadedImagePath,
            );
            if (url) enriched.image_url = url;
        } else if (row.image_featured_id) {
            const obj = await this.getStorageObjectById(
                "venue-images",
                row.image_featured_id,
            );
            if (obj?.name) {
                const url = this.buildPublicImageUrl("venue-images", obj.name);
                if (url) enriched.image_url = url;
            } else {
                enriched.image_error = "Image file not found";
            }
        }

        await Promise.all(promises);
        return enriched;
    }

    static async listEnriched(
        client: SupabaseClient,
        q: VenuesQuery,
    ): Promise<{ data: EnrichedVenue[]; pagination: PaginationMeta }> {
        const { data, pagination } = await this.list(client, q);
        const enriched = await Promise.all(
            data.map((row) => this.enrichVenueRow(client, row)),
        );
        return { data: enriched, pagination };
    }

    static async getAttributeFilterList(
        client: SupabaseClient,
    ): Promise<{ [type: string]: Array<{ value: string; uuid: string }> }> {
        return await SupabaseVenueGeneralAttributesService.getFilterList(
            client,
        );
    }

    /**
     * Validate and update H3 cells for venues that have coordinates but missing H3 cells
     */
    static async validateAndUpdateH3Cells(
        client: SupabaseClient,
        batchSize: number = 100,
    ): Promise<{ updated: number; errors: number }> {
        let updated = 0;
        let errors = 0;

        try {
            // Find venues with coordinates but missing H3 cells
            const { data: venues, error: fetchError } = await client
                .from("venues")
                .select("id, location_latitude, location_longitude, h3")
                .not("location_latitude", "is", null)
                .not("location_longitude", "is", null)
                .is("h3", null)
                .is("deleted_at", null)
                .limit(batchSize);

            if (fetchError) throw fetchError;

            if (!venues || venues.length === 0) {
                return { updated: 0, errors: 0 };
            }

            // Update H3 cells for each venue
            for (const venue of venues) {
                try {
                    const h3Cell = this.calculateH3Cell(
                        parseFloat(venue.location_latitude),
                        parseFloat(venue.location_longitude),
                    );

                    await client
                        .from("venues")
                        .update({ h3: h3Cell })
                        .eq("id", venue.id);

                    updated++;
                } catch (error) {
                    console.error(
                        `Error updating H3 for venue ${venue.id}:`,
                        error,
                    );
                    errors++;
                }
            }

            return { updated, errors };
        } catch (error) {
            console.error("Error in validateAndUpdateH3Cells:", error);
            return { updated, errors: errors + 1 };
        }
    }

    /**
     * Get statistics about H3 cell coverage
     */
    static async getH3CoverageStats(
        client: SupabaseClient,
    ): Promise<{
        total_venues: number;
        venues_with_coordinates: number;
        venues_with_h3: number;
        coverage_percentage: number;
    }> {
        try {
            // Total venues
            const { count: total } = await client
                .from("venues")
                .select("*", { count: "exact", head: true })
                .is("deleted_at", null);

            // Venues with coordinates
            const { count: withCoords } = await client
                .from("venues")
                .select("*", { count: "exact", head: true })
                .not("location_latitude", "is", null)
                .not("location_longitude", "is", null)
                .is("deleted_at", null);

            // Venues with H3 cells
            const { count: withH3 } = await client
                .from("venues")
                .select("*", { count: "exact", head: true })
                .not("h3", "is", null)
                .is("deleted_at", null);

            const coveragePercentage = (withCoords || 0) > 0
                ? ((withH3 || 0) / (withCoords || 1)) * 100
                : 0;

            return {
                total_venues: total || 0,
                venues_with_coordinates: withCoords || 0,
                venues_with_h3: withH3 || 0,
                coverage_percentage: Math.round(coveragePercentage * 100) / 100,
            };
        } catch (error) {
            console.error("Error getting H3 coverage stats:", error);
            return {
                total_venues: 0,
                venues_with_coordinates: 0,
                venues_with_h3: 0,
                coverage_percentage: 0,
            };
        }
    }
}
