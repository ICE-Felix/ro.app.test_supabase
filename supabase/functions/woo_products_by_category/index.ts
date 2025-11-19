// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
/// <reference types="https://esm.sh/v135/@supabase/functions-js@2.4.3/src/edge-runtime.d.ts" />

import { ErrorsService } from "../_shared/services/ErrorsService.ts";
import { RouteService } from "../_shared/services/RouteService.ts";
import { AuthenticationService } from "../_shared/services/AuthenticationService.ts";
import { ProductsByCategoryApiController } from "./controllers/ProductsByCategoryApiController.ts";
import { ProductsByCategoryWebController } from "./controllers/ProductsByCategoryWebController.ts";

// Export the handler for testing
export const handler = async (req: Request) => {
    try {
        // Authenticate the request and get request type
        const { type, requestType } = await AuthenticationService.authenticate(
            req,
        );

        // Create controller instances with authenticated client
        const apiController = new ProductsByCategoryApiController();
        const webController = new ProductsByCategoryWebController();

        // Pass the authenticated client, request body, and request type to the route handler
        return await RouteService.handleRequest(
            req,
            apiController,
            webController,
            "products_by_category",
            { type, requestType },
        );
    } catch (error) {
        // Handle any unexpected errors
        console.error("Error:", error);
        return ErrorsService.handleError(error);
    }
};

// Use the handler for the Deno.serve
Deno.serve(handler);
