import type { SupabaseClient } from "npm:@supabase/supabase-js";
import type {
    BannerInsert,
    BannerRow,
    BannerUpdate,
} from "./banners.types.ts";

export class SupabaseBannersService {
    /**
     * Upload base64 image to Supabase Storage and return relative path
     */
    static async uploadImage(
        client: SupabaseClient,
        base64Image: string,
        bannerId?: string,
    ): Promise<string> {
        // Remove data:image/...;base64, prefix if present
        const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");

        // Convert base64 to Uint8Array
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        // Generate filename with timestamp
        const timestamp = Date.now();
        const fileName = bannerId
            ? `${bannerId}/${timestamp}-uploaded-image.jpg`
            : `${crypto.randomUUID()}.jpg`;

        // Upload to Supabase Storage
        const { data, error } = await client.storage
            .from("banners-images")
            .upload(fileName, bytes, {
                contentType: "image/jpeg",
                upsert: false,
            });

        if (error) {
            throw new Error(`Failed to upload image: ${error.message}`);
        }

        // Return just the path, not the full URL
        return data.path;
    }

    /**
     * Add image_url computed field to banner rows
     */
    static addImageUrl(banner: BannerRow, supabaseUrl: string): BannerRow & { image_url: string | null } {
        return {
            ...banner,
            image_url: banner.banner_image_path
                ? `${supabaseUrl}/storage/v1/object/public/banners-images/${banner.banner_image_path}`
                : null,
        };
    }

    static async create(
        client: SupabaseClient,
        payload: BannerInsert,
    ): Promise<BannerRow> {
        const { data, error } = await client
            .from("banners")
            .insert(payload)
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to create banner: ${error.message}`);
        }

        return data;
    }

    static async getById(
        client: SupabaseClient,
        id: string,
    ): Promise<BannerRow | null> {
        const { data, error } = await client
            .from("banners")
            .select("*")
            .eq("id", id)
            .is("deleted_at", null)
            .single();

        if (error) {
            if (error.code === "PGRST116") {
                return null;
            }
            throw new Error(`Failed to get banner: ${error.message}`);
        }

        return data;
    }
    static async list(
        client: SupabaseClient,
        options: {
            limit?: number;
            offset?: number;
            search?: string;
            active?: boolean;
            expirationDate?: string;        // exact ISO timestamp match
            expirationDateFrom?: string;    // range start (inclusive)
            expirationDateTo?: string;      // range end (inclusive)
        } = {},
    ): Promise<{ data: BannerRow[]; count: number }> {
        const {
            limit = 20,
            offset = 0,
            search,
            active,
            expirationDate,
            expirationDateFrom,
            expirationDateTo,
        } = options;

        let query = client
            .from("banners")
            .select("*", { count: "exact" })
            .is("deleted_at", null);

        if (typeof active === "boolean") query = query.eq("active", active);

        // If exact expirationDate is provided, prefer it over range.
        if (expirationDate) {
            query = query.eq("expiration_date", expirationDate);
        } else {
            if (expirationDateFrom) query = query.gte("expiration_date", expirationDateFrom);
            if (expirationDateTo)   query = query.lte("expiration_date", expirationDateTo);
        }

        if (search) {
            query = query.or(`redirect_link.ilike.%${search}%`);
        }

        const { data, error, count } = await query
            .order("created_at", { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw new Error(`Failed to list banners: ${error.message}`);

        return { data: data || [], count: count || 0 };
    }

    static async update(
        client: SupabaseClient,
        id: string,
        payload: BannerUpdate,
    ): Promise<BannerRow> {
        const { data, error } = await client
            .from("banners")
            .update(payload)
            .eq("id", id)
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to update banner: ${error.message}`);
        }

        return data;
    }

    static async softDelete(
        client: SupabaseClient,
        id: string,
    ): Promise<BannerRow> {
        const { data, error } = await client
            .from("banners")
            .update({ deleted_at: new Date().toISOString() })
            .eq("id", id)
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to delete banner: ${error.message}`);
        }

        return data;
    }

    static async incrementDisplays(
        client: SupabaseClient,
        id: string,
    ): Promise<BannerRow> {
        return await this._incrementCounterAtomic(client, id, "displays");
    }

    static async incrementClicks(
        client: SupabaseClient,
        id: string,
    ): Promise<BannerRow> {
        return await this._incrementCounterAtomic(client, id, "clicks");
    }

    private static async _incrementCounterAtomic(
        client: SupabaseClient,
        id: string,
        which: "displays" | "clicks",
    ): Promise<BannerRow> {
        const curField = which === "displays" ? "current_displays" : "current_clicks";
        const maxField = which === "displays" ? "max_displays" : "max_clicks";
        const maxAttempts = 5;

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const { data: row, error: readErr } = await client
                .from("banners")
                .select("*")
                .eq("id", id)
                .is("deleted_at", null)
                .single();

            if (readErr) throw new Error(`Failed to read banner: ${readErr.message}`);
            if (!row) throw new Error("Banner not found or deleted");

            const maxVal = (row as any)[maxField];
            const isMaxNull = maxVal === null || typeof maxVal === "undefined";
            const max = isMaxNull ? 0 : (maxVal as number); // 0 means unlimited

            const curVal = (row as any)[curField];
            const isCurrentNull = curVal === null || typeof curVal === "undefined";
            const current = isCurrentNull ? 0 : (curVal as number);

            let next = current;
            // keep original value, only change when we need to deactivate
            let nextActive: boolean | null = row.active;

            if (max === 0) {
                next = current + 1; // unlimited
            } else {
                if (current + 1 === max) {
                    next = current + 1;
                    nextActive = false; // deactivate exactly at cap
                } else if (current + 1 < max) {
                    next = current + 1; // increment only
                } else {
                    // already at/over cap → ensure inactive
                    if (row.active !== false) nextActive = false;
                }
            }

            // Build payload only with actual changes
            const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
            if (next !== current) payload[curField] = next;
            if (nextActive !== row.active) payload["active"] = nextActive;

            if (Object.keys(payload).length === 1) {
                // nothing changed
                return row as BannerRow;
            }

            // ---- CAS update (handle NULL vs number) ----
            let upd = client.from("banners").update(payload).eq("id", id);
            if (isCurrentNull) {
                upd = upd.is(curField, null);          // match when DB value is NULL
            } else {
                upd = upd.eq(curField, current);       // match the exact numeric value we read
            }

            const { data: updatedRows, error: updErr } = await upd.select("*");
            if (updErr) throw new Error(`Failed to update banner: ${updErr.message}`);

            if (updatedRows && updatedRows.length === 1) {
                return updatedRows[0] as BannerRow; // success
            }
            // else: concurrent write; retry
        }

        throw new Error("Conflict updating banner counter (retry limit reached)");
    }
}