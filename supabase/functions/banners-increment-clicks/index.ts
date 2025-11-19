/// <reference types="https://esm.sh/v135/@supabase/functions-js@2.4.3/src/edge-runtime.d.ts" />

import { ErrorsService } from "../_shared/services/ErrorsService.ts";
import { RouteService } from "../_shared/services/RouteService.ts";
import { AuthenticationService } from "../_shared/services/AuthenticationService.ts";
import { BannersClicksController } from "./controllers/BannersClicksController.ts";

export const handler = async (req: Request) => {
    try {
        const { type, requestType } = await AuthenticationService.authenticate(req);
        const controller = new BannersClicksController();
        return await RouteService.handleRequest(req, controller, controller, "banners_increment_clicks", { type, requestType });
    } catch (error) {
        console.error("Error:", error);
        return ErrorsService.handleError(error);
    }
};

Deno.serve(handler);
