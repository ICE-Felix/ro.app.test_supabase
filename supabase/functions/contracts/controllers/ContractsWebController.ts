import { ResponseService } from "../../_shared/services/ResponseService.ts";
import { ResponseType } from "../../_shared/services/ErrorsService.ts";
import { Controller } from "../../_shared/controllers/Controller.ts";

// Define resource data interface
interface ContractsResourceData {
  requiredField: string;
  [key: string]: unknown;
}

export class ContractsWebController extends Controller<ContractsResourceData> {
  // Core Web methods
  override get(id?: string, _req?: Request): Promise<Response> {
    this.logAction('ContractsWeb GET', { id });
    
    if (id) {
      console.log(`Web: Fetching contract with id: ${id}`);
      // Web-specific resource retrieval logic, possibly returning HTML
      return Promise.resolve(ResponseService.success({ 
        id, 
        data: "Contracts Web Resource data", 
        html: "<div>Contracts Resource Details</div>" 
      },
      200,
      undefined,
      ResponseType.WEB
      ));
    }
    
    console.log("Web: Fetching all contracts");
    // Web-specific resources retrieval logic
    return Promise.resolve(ResponseService.success({ 
      resources: ["Contracts_Web_Resource1", "Contracts_Web_Resource2"], 
      html: "<ul><li>Contracts Resource 1</li><li>Contracts Resource 2</li></ul>" 
    },
    200,
    undefined,
    ResponseType.WEB
    ));
  }
  
  override post(data: ContractsResourceData, _req?: Request): Promise<Response> {
    this.logAction('ContractsWeb POST', { data });
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
    
    console.log("Web: Creating new contract", data);
    // Web-specific resource creation logic
    return Promise.resolve(ResponseService.created(
      { ...data, redirect: "/contracts" },
      "new-contract-web-id",
      ResponseType.WEB
    ));
  }
  
    override put(id: string, data: ContractsResourceData, _req?: Request): Promise<Response> {
    this.logAction('ContractsWeb PUT', { id, data });
    
    console.log(`Web: Updating contract with id: ${id}`);
    // Web-specific resource update logic
    return Promise.resolve(ResponseService.success({ 
      ...data, 
      id, 
      updated: true,
      redirect: `/contracts/${id}`
    },
    200,
    undefined,
    ResponseType.WEB
    ));
  }
  
  override delete(id: string, _req?: Request): Promise<Response> {
    this.logAction('ContractsWeb DELETE', { id });
    
    console.log(`Web: Deleting contract with id: ${id}`);
    // Web-specific resource deletion logic
    return Promise.resolve(ResponseService.success({ 
      deleted: true, 
      id, 
      redirect: "/contracts",
      message: "Contract deleted successfully"
    },
    200,
    undefined,
    ResponseType.WEB
    ));
  }
}