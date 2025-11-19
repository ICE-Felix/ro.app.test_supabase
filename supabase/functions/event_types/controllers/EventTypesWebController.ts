import { ResponseService } from "../../_shared/services/ResponseService.ts";
import { ResponseType } from "../../_shared/services/ErrorsService.ts";
import { Controller } from "../../_shared/controllers/Controller.ts";

// Define resource data interface
interface EventTypesResourceData {
  requiredField: string;
  [key: string]: unknown;
}

export class EventTypesWebController extends Controller<EventTypesResourceData> {
  // Core Web methods
  override get(id?: string, _req?: Request): Promise<Response> {
    this.logAction('EventTypesWeb GET', { id });
    
    if (id) {
      console.log(`Web: Fetching event type resource with id: ${id}`);
      // Web-specific resource retrieval logic, possibly returning HTML
      return Promise.resolve(ResponseService.success({ 
        id, 
        data: "Event Type Web Resource data", 
        html: "<div>Event Type Resource Details</div>" 
      },
      200,
      undefined,
      ResponseType.WEB
      ));
    }
    
    console.log("Web: Fetching all blank resources");
    // Web-specific resources retrieval logic
    return Promise.resolve(ResponseService.success({ 
      resources: ["Event_Type_Web_Resource1", "Event_Type_Web_Resource2"], 
      html: "<ul><li>Event Type Resource 1</li><li>Event Type Resource 2</li></ul>" 
    },
    200,
    undefined,
    ResponseType.WEB
    ));
  }
  
  override post(data: EventTypesResourceData, _req?: Request): Promise<Response> {
    this.logAction('EventTypesWeb POST', { data });
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
    
    console.log("Web: Creating new event type resource", data);
    // Web-specific resource creation logic
    return Promise.resolve(ResponseService.created(
      { ...data, redirect: "/event_types" },
      "new-event-type-web-id",
      ResponseType.WEB
    ));
  }
  
  override put(id: string, data: EventTypesResourceData, _req?: Request): Promise<Response> {
    this.logAction('EventTypesWeb PUT', { id, data });
    
    console.log(`Web: Updating event type resource with id: ${id}`);
    // Web-specific resource update logic
    return Promise.resolve(ResponseService.success({ 
      ...data, 
      id, 
      updated: true,
      redirect: `/event_types/${id}`
    },
    200,
    undefined,
    ResponseType.WEB
    ));
  }
  
  override delete(id: string, _req?: Request): Promise<Response> {
    this.logAction('EventTypesWeb DELETE', { id });
    
    console.log(`Web: Deleting event type resource with id: ${id}`);
    // Web-specific resource deletion logic
    return Promise.resolve(ResponseService.success({ 
      deleted: true, 
      id, 
      redirect: "/event_types",
      message: "Event type resource deleted successfully"
    },
    200,
    undefined,
    ResponseType.WEB
    ));
  }
}