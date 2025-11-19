import {
  createClient,
  SupabaseClient,
} from "https://esm.sh/@supabase/supabase-js@2.42.4";
import { CryptographyService } from "../services/CryptographyService.ts";
import { SupabaseAdmin } from "./supabaseAdmin.ts";
import { HeadersService } from "../services/HeadersService.ts";
import { ApiError } from "../services/ErrorsService.ts";

export class SupabasePOSClient {
  private static supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  private static supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  private static privateKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  /**
   * Handle OPTIONS requestuests for CORS preflight
   * @returns Response with CORS headers
   */
  public static handleCorsrequestuest(): Response {
    return new Response("ok", { headers: HeadersService.getPosHeaders() });
  }

  /**
   * Create an error response with correct CORS headers
   * @param message Error message
   * @param details Additional error details
   * @param status HTTP status code
   * @returns Formatted Response object
   */
  public static errorResponse(
    message: string,
    details?: string,
    status = 401,
  ): Response {
    return new Response(
      JSON.stringify({
        error: message,
        details: details || message,
      }),
      {
        status,
        headers: HeadersService.getPosHeaders(),
      },
    );
  }

  /**
   * Create a success response with correct CORS headers
   * @param data Response data
   * @returns Formatted Response object
   */
  public static successResponse(data: any): Response {
    return new Response(
      JSON.stringify(data),
      { headers: HeadersService.getPosHeaders() },
    );
  }

  /**
   * Parse the requestuest body while handling errors appropriately
   * @param request requestuest object
   * @returns Parsed body or throws error
   */
  public static async parseRequestBody(
    request: Request,
  ): Promise<unknown> {
    try {
      return await request.json();
    } catch (e) {
      const errorMessage = e instanceof Error
        ? e.message
        : "Unknown JSON parsing error";
      throw new Error(`Invalid JSON in requestuest body: ${errorMessage}`);
    }
  }

  /**
   * Process an incoming requestuest, handling CORS and validation
   * @param request requestuest object
   * @returns Object containing validation result or error response
   */
  public static async processRequest(request: Request): Promise<
    | { success: true; parsedBody: unknown }
    | { success: false; response: Response }
  > {
    // Handle CORS preflight requestuests
    if (request.method === "OPTIONS") {
      return { success: false, response: this.handleCorsrequestuest() };
    }

    // For GET requestuests, create a dummy body with the device ID for signature verification
    if (request.method === "GET") {
      const posId = request.headers.get("pos-id") ||
        request.headers.get("device-id");
      if (!posId) {
        return {
          success: false,
          response: this.errorResponse(
            "Missing POS identifier",
            "requestuest must include pos-id or device-id header",
            400,
          ),
        };
      }
      return { success: true, parsedBody: { data: posId } };
    }

    // Parse the body for non-GET requestuests
    try {
      const parsedBody = await this.parseRequestBody(request);
      return { success: true, parsedBody };
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Unknown error";
      return {
        success: false,
        response: this.errorResponse(
          "Invalid requestuest format",
          "requestuest must contain a valid JSON body",
          400,
        ),
      };
    }
  }

  /**
   * Initialize a Supabase client for POS machines with proper authentication
   * @param requestuest requestuest object containing all requestuired headers
   * @param parsedBody Optional pre-parsed body to avoid consuming the requestuest body
   * @returns Authenticated Supabase client and the parsed body
   */
  public static async initialize(
    request: Request,
  ): Promise<{ client: SupabaseClient<any, "public", any> }> {
    // Get requestuired headers
    const posId = request.headers.get("pos-id") ||
      request.headers.get("device-id");
    const posAuth = request.headers.get("pos-authorization");
    const signatureHeader = request.headers.get("signature");

    // Validate requestuired headers
    if (!posId) {
      throw new Error("Missing POS identifier (pos-id or device-id)");
    }

    if (!signatureHeader) {
      throw new Error("Missing signature header");
    }

    if (!posAuth) {
      throw new Error("Missing pos-authorization header (challenge token)");
    }

    const device_id = request.headers.get("device-id");
    const signature = request.headers.get("signature");
    const posAuthorization = request.headers.get("pos-authorization");

    if (!device_id) {
      throw new ApiError(400, "BAD_REQUEST", "device-id header is required");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Get device's public key
    const { data: device, error: deviceError } = await supabase
      .from("points_of_sale")
      .select("id, public_key")
      .eq("id", device_id)
      .single();

    if (deviceError || !device) {
      throw new ApiError(401, "UNAUTHORIZED", "Invalid device-id");
    }

    // Add validation for the device's public key
    if (!device.public_key) {
      throw new ApiError(400, "BAD_REQUEST", "Device is missing public key");
    }

    const cryptoService = new CryptographyService(
      device.public_key,
    );
    await cryptoService.initialize();

    // Second login flow - verify signature and pos-authorization
    if (signature && posAuthorization) {
      const { data: session, error: sessionError } = await supabase
        .from("pos_sessions")
        .select("*")
        .eq("pos_id", device_id)
        .eq("is_active", true)
        .eq("auth_token", posAuthorization)
        .single();

      if (sessionError || !session) {
        throw new ApiError(
          401,
          "UNAUTHORIZED",
          "Invalid or expired authentication token",
        );
      }

      if (new Date(session.expires_at) < new Date()) {
        throw new ApiError(
          401,
          "UNAUTHORIZED",
          "Token expired, please request a new one",
        );
      }

      // For GET requests, requestBody should already be { data: posId }
      // For non-GET requests, verify data matches posId
      let isValid = false;
      console.log(request.method);
      if (request.method === "GET" || request.method === "OPTIONS" || request.method === "HEAD" || request.method === "DELETE") {
        isValid = await cryptoService.verifySignature(JSON.stringify({ data: posId }), signature);
      } else {
        // Get request body - clone the request first
        const clonedRequest = request.clone();
        const body = await clonedRequest.json();
        
        // Handle null body case
        if (!body) {
            isValid = await cryptoService.verifySignature(JSON.stringify({ data: posId }), signature);
        } else {
            // Convert to JSON string in the same format as Python
            const messageString = JSON.stringify(body);
            isValid = await cryptoService.verifySignature(messageString, signature);
        }
      }

      if (!isValid) {
        throw new ApiError(401, "UNAUTHORIZED", "Invalid signature");
      }

      // Create Supabase client with authenticated POS credentials
      const client = createClient(this.supabaseUrl, this.privateKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
        global: {
          headers: {
            "pos-id": posId,
            "pos-authorization": posAuth,
          },
        },
        db: {
          schema: "public",
        },
      });

      // Return both the client and the parsed body for convenience
      return { client };
    }
    throw new ApiError(401, "UNAUTHORIZED", "Invalid signature");
  }
}
