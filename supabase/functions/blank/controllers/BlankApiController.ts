import { ResponseService } from "../../_shared/services/ResponseService.ts";
import { ResponseType } from "../../_shared/services/ErrorsService.ts";
import { Controller } from "../../_shared/controllers/Controller.ts";

// Define resource data interface
interface BlankResourceData {
  requiredField: string;
  [key: string]: unknown;
}

export class BlankApiController extends Controller<BlankResourceData> {
  // Core API methods
  override get(id?: string, _req?: Request): Promise<Response> {
    this.logAction('BlankAPI GET', { id });
    
    if (id) {
      console.log(`API: Fetching blank resource with id: ${id}`);
      // Add your custom logic here
      return Promise.resolve(ResponseService.success(
        { id, data: "Blank API Resource data" },
        200,
        undefined,
        ResponseType.API
      ));
    }
    
    console.log("API: Fetching all blank resources");
    // Add your custom logic here
    return Promise.resolve(ResponseService.success(
      ["Blank_API_Resource1", "Blank_API_Resource2"],
      200,
      undefined,
      ResponseType.API
    ));
  }
  
  override post(data: BlankResourceData, _req?: Request): Promise<Response> {
    this.logAction('BlankAPI POST', { data });
    
    // Validate required fields
    if (!data.requiredField) {
      return Promise.resolve(ResponseService.error(
        "Missing required field",
        "MISSING_FIELD",
        400,
        { field: "requiredField" },
        ResponseType.API
      ));
    }
    
    console.log("API: Creating new blank resource", data);
    // Add your custom logic here
    return Promise.resolve(ResponseService.created(
      data,
      "new-blank-api-id",
      ResponseType.API
    ));
  }
  
  override put(id: string, data: BlankResourceData, _req?: Request): Promise<Response> {
    this.logAction('BlankAPI PUT', { id, data });
    
    console.log(`API: Updating blank resource with id: ${id}`);
    // Add your custom logic here
    return Promise.resolve(ResponseService.success(
      { ...data, id, updated: true },
      200,
      undefined,
      ResponseType.API
    ));
  }
  
  override delete(id: string, _req?: Request): Promise<Response> {
    this.logAction('BlankAPI DELETE', { id });
    
    console.log(`API: Deleting blank resource with id: ${id}`);
    // Add your custom logic here
    return Promise.resolve(ResponseService.success(
      { deleted: true, id },
      200,
      undefined,
      ResponseType.API
    ));
  }
}