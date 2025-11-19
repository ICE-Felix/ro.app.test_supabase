import { ResponseService } from "../../_shared/services/ResponseService.ts";
import { ResponseType } from "../../_shared/services/ErrorsService.ts";
import { Controller } from "../../_shared/controllers/Controller.ts";

// Define resource data interface
interface CountriesData {
  name: string;
  [key: string]: unknown;
}

export class CountriesWebController extends Controller<CountriesData> {
  // Core Web methods
  override get(id?: string, _req?: Request): Promise<Response> {
    this.logAction('CountriesWeb GET', { id });
    
    if (id) {
      console.log(`Web: Fetching country with id: ${id}`);
      // Web-specific resource retrieval logic, possibly returning HTML
      return Promise.resolve(ResponseService.success({ 
        id, 
        data: "Country Web Resource data", 
        html: "<div>Country Resource Details</div>" 
      },
      200,
      undefined,
      ResponseType.WEB
      ));
    }
    
    console.log("Web: Fetching all countries");
    // Web-specific resources retrieval logic
    return Promise.resolve(ResponseService.success({ 
      resources: ["Country_Web_Resource1", "Country_Web_Resource2"], 
      html: "<ul><li>Country Resource 1</li><li>Country Resource 2</li></ul>" 
    },
    200,
    undefined,
    ResponseType.WEB
    ));
  }
  
  override post(data: CountriesData, _req?: Request): Promise<Response> {
    this.logAction('CountriesWeb POST', { data });
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
    
    console.log("Web: Creating new country", data);
    // Web-specific resource creation logic
    return Promise.resolve(ResponseService.created(
      { ...data, redirect: "/countries" },
      "new-country-web-id",
      ResponseType.WEB
    ));
  }
  
  override put(id: string, data: CountriesData, _req?: Request): Promise<Response> {
    this.logAction('CountriesWeb PUT', { id, data });
    
    console.log(`Web: Updating country with id: ${id}`);
    // Web-specific resource update logic
    return Promise.resolve(ResponseService.success({ 
      ...data, 
      id, 
      updated: true,
      redirect: `/countries/${id}`
    },
    200,
    undefined,
    ResponseType.WEB
    ));
  }
  
  override delete(id: string, _req?: Request): Promise<Response> {
    this.logAction('CountriesWeb DELETE', { id });
    
    console.log(`Web: Deleting country with id: ${id}`);
    // Web-specific resource deletion logic
    return Promise.resolve(ResponseService.success({ 
      deleted: true, 
      id, 
      redirect: "/countries",
      message: "Country deleted successfully"
    },
    200,
    undefined,
    ResponseType.WEB
    ));
  }
}