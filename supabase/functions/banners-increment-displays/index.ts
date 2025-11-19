import { ErrorsService } from "../_shared/services/ErrorsService.ts";
import { RouteService } from "../_shared/services/RouteService.ts";
import { AuthenticationService } from "../_shared/services/AuthenticationService.ts";
import { BannersDisplaysController } from "./controllers/BannersDisplaysController.ts";

export const handler = async (req: Request) => {
    try {
        const { type, requestType } = await AuthenticationService.authenticate(req);
        const controller = new BannersDisplaysController();
        return await RouteService.handleRequest(req, controller, controller, "banners_increment_displays", { type, requestType });
    } catch (error) {
        console.error("Error:", error);
        return ErrorsService.handleError(error);
    }
};

Deno.serve(handler);