import { ResponseService } from "../../_shared/services/ResponseService.ts";
import { ResponseType } from "../../_shared/services/ErrorsService.ts";
import { Controller } from "../../_shared/controllers/Controller.ts";

// Define resource data interface
interface RegionsData {
  name: string;
  country_id: string;
  [key: string]: unknown;
}

export class RegionsWebController extends Controller<RegionsData> {
  // Core Web methods
  override get(id?: string, _req?: Request): Promise<Response> {
    this.logAction('RegionsWeb GET', { id });
    
    if (id) {
      console.log(`Web: Fetching region with id: ${id}`);
      // Web-specific resource retrieval logic, possibly returning HTML
      return Promise.resolve(ResponseService.success({ 
        id, 
        data: "Region Web Resource data", 
        html: "<div>Region Resource Details</div>" 
      },
      200,
      undefined,
      ResponseType.WEB
      ));
    }
    
    console.log("Web: Fetching all regions");
    // Web-specific resources retrieval logic
    return Promise.resolve(ResponseService.success({ 
      resources: ["Region_Web_Resource1", "Region_Web_Resource2"], 
      html: "<ul><li>Region Resource 1</li><li>Region Resource 2</li></ul>" 
    },
    200,
    undefined,
    ResponseType.WEB
    ));
  }
  
  override post(data: RegionsData, _req?: Request): Promise<Response> {
    this.logAction('RegionsWeb POST', { data });
    console.log("Web POST data:", data);
    
    // Validate required fields
    if (!data.name) {
      console.log("Missing name field in data:", data);
      return Promise.resolve(ResponseService.error(
        "Missing required field",
        "MISSING_FIELD",
        400,
        { field: "name" },
        ResponseType.WEB
      ));
    }

    if (!data.country_id) {
      console.log("Missing country_id field in data:", data);
      return Promise.resolve(ResponseService.error(
        "Missing required field",
        "MISSING_FIELD",
        400,
        { field: "country_id" },
        ResponseType.WEB
      ));
    }
    
    console.log("Web: Creating new region", data);
    // Web-specific resource creation logic
    return Promise.resolve(ResponseService.created(
      { ...data, redirect: "/regions" },
      "new-region-web-id",
      ResponseType.WEB
    ));
  }
  
  override put(id: string, data: RegionsData, _req?: Request): Promise<Response> {
    this.logAction('RegionsWeb PUT', { id, data });
    
    console.log(`Web: Updating region with id: ${id}`);
    // Web-specific resource update logic
    return Promise.resolve(ResponseService.success({ 
      ...data, 
      id, 
      updated: true,
      redirect: `/regions/${id}`
    },
    200,
    undefined,
    ResponseType.WEB
    ));
  }
  
  override delete(id: string, _req?: Request): Promise<Response> {
    this.logAction('RegionsWeb DELETE', { id });
    
    console.log(`Web: Deleting region with id: ${id}`);
    // Web-specific resource deletion logic
    return Promise.resolve(ResponseService.success({ 
      deleted: true, 
      id, 
      redirect: "/regions",
      message: "Region deleted successfully"
    },
    200,
    undefined,
    ResponseType.WEB
    ));
  }
} 