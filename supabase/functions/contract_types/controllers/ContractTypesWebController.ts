import { ResponseService } from "../../_shared/services/ResponseService.ts";
import { ResponseType } from "../../_shared/services/ErrorsService.ts";
import { Controller } from "../../_shared/controllers/Controller.ts";

// Define resource data interface
interface ContractTypesResourceData {
  requiredField: string;
  [key: string]: unknown;
}

export class ContractTypesWebController extends Controller<ContractTypesResourceData> {
  // Core Web methods
  override get(id?: string, _req?: Request): Promise<Response> {
    this.logAction('ContractTypesWeb GET', { id });
    
    if (id) {
      console.log(`Web: Fetching contract type with id: ${id}`);
      // Web-specific resource retrieval logic, possibly returning HTML
      return Promise.resolve(ResponseService.success({ 
        id, 
        data: "Contract Type Web Resource data", 
        html: "<div>Contract Type Resource Details</div>" 
      },
      200,
      undefined,
      ResponseType.WEB
      ));
    }
    
    console.log("Web: Fetching all contract types");
    // Web-specific resources retrieval logic
    return Promise.resolve(ResponseService.success({ 
      resources: ["Contract_Type_Web_Resource1", "Contract_Type_Web_Resource2"], 
      html: "<ul><li>Contract Type 1</li><li>Contract Type 2</li></ul>" 
    },
    200,
    undefined,
    ResponseType.WEB
    ));
  }
  
  override post(data: ContractTypesResourceData, _req?: Request): Promise<Response> {
    this.logAction('ContractTypesWeb POST', { data });
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
    
    console.log("Web: Creating new contract type", data);
    // Web-specific resource creation logic
    return Promise.resolve(ResponseService.created(
      { ...data, redirect: "/contract_types" },
      "new-contract-type-web-id",
      ResponseType.WEB
    ));
  }
  
  override put(id: string, data: ContractTypesResourceData, _req?: Request): Promise<Response> {
    this.logAction('ContractTypesWeb PUT', { id, data });
    
    console.log(`Web: Updating contract type with id: ${id}`);
    // Web-specific resource update logic
    return Promise.resolve(ResponseService.success({ 
      ...data, 
      id, 
      updated: true,
      redirect: `/contract_types/${id}`
    },
    200,
    undefined,
    ResponseType.WEB
    ));
  }
  
  override delete(id: string, _req?: Request): Promise<Response> {
    this.logAction('ContractTypesWeb DELETE', { id });
    
    console.log(`Web: Deleting contract type with id: ${id}`);
    // Web-specific resource deletion logic
    return Promise.resolve(ResponseService.success({ 
      deleted: true, 
      id, 
      redirect: "/contract_types",
      message: "Contract type deleted successfully"
    },
    200,
    undefined,
    ResponseType.WEB
    ));
  }
}