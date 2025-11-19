/// <reference types="https://esm.sh/v135/@supabase/functions-js@2.4.3/src/edge-runtime.d.ts" />

import { ErrorsService } from "../_shared/services/ErrorsService.ts";
import { RouteService } from "../_shared/services/RouteService.ts";
import { AuthenticationService } from "../_shared/services/AuthenticationService.ts";
import { WooStockCheckApiController } from "./controllers/WooStockCheckApiController.ts";
import { WooStockCheckWebController } from "./controllers/WooStockCheckWebController.ts";

export const handler = async (req: Request) => {
  try {
    // Authenticate the request and get request type
    const { type, requestType } = await AuthenticationService.authenticate(req);

    // Create controller instances
    const apiController = new WooStockCheckApiController();
    const webController = new WooStockCheckWebController();

    // Delegate to route service
    return await RouteService.handleRequest(
      req,
      apiController,
      webController,
      "woo_stock_check",
      { type, requestType },
    );
  } catch (error) {
    console.error("Error:", error);
    return ErrorsService.handleError(error);
  }
};

Deno.serve(handler);
