import { ResponseService } from "../../_shared/services/ResponseService.ts";
import { ResponseType } from "../../_shared/services/ErrorsService.ts";
import { Controller } from "../../_shared/controllers/Controller.ts";
import { AuthenticationService } from "../../_shared/services/AuthenticationService.ts";
import { SupabaseBannersService } from "../../_shared/supabase/banners/supabaseBanners.ts";

interface IncrementPayload {
    id?: string;
}

export class BannersDisplaysController extends Controller<IncrementPayload> {
    private getSupabaseUrl(): string {
        return Deno.env.get("SUPABASE_URL") || "";
    }

    override async get(id?: string, _req?: Request): Promise<Response> {
        this.logAction("BannersDisplays GET (increment)", { id });
        const { client } = await AuthenticationService.authenticate(_req!);
        const supabaseUrl = this.getSupabaseUrl();

        const url = new URL(_req!.url);
        const queryId = url.searchParams.get("id") || undefined;
        const bannerId = id || queryId;

        if (!bannerId) {
            return ResponseService.error(
                "Missing banner id",
                "BANNERS_INCREMENT_DISPLAYS_MISSING_ID",
                400,
                undefined,
                ResponseType.API,
            );
        }

        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const updated = await SupabaseBannersService.incrementDisplays(client as any, bannerId);
            const withUrl = SupabaseBannersService.addImageUrl(updated, supabaseUrl);
            return ResponseService.success(withUrl, 200, undefined, ResponseType.API);
        } catch (error: unknown) {
            return ResponseService.error(
                "Error incrementing displays",
                "BANNERS_INCREMENT_DISPLAYS_ERROR",
                400,
                { error: error instanceof Error ? error.message : String(error) },
                ResponseType.API,
            );
        }
    }

    override async post(data: IncrementPayload, _req?: Request): Promise<Response> {
        this.logAction("BannersDisplays POST (increment)", { data });
        const { client } = await AuthenticationService.authenticate(_req!);
        const supabaseUrl = this.getSupabaseUrl();

        const url = new URL(_req!.url);
        const queryId = url.searchParams.get("id") || undefined;
        const bannerId = data?.id || queryId;

        if (!bannerId) {
            return ResponseService.error(
                "Missing banner id",
                "BANNERS_INCREMENT_DISPLAYS_MISSING_ID",
                400,
                undefined,
                ResponseType.API,
            );
        }

        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const updated = await SupabaseBannersService.incrementDisplays(client as any, bannerId);
            const withUrl = SupabaseBannersService.addImageUrl(updated, supabaseUrl);
            return ResponseService.success(withUrl, 200, undefined, ResponseType.API);
        } catch (error: unknown) {
            return ResponseService.error(
                "Error incrementing displays",
                "BANNERS_INCREMENT_DISPLAYS_ERROR",
                400,
                { error: error instanceof Error ? error.message : String(error) },
                ResponseType.API,
            );
        }
    }
}
