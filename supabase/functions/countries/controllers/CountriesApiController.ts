import { ResponseService } from "../../_shared/services/ResponseService.ts";
import { ResponseType } from "../../_shared/services/ErrorsService.ts";
import { Controller } from "../../_shared/controllers/Controller.ts";
import { AuthenticationService } from "../../_shared/services/AuthenticationService.ts";

// Define resource data interface
interface CountriesData {
  name: string;
  [key: string]: unknown;
}

export class CountriesApiController extends Controller<CountriesData> {
  
  // Validation method for country data
  private validateCountriesData(data: CountriesData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.name || typeof data.name !== "string" || data.name.trim() === "") {
      errors.push("name is required and must be a non-empty string");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Validation method for partial updates
  private validateCountriesDataForUpdate(data: Partial<CountriesData>): { isValid: boolean; errors: string[] } {
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
    this.logAction("CountriesAPI GET", { id });

    const { client } = await AuthenticationService.authenticate(_req!);

    this.logAction(typeof client);

    if (id) {
      console.log(`API: Fetching country with id: ${id}`);
      return client
        .from("countries")
        .select("*")
        .eq("id", id)
        .is("deleted_at", null)
        .single()
        .then(({ data, error }) => {
          if (error) {
            return ResponseService.error(
              "Error fetching country",
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

    console.log("API: Fetching all countries");
    return client
      .from("countries")
      .select("*")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          return ResponseService.error(
            "Error fetching countries",
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
    data: CountriesData,
    _req?: Request,
  ): Promise<Response> {
    this.logAction("CountriesAPI POST", { data });

    // Validate news category data
    const validation = this.validateCountriesData(data);
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
    const countryData = {
      name: data.name.trim(),
    };

    console.log("API: Creating new country", countryData);

    return client
      .from("countries")
      .insert(countryData)
      .select()
      .single()
      .then(({ data, error }) => {
        if (error) {
          return ResponseService.error(
            "Error creating country",
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
    data: Partial<CountriesData>,
    _req?: Request,
  ): Promise<Response> {
    this.logAction("CountriesAPI PUT", { id, data });

    // Validate venue category data (only validates present fields)
    const validation = this.validateCountriesDataForUpdate(data);
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
    const countryData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    // Only add name field if it was provided in the request
    if (data.name !== undefined) {
      countryData.name = data.name.trim();
    }

    console.log(`API: Updating country with id: ${id}`, countryData);

    return client
      .from("countries")
      .update(countryData)
      .eq("id", id)
      .is("deleted_at", null)
      .select()
      .single()
      .then(({ data, error }) => {
        if (error) {
          return ResponseService.error(
            "Error updating country",
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
    this.logAction("CountriesAPI DELETE", { id });

    const { client } = await AuthenticationService.authenticate(_req!);

    console.log(`API: Soft deleting country with id: ${id}`);

    return client
      .from("countries")
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
            "Error deleting country",
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