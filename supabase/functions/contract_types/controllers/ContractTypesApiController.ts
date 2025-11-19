import { ResponseService } from "../../_shared/services/ResponseService.ts";
import { ResponseType } from "../../_shared/services/ErrorsService.ts";
import { Controller } from "../../_shared/controllers/Controller.ts";
import { AuthenticationService } from "../../_shared/services/AuthenticationService.ts";

// Define resource data interface
interface ContractTypesData {
  name: string;
  [key: string]: unknown;
}

export class ContractTypesApiController extends Controller<ContractTypesData> {
  
  // Validation method
  private validateContractTypesData(data: ContractTypesData,): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate required fields
    if (
      !data.name || typeof data.name !== "string" ||
      data.name.trim() === ""
    ) {
      errors.push("name is required and must be a non-empty string");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Validation method for partial updates
  private validateContractTypesDataForUpdate(data: Partial<ContractTypesData>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (data.name !== undefined) {
      if (!data.name || typeof data.name !== "string" || data.name.trim() === "") {
        errors.push("name must be a non-empty string if provided");
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Core API methods
  override async get(id?: string, _req?: Request): Promise<Response> {
    this.logAction("ContractTypesAPI GET", { id });

    const { client } = await AuthenticationService.authenticate(_req!);

    this.logAction(typeof client);

    if (id) {
      console.log(`API: Fetching contract type with id: ${id}`);
      return client
        .from("contract_types")
        .select("*")
        .eq("id", id)
        .is("deleted_at", null)
        .single()
        .then(({ data, error }) => {
          if (error) {
            return ResponseService.error(
              "Error fetching contract type",
              error.code,
              400,
              error,
              ResponseType.API,
            );
          }
          return ResponseService.success(
            data,
            200,
            undefined,
            ResponseType.API,
          );
        });
    }

    console.log("API: Fetching all contract types");
    return client
      .from("contract_types")
      .select("*")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          return ResponseService.error(
            "Error fetching contract types",
            error.code,
            400,
            error,
            ResponseType.API,
          );
        }
        return ResponseService.success(
          data,
          200,
          undefined,
          ResponseType.API,
        );
      });
  }

  override async post(
    data: ContractTypesData,
    _req?: Request,
  ): Promise<Response> {
    this.logAction("ContractTypesAPI POST", { data });

    // Validate news category data
    const validation = this.validateContractTypesData(data);
    if (!validation.isValid) {
      return Promise.resolve(ResponseService.error(
        "Validation failed",
        "VALIDATION_ERROR",
        400,
        { errors: validation.errors },
        ResponseType.API,
      ));
    }

    const { client } = await AuthenticationService.authenticate(_req!);

    // Prepare data for insertion (trim strings)
    const contractTypesData = {
      name: data.name.trim(),
    };

    console.log("API: Creating new contract type", contractTypesData);

    return client
      .from("contract_types")
      .insert(contractTypesData)
      .select()
      .single()
      .then(({ data, error }) => {
        if (error) {
          return ResponseService.error(
            "Error creating contract type",
            error.code,
            400,
            error,
            ResponseType.API,
          );
        }
        return ResponseService.created(
          data,
          data.id,
          ResponseType.API,
        );
      });
  }

  override async put(
    id: string,
    data: Partial<ContractTypesData>,
    _req?: Request,
  ): Promise<Response> {
    this.logAction("ContractTypesAPI PUT", { id, data });

    // Validate venue general attribute data (only validates present fields)
      const validation = this.validateContractTypesDataForUpdate(data);
    if (!validation.isValid) {
      return Promise.resolve(ResponseService.error(
        "Validation failed",
        "VALIDATION_ERROR",
        400,
        { errors: validation.errors },
        ResponseType.API,
      ));
    }

    const { client } = await AuthenticationService.authenticate(_req!);

    // Prepare data for update (only include fields that were sent)
    const contractTypesData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    // Only add name field if it was provided in the request
    if (data.name !== undefined) {
      contractTypesData.name = data.name.trim();
    }
    
    console.log(`API: Updating contract type with id: ${id}`, contractTypesData);

    return client
      .from("contract_types")
      .update(contractTypesData)
      .eq("id", id)
      .is("deleted_at", null)
      .select()
      .single()
      .then(({ data, error }) => {
        if (error) {
          return ResponseService.error(
            "Error updating contract type",
            error.code,
            400,
            error,
            ResponseType.API,
          );
        }
        return ResponseService.success(
          data,
          200,
          undefined,
          ResponseType.API,
        );
      });
  }

  override async delete(id: string, _req?: Request): Promise<Response> {
    this.logAction("ContractTypesAPI DELETE", { id });

    const { client } = await AuthenticationService.authenticate(_req!);

    console.log(`API: Soft deleting contract type with id: ${id}`);

    return client
      .from("contract_types")
      .update({
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .is("deleted_at", null)
      .select()
      .single()
      .then(({ data, error }) => {
        if (error) {
          return ResponseService.error(
            "Error deleting contract type",
            error.code,
            400,
            error,
            ResponseType.API,
          );
        }
        return ResponseService.success(
          { deleted: true, id: data.id },
          200,
          undefined,
          ResponseType.API,
        );
      });
  }
 
}