// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
/// <reference types="https://esm.sh/v135/@supabase/functions-js@2.4.3/src/edge-runtime.d.ts" />

import { ErrorsService } from "../_shared/services/ErrorsService.ts";
import { RouteService } from "../_shared/services/RouteService.ts";
import { AuthenticationService } from "../_shared/services/AuthenticationService.ts";
import { VenueGeneralAttributesApiController } from "./controllers/VenueGeneralAttributesApiController.ts";

export const handler = async (req: Request) => {
  try {
    const { type, requestType } = await AuthenticationService.authenticate(
      req,
    );
    const apiController = new VenueGeneralAttributesApiController();
    // Route API-only by passing the same controller for web to satisfy router signature
    const webController =
      apiController as unknown as import("../_shared/controllers/Controller.ts").Controller;
    return await RouteService.handleRequest(
      req,
      apiController,
      webController,
      "venue_general_attributes",
      { type, requestType },
    );
  } catch (error) {
    console.error("Error:", error);
    return ErrorsService.handleError(error);
  }
};

Deno.serve(handler);
