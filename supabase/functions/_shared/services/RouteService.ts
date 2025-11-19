import { ResponseService } from "./ResponseService.ts";
import { ResponseType } from "./ErrorsService.ts";
import { Controller } from "../controllers/Controller.ts";
import { HeadersService } from "./HeadersService.ts";

interface RequestOptions {
  type: 'pos' | 'user' | 'anon';
  requestType: 'web' | 'api';
}

export class RouteService {
  static isApiRoute(req: Request): boolean {
    const acceptHeader = req.headers.get("accept") || "";
    const contentType = req.headers.get("content-type") || "";
    const xRequestedWith = req.headers.get("x-requested-with") || "";
    const xClientType = req.headers.get("x-client-type") || "";

    console.log("Request headers:", {
      accept: acceptHeader,
      contentType,
      xRequestedWith,
      xClientType
    });

    // Common API request indicators
    const isApiAccept = acceptHeader.includes("application/json");
    const isJsonContent = contentType.includes("application/json");
    const isAjax = xRequestedWith === "XMLHttpRequest";
    const isApiClient = xClientType === "api";

    // If x-client-type is explicitly set to "api", it's an API request
    if (isApiClient) {
      return true;
    }

    // If content type is form data or form urlencoded, it's likely a web request
    if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
      return false;
    }

    // Otherwise, check other indicators
    return isApiAccept || isJsonContent || isAjax;
  }

  /**
   * Get the appropriate response type based on the request
   */
  static getResponseType(req: Request): ResponseType {
    const contentType = req.headers.get("content-type") || "";
    const xClientType = req.headers.get("x-client-type") || "";

    console.log("Determining response type:", {
      contentType,
      xClientType,
      isApiRoute: this.isApiRoute(req)
    });

    // If x-client-type is explicitly set to "api", it's an API request
    if (xClientType === "api") {
      return ResponseType.API;
    }

    // If content type is form data or form urlencoded, it's a web request
    if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
      return ResponseType.WEB;
    }

    // Otherwise, use the API route detection
    return this.isApiRoute(req) ? ResponseType.API : ResponseType.WEB;
  }

  /**
   * Parse request body based on content type
   */
  private static async parseRequestBody(req: Request): Promise<unknown> {
    const contentType = req.headers.get("content-type") || "";
    console.log("Content-Type:", contentType);

    try {
      if (contentType.includes("application/json")) {
        const result = await req.clone().json();
        console.log("JSON parse result:", result);
        return result || {}; // Ensure we return an empty object if result is null/undefined
      }

      if (contentType.includes("application/x-www-form-urlencoded")) {
        const text = await req.clone().text();
        console.log("Raw form data:", text);
        
        // Parse form data manually
        const data: Record<string, unknown> = {};
        const params = text.split('&');
        for (const param of params) {
          const [key, value] = param.split('=').map(decodeURIComponent);
          data[key] = value;
        }
        
        console.log("Parsed form data:", data);
        return data;
      }

      if (contentType.includes("multipart/form-data")) {
        const formData = await req.clone().formData();
        const data: Record<string, unknown> = {};
        for (const [key, value] of formData.entries()) {
          data[key] = value;
        }
        console.log("Parsed multipart form data:", data);
        return data;
      }

      // Default to raw text if no specific content type
      const rawText = await req.clone().text();
      console.log("Raw text:", rawText);
      
      // Try to parse as JSON first
      try {
        const parsed = JSON.parse(rawText);
        return parsed || {}; // Ensure we return an empty object if parsed is null/undefined
      } catch {
        // If not JSON, try to parse as form data
        if (rawText.includes('=')) {
          const data: Record<string, unknown> = {};
          const params = rawText.split('&');
          for (const param of params) {
            const [key, value] = param.split('=').map(decodeURIComponent);
            data[key] = value;
          }
          return data;
        }
        
        // If neither JSON nor form data, return as raw text wrapped in object
        return rawText ? { data: rawText } : {};
      }
    } catch (e) {
      console.error("Error parsing request body:", e);
      throw new Error("Invalid request payload");
    }
  }

  static async handleRequest(
    req: Request, 
    apiController: Controller, 
    webController: Controller, 
    functionName: string,
    options?: RequestOptions
  ): Promise<Response> {
    console.log(`Received ${req.method} request to ${req.url} for function "${functionName}"`);
    console.log("Request headers:", Object.fromEntries(req.headers.entries()));
    
    // Handle OPTIONS request for CORS preflight
    if (req.method === "OPTIONS") {
      return new Response(JSON.stringify({
        success: true,
        function: functionName,
        status: "active",
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        version: "1.0.0"
      }), {
        status: 200,
        headers: {
          ...HeadersService.getCorsHeaders(),
          'Content-Type': 'application/json'
        }
      });
    }

    // Determine which controller to use based on request type or options
    const isApi = options?.requestType === 'api' || RouteService.isApiRoute(req);
    const controller = isApi ? apiController : webController;
    console.log(`Using ${isApi ? 'API' : 'Web'} controller for "${functionName}" function`);

    // Extract ID from URL pattern using the function name dynamically
    const urlPattern = new URLPattern({ pathname: `*/${functionName}/:id` });
    const matchingPath = urlPattern.exec(req.url);
    const id = matchingPath ? matchingPath.pathname.groups.id : null;

    try {
      // Handle different HTTP methods
      switch (req.method) {
        case 'GET': {
          if (!controller.get) {
            return ResponseService.error(
              "Method not implemented", 
              "NOT_IMPLEMENTED", 
              501, 
              undefined,
              RouteService.getResponseType(req)
            );
          }
          return await controller.get(id || undefined, req);
        }
        
        case 'POST': {
          if (!controller.post) {
            return ResponseService.error(
              "Method not implemented", 
              "NOT_IMPLEMENTED", 
              501, 
              undefined,
              RouteService.getResponseType(req)
            );
          }
          
          // Parse request body based on content type
          try {
            const data = await RouteService.parseRequestBody(req);
            console.log("Parsed request data:", data);
            console.log("Parsed request data type:", typeof data);
            
            // CRITICAL FIX: Ensure data is not undefined before passing to controller
            if (data === undefined || data === null) {
              console.error("ERROR: Parsed data is undefined or null");
              return ResponseService.error(
                "Request body could not be parsed or is empty",
                "INVALID_PAYLOAD",
                400,
                undefined,
                RouteService.getResponseType(req)
              );
            }
            
            return await controller.post(data, req);
          } catch (error) {
            console.error("Error parsing request body:", error);
            return ResponseService.error(
              error instanceof Error ? error.message : "Invalid request payload",
              "INVALID_PAYLOAD",
              400,
              undefined,
              RouteService.getResponseType(req)
            );
          }
        }
        
        case 'PUT': {
          if (!controller.put) {
            return ResponseService.error(
              "Method not implemented", 
              "NOT_IMPLEMENTED", 
              501, 
              undefined,
              RouteService.getResponseType(req)
            );
          }
          
          if (!id) {
            return ResponseService.error(
              "Missing resource identifier", 
              "MISSING_ID", 
              400, 
              undefined,
              RouteService.getResponseType(req)
            );
          }
          
          // Parse request body based on content type
          try {
            const data = await RouteService.parseRequestBody(req);
            console.log("Parsed request data:", data);
            return await controller.put(id, data, req);
          } catch (error) {
            console.error("Error parsing request body:", error);
            return ResponseService.error(
              error instanceof Error ? error.message : "Invalid request payload",
              "INVALID_PAYLOAD",
              400,
              undefined,
              RouteService.getResponseType(req)
            );
          }
        }
        
        case 'DELETE': {
          if (!controller.delete) {
            return ResponseService.error(
              "Method not implemented", 
              "NOT_IMPLEMENTED", 
              501, 
              undefined,
              RouteService.getResponseType(req)
            );
          }
          
          if (!id) {
            return ResponseService.error(
              "Missing resource identifier", 
              "MISSING_ID", 
              400, 
              undefined,
              RouteService.getResponseType(req)
            );
          }
          
          return await controller.delete(id, req);
        }
        
        default: {
          return ResponseService.error(
            "Method not allowed", 
            "METHOD_NOT_ALLOWED", 
            405, 
            undefined,
            RouteService.getResponseType(req)
          );
        }
      }
    } catch (error) {
      console.error("Error handling request:", error);
      return ResponseService.error(
        error instanceof Error ? error.message : "Internal server error",
        "INTERNAL_ERROR",
        500,
        undefined,
        RouteService.getResponseType(req)
      );
    }
  }
}