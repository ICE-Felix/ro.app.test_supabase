import { ResponseService } from "../../_shared/services/ResponseService.ts";
import { ResponseType } from "../../_shared/services/ErrorsService.ts";
import { Controller } from "../../_shared/controllers/Controller.ts";

// Define resource data interface
interface VenueGeneralAttributesData {
  type: string;
  value: string;
  [key: string]: unknown;
}

export class VenueGeneralAttributesWebController extends Controller<VenueGeneralAttributesData> {
  // Core Web methods
  override get(id?: string, _req?: Request): Promise<Response> {
    this.logAction('VenueGeneralAttributesWeb GET', { id });
    
    if (id) {
      console.log(`Web: Fetching venue general attribute with id: ${id}`);
      // Web-specific resource retrieval logic, possibly returning HTML
      return Promise.resolve(ResponseService.success({ 
        id, 
        data: "Venue General Attribute Web Resource data", 
        html: "<div>Venue General Attribute Resource Details</div>" 
      },
      200,
      undefined,
      ResponseType.WEB
      ));
    }
    
    console.log("Web: Fetching all venue general attributes");
    // Web-specific resources retrieval logic
    return Promise.resolve(ResponseService.success({ 
      resources: ["Venue_General_Attribute_Web_Resource1", "Venue_General_Attribute_Web_Resource2"], 
      html: "<ul><li>Venue General Attribute Resource 1</li><li>Venue General Attribute Resource 2</li></ul>" 
    },
    200,
    undefined,
    ResponseType.WEB
    ));
  }
  
  override post(data: VenueGeneralAttributesData, _req?: Request): Promise<Response> {
    this.logAction('VenueGeneralAttributesWeb POST', { data });
    console.log("Web POST data:", data);
    
    // Validate required fields
    if (!data.requiredField) {
      console.log("Missing required field in data:", data);
      return Promise.resolve(ResponseService.error(
        "Missing required field",
        "MISSING_FIELD",
        400,
        { field: "requiredField" },
        ResponseType.WEB
      ));
    }
    
    console.log("Web: Creating new venue general attribute", data);
    // Web-specific resource creation logic
    return Promise.resolve(ResponseService.created(
      { ...data, redirect: "/venue_general_attributes" },
      "new-venue-general-attribute-web-id",
      ResponseType.WEB
    ));
  }
  
  override put(id: string, data: VenueGeneralAttributesData, _req?: Request): Promise<Response> {
    this.logAction('VenueGeneralAttributesWeb PUT', { id, data });
    
    console.log(`Web: Updating venue general attribute with id: ${id}`);
    // Web-specific resource update logic
    return Promise.resolve(ResponseService.success({ 
      ...data, 
      id, 
      updated: true,
      redirect: `/venue_general_attributes/${id}`
    },
    200,
    undefined,
    ResponseType.WEB
    ));
  }
  
  override delete(id: string, _req?: Request): Promise<Response> {
    this.logAction('VenueGeneralAttributesWeb DELETE', { id });
    
    console.log(`Web: Deleting venue general attribute with id: ${id}`);
    // Web-specific resource deletion logic
    return Promise.resolve(ResponseService.success({ 
      deleted: true, 
      id, 
      redirect: "/venue_general_attributes",
      message: "Venue general attribute deleted successfully"
    },
    200,
    undefined,
    ResponseType.WEB
    ));
  }
}