// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
/// <reference types="https://esm.sh/v135/@supabase/functions-js@2.4.3/src/edge-runtime.d.ts" />

import { ErrorsService } from "../_shared/services/ErrorsService.ts";
import { GalleryController } from "../_shared/controllers/GalleryController.ts";

// Export the handler for testing
export const handler = async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  try {
    const controller = new GalleryController();
    const url = new URL(req.url);
    const pathSegments = url.pathname.split("/").filter(Boolean);
    
    // Remove 'functions/v1/gallery' from the path
    const cleanPath = pathSegments.slice(2).join("/");
    
    // Parse request body for POST/PUT/DELETE requests
    let body = null;
    if (req.method === "POST" || req.method === "PUT" || req.method === "DELETE") {
      const contentType = req.headers.get("content-type");
      if (contentType?.includes("application/json")) {
        body = await req.json();
      }
    }

    // Route handling
    switch (req.method) {
      case "GET":
        if (cleanPath === "images" || cleanPath === "") {
          // GET /gallery/images - List all galleries (not implemented for now)
          return new Response(JSON.stringify({ 
            error: "Use specific gallery ID: GET /gallery/{galleryId}/images" 
          }), {
            status: 400,
            headers: { "Content-Type": "application/json" }
          });
        }
        
        // GET /gallery/{galleryId}/images - List images in a gallery
        const galleryIdMatch = cleanPath.match(/^([^/]+)\/images$/);
        if (galleryIdMatch) {
          const galleryId = galleryIdMatch[1];
          return await controller.listImages(galleryId, req);
        }
        
        // GET /gallery/{galleryId} - Get gallery info
        if (cleanPath && !cleanPath.includes("/")) {
          return await controller.listImages(cleanPath, req);
        }
        
        return new Response(JSON.stringify({ 
          error: "Invalid endpoint. Use GET /gallery/{galleryId}/images" 
        }), {
          status: 404,
          headers: { "Content-Type": "application/json" }
        });

      case "POST":
        if (cleanPath === "upload") {
          // POST /gallery/upload - Upload images
          if (!body) {
            return new Response(JSON.stringify({ 
              error: "Request body is required for upload" 
            }), {
              status: 400,
              headers: { "Content-Type": "application/json" }
            });
          }
          return await controller.uploadImages(body, req);
        }
        
        return new Response(JSON.stringify({ 
          error: "Invalid endpoint. Use POST /gallery/upload" 
        }), {
          status: 404,
          headers: { "Content-Type": "application/json" }
        });

      case "DELETE":
        if (cleanPath === "delete") {
          // DELETE /gallery/delete - Delete images
          if (!body) {
            return new Response(JSON.stringify({ 
              error: "Request body is required for delete" 
            }), {
              status: 400,
              headers: { "Content-Type": "application/json" }
            });
          }
          return await controller.deleteImages(body, req);
        }
        
        return new Response(JSON.stringify({ 
          error: "Invalid endpoint. Use DELETE /gallery/delete" 
        }), {
          status: 404,
          headers: { "Content-Type": "application/json" }
        });

      default:
        return new Response(JSON.stringify({ 
          error: "Method not allowed",
          allowed_methods: ["GET", "POST", "DELETE", "OPTIONS"]
        }), {
          status: 405,
          headers: { "Content-Type": "application/json" }
        });
    }
  } catch (error) {
    console.error("Gallery API error:", error);
    return ErrorsService.handleError(error);
  }
};

// Use the handler for the Deno.serve
Deno.serve(handler); 