import { ResponseService } from "../../_shared/services/ResponseService.ts";
import { ResponseType } from "../../_shared/services/ErrorsService.ts";
import { Controller } from "../../_shared/controllers/Controller.ts";
import { AuthenticationService } from "../../_shared/services/AuthenticationService.ts";
import { SupabaseBannersService } from "../../_shared/supabase/banners/supabaseBanners.ts";
import type {
    BannerInsert,
    BannerUpdate,
} from "../../_shared/supabase/banners/banners.types.ts";

// Request payload types that accept image_base64 from Laravel
interface BannerInsertPayload extends Omit<BannerInsert, 'banner_image_path'> {
    image_base64?: string;
    banner_image_path?: string;
}

interface BannerUpdatePayload extends Partial<Omit<BannerInsert, 'banner_image_path'>> {
    image_base64?: string;
    banner_image_path?: string;
}

export class BannersApiController
    extends Controller<BannerInsertPayload | BannerUpdatePayload> {

    // Get Supabase URL from environment
    private getSupabaseUrl(): string {
        return Deno.env.get("SUPABASE_URL") || "";
    }

    override async get(id?: string, _req?: Request): Promise<Response> {
        this.logAction("BannersAPI GET", { id });
        const { client } = await AuthenticationService.authenticate(_req!);
        const supabaseUrl = this.getSupabaseUrl();

        if (id) {
            try {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const row = await SupabaseBannersService.getById(
                    client as any,
                    id,
                );
                if (!row) {
                    return ResponseService.error(
                        "Banner not found",
                        "NOT_FOUND",
                        404,
                        undefined,
                        ResponseType.API,
                    );
                }

                // Add image_url computed field
                const bannerWithUrl = SupabaseBannersService.addImageUrl(row, supabaseUrl);

                return ResponseService.success(
                    bannerWithUrl,
                    200,
                    undefined,
                    ResponseType.API,
                );
            } catch (error: unknown) {
                return ResponseService.error(
                    "Error fetching banner",
                    "BANNERS_GET_BY_ID_ERROR",
                    400,
                    {
                        error: error instanceof Error
                            ? error.message
                            : String(error),
                    },
                    ResponseType.API,
                );
            }
        }

        // list with filters
        const url = new URL(_req!.url);

        const parseBool = (v: string | null): boolean | undefined => {
            if (!v) return undefined;
            const s = v.toLowerCase();
            if (["true", "1", "yes"].includes(s)) return true;
            if (["false", "0", "no"].includes(s)) return false;
            return undefined;
        };

// helpers to read multiple aliases (and a typo) safely
        const qp = (keys: string[]): string | undefined => {
            for (const k of keys) {
                const val = url.searchParams.get(k);
                if (val !== null && val !== "") return val;
            }
            return undefined;
        };

        const query = {
            limit: url.searchParams.get("limit") ? parseInt(url.searchParams.get("limit")!, 10) : 20,
            offset: url.searchParams.get("offset") ? parseInt(url.searchParams.get("offset")!, 10) : 0,
            page: url.searchParams.get("page") ? parseInt(url.searchParams.get("page")!, 10) : undefined,
            search: url.searchParams.get("search") || undefined,

            active: parseBool(url.searchParams.get("active")),
            expirationDate: qp(["expiration_date", "expirationDate"]),
            expirationDateFrom: qp(["expiration_date_from", "expirationDateFrom", "exporationDateFrom"]), // typo tolerated
            expirationDateTo: qp(["expiration_date_to", "expirationDateTo"]),
        };

        const finalOffset = query.page ? (query.page - 1) * query.limit : query.offset;

        const { data, count } = await SupabaseBannersService.list(client as any, {
            limit: query.limit,
            offset: finalOffset,
            search: query.search,
            active: query.active,
            expirationDate: query.expirationDate,
            expirationDateFrom: query.expirationDateFrom,
            expirationDateTo: query.expirationDateTo,
        });

        const bannersWithUrls = data.map(b => SupabaseBannersService.addImageUrl(b, this.getSupabaseUrl()));
        const totalPages = Math.ceil(count / query.limit);
        const currentPage = query.page || Math.floor(finalOffset / query.limit) + 1;

        return ResponseService.success(
            bannersWithUrls,
            200,
            {
                pagination: {
                    page: currentPage,
                    limit: query.limit,
                    total: count,
                    totalPages,
                    hasNext: currentPage < totalPages,
                    hasPrev: currentPage > 1,
                },
                filters: {
                    active: query.active,
                    expiration_date: query.expirationDate,
                    expiration_date_from: query.expirationDateFrom,
                    expiration_date_to: query.expirationDateTo,
                    search: query.search,
                },
            },
            ResponseType.API,
        );
    }

    override async post(
        data: BannerInsertPayload,
        _req?: Request,
    ): Promise<Response> {
        this.logAction("BannersAPI POST", { data });
        const { client } = await AuthenticationService.authenticate(_req!);
        const supabaseUrl = this.getSupabaseUrl();

        try {
            // First create the banner to get the ID
            const { image_base64, ...rest } = data;
            const tempPayload: BannerInsert = {
                ...rest,
                banner_image_path: null,
                current_clicks: data.current_clicks ?? 0,
                current_displays: data.current_displays ?? 0,
            };

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const created = await SupabaseBannersService.create(
                client as any,
                tempPayload,
            );

            // Now upload image with the banner ID
            let banner_image_path = null;
            if (data.image_base64) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                banner_image_path = await SupabaseBannersService.uploadImage(
                    client as any,
                    data.image_base64,
                    created.id,
                );

                // Update banner with image path
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const updated = await SupabaseBannersService.update(
                    client as any,
                    created.id,
                    { banner_image_path },
                );

                // Add image_url computed field
                const bannerWithUrl = SupabaseBannersService.addImageUrl(updated, supabaseUrl);

                return ResponseService.created(
                    bannerWithUrl,
                    bannerWithUrl.id,
                    ResponseType.API,
                );
            }

            // Add image_url computed field
            const bannerWithUrl = SupabaseBannersService.addImageUrl(created, supabaseUrl);

            return ResponseService.created(
                bannerWithUrl,
                bannerWithUrl.id,
                ResponseType.API,
            );
        } catch (error: unknown) {
            return ResponseService.error(
                "Error creating banner",
                "BANNERS_CREATE_ERROR",
                400,
                {
                    error: error instanceof Error
                        ? error.message
                        : String(error),
                },
                ResponseType.API,
            );
        }
    }

    override async put(
        id: string,
        data: BannerUpdatePayload,
        _req?: Request,
    ): Promise<Response> {
        this.logAction("BannersAPI PUT", { id, data });
        const { client } = await AuthenticationService.authenticate(_req!);
        const supabaseUrl = this.getSupabaseUrl();

        try {
            // Handle image upload if image_base64 is provided
            let banner_image_path = data.banner_image_path;
            if (data.image_base64) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                banner_image_path = await SupabaseBannersService.uploadImage(
                    client as any,
                    data.image_base64,
                    id,
                );
            }

            // Prepare payload for database
            const { image_base64, ...rest } = data;
            const updatePayload: BannerUpdate = {
                ...rest,
                ...(banner_image_path && { banner_image_path }),
            };

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const updated = await SupabaseBannersService.update(
                client as any,
                id,
                updatePayload,
            );

            // Add image_url computed field
            const bannerWithUrl = SupabaseBannersService.addImageUrl(updated, supabaseUrl);

            return ResponseService.success(
                bannerWithUrl,
                200,
                undefined,
                ResponseType.API,
            );
        } catch (error: unknown) {
            return ResponseService.error(
                "Error updating banner",
                "BANNERS_UPDATE_ERROR",
                400,
                {
                    error: error instanceof Error
                        ? error.message
                        : String(error),
                },
                ResponseType.API,
            );
        }
    }

    override async delete(id: string, _req?: Request): Promise<Response> {
        this.logAction("BannersAPI DELETE", { id });
        const { client } = await AuthenticationService.authenticate(_req!);
        const supabaseUrl = this.getSupabaseUrl();

        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const result = await SupabaseBannersService.softDelete(
                client as any,
                id,
            );

            // Add image_url computed field
            const bannerWithUrl = SupabaseBannersService.addImageUrl(result, supabaseUrl);

            return ResponseService.success(
                bannerWithUrl,
                200,
                undefined,
                ResponseType.API,
            );
        } catch (error: unknown) {
            return ResponseService.error(
                "Error deleting banner",
                "BANNERS_DELETE_ERROR",
                400,
                {
                    error: error instanceof Error
                        ? error.message
                        : String(error),
                },
                ResponseType.API,
            );
        }
    }
}