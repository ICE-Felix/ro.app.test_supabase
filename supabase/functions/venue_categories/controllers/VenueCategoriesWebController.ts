import { ResponseService } from "../../_shared/services/ResponseService.ts";
import { ResponseType } from "../../_shared/services/ErrorsService.ts";
import { Controller } from "../../_shared/controllers/Controller.ts";

// Define resource data interface
interface VenueCategoryResourceData {
  name: string;
  parent_id?: string | null;
  parent_name?: string | null;
  [key: string]: unknown;
}

export class VenueCategoriesWebController extends Controller<VenueCategoryResourceData> {
  // Core Web methods
  override get(id?: string, _req?: Request): Promise<Response> {
    this.logAction('VenueCategoriesWeb GET', { id });
    
    if (id) {
      console.log(`Web: Fetching venue categories resource with id: ${id}`);
      // Web-specific resource retrieval logic, possibly returning HTML
      return Promise.resolve(ResponseService.success({ 
        id, 
        data: "Venue Categories Web Resource data", 
        html: "<div>Venue Categories Resource Details</div>" 
      },
      200,
      undefined,
      ResponseType.WEB
      ));
    }
    
    console.log("Web: Fetching all venue categories resources");
    // Web-specific resources retrieval logic
    return Promise.resolve(ResponseService.success({ 
      resources: ["Venue_Categories_Web_Resource1", "Venue_Categories_Web_Resource2"], 
      html: "<ul><li>Venue Categories Resource 1</li><li>Venue Categories Resource 2</li></ul>" 
    },
    200,
    undefined,
    ResponseType.WEB
    ));
  }
  
  override post(data: VenueCategoryResourceData, _req?: Request): Promise<Response> {
    this.logAction('VenueCategoriesWeb POST', { data });
    console.log("Web POST data:", data);
    
    // Validate required fields
    if (!data.name || typeof data.name !== "string" || data.name.trim() === "") {
      console.log("Missing or invalid name field in data:", data);
      return Promise.resolve(ResponseService.error(
        "Missing or invalid name field",
        "MISSING_FIELD",
        400,
        { field: "name" },
        ResponseType.WEB
      ));
    }
    
    console.log("Web: Creating new venue category resource", data);
    // Web-specific resource creation logic
    return Promise.resolve(ResponseService.created(
      { ...data, redirect: "/venue_categories" },
      "new-venue-categories-web-id",
      ResponseType.WEB
    ));
  }
  
  override put(id: string, data: VenueCategoryResourceData, _req?: Request): Promise<Response> {
    this.logAction('VenueCategoriesWeb PUT', { id, data });
    
    console.log(`Web: Updating venue category resource with id: ${id}`);
    // Web-specific resource update logic
    return Promise.resolve(ResponseService.success({ 
      ...data, 
      id, 
      updated: true,
      redirect: `/venue_categories/${id}`
    },
    200,
    undefined,
    ResponseType.WEB
    ));
  }
  
  override delete(id: string, _req?: Request): Promise<Response> {
    this.logAction('VenueCategoriesWeb DELETE', { id });
    
    console.log(`Web: Deleting venue categories resource with id: ${id}`);
    // Web-specific resource deletion logic
    return Promise.resolve(ResponseService.success({ 
      deleted: true, 
      id, 
      redirect: "/venue_categories",
      message: "Venue categories resource deleted successfully"
    },
    200,
    undefined,
    ResponseType.WEB
    ));
  }
}
