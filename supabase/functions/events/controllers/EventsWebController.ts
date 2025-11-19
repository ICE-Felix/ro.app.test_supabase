import { ResponseService } from "../../_shared/services/ResponseService.ts";
import { ResponseType } from "../../_shared/services/ErrorsService.ts";
import { Controller } from "../../_shared/controllers/Controller.ts";

// Define resource data interface
interface EventsResourceData {
  requiredField: string;
  [key: string]: unknown;
}

export class EventsWebController extends Controller<EventsResourceData> {
  // Core Web methods
  override get(id?: string, _req?: Request): Promise<Response> {
    this.logAction('EventsWeb GET', { id });
    
    if (id) {
      console.log(`Web: Fetching event resource with id: ${id}`);
      // Web-specific resource retrieval logic, possibly returning HTML
      return Promise.resolve(ResponseService.success({ 
        id, 
        data: "Events Web Resource data", 
        html: "<div>Events Resource Details</div>" 
      },
      200,
      undefined,
      ResponseType.WEB
      ));
    }
    
    console.log("Web: Fetching all events resources");
    // Web-specific resources retrieval logic
    return Promise.resolve(ResponseService.success({ 
      resources: ["Events_Web_Resource1", "Events_Web_Resource2"], 
      html: "<ul><li>Events Resource 1</li><li>Events Resource 2</li></ul>" 
    },
    200,
    undefined,
    ResponseType.WEB
    ));
  }
  
  override post(data: EventsResourceData, _req?: Request): Promise<Response> {
    this.logAction('EventsWeb POST', { data });
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
    
    console.log("Web: Creating new event resource", data);
    // Web-specific resource creation logic
    return Promise.resolve(ResponseService.created(
      { ...data, redirect: "/events" },
      "new-events-web-id",
      ResponseType.WEB
    ));
  }
  
    override put(id: string, data: EventsResourceData, _req?: Request): Promise<Response> {
    this.logAction('EventsWeb PUT', { id, data });
    
    console.log(`Web: Updating event resource with id: ${id}`);
    // Web-specific resource update logic
    return Promise.resolve(ResponseService.success({ 
      ...data, 
      id, 
      updated: true,
      redirect: `/events/${id}`
    },
    200,
    undefined,
    ResponseType.WEB
    ));
  }
  
  override delete(id: string, _req?: Request): Promise<Response> {
    this.logAction('EventsWeb DELETE', { id });
    
    console.log(`Web: Deleting event resource with id: ${id}`);
    // Web-specific resource deletion logic
    return Promise.resolve(ResponseService.success({ 
      deleted: true, 
      id, 
      redirect: "/events",
      message: "Event resource deleted successfully"
    },
    200,
    undefined,
    ResponseType.WEB
    ));
  }
}