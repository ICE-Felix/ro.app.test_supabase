import { ResponseService } from "../../_shared/services/ResponseService.ts";
import { ResponseType } from "../../_shared/services/ErrorsService.ts";
import { Controller } from "../../_shared/controllers/Controller.ts";
import { AuthenticationService } from "../../_shared/services/AuthenticationService.ts";

// Define resource data interface
interface RegionsData {
  name: string;
  country_id: string;
  [key: string]: unknown;
}

// Define interface for country data
interface CountryData {
    id: string;
    name: string;
  }
  
// Define extended interface for region data with country information
interface RegionsDataWithCountry extends RegionsData {
    country?: CountryData;
    country_name?: string;
}

export class RegionsApiController extends Controller<RegionsData> {
  
  // Helper method to validate UUID format
  private isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }
  
  // Validation method for region data
  private validateRegionsData(data: RegionsData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.name || typeof data.name !== "string" || data.name.trim() === "") {
      errors.push("name is required and must be a non-empty string");
    }

    // Validate country_id if provided
    if (
      data.country_id && typeof data.country_id === "string"
    ) {
      if (!this.isValidUUID(data.country_id)) {
        errors.push("country_id must be a valid UUID");
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Validation method for partial updates
  private validateRegionsDataForUpdate(data: Partial<RegionsData>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (data.name !== undefined) {
      if (!data.name || typeof data.name !== "string" || data.name.trim() === "") {
        errors.push("name must be a non-empty string if provided");
      }
    }

    // Validate country_id if present
    if (data.country_id !== undefined && data.country_id !== null) {
        if (typeof data.country_id === "string" && !this.isValidUUID(data.country_id)) {
          errors.push("country_id must be a valid UUID");
        }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Helper method to add country_name to region data
  private addCountryName(region: any): any {
    if (region.country && region.country.name) {
      region.country_name = `${region.country.name}`;
    }
    return region;
  }

  // Core API methods
  override async get(id?: string, _req?: Request): Promise<Response> {
    this.logAction("RegionsAPI GET", { id });

    const { client } = await AuthenticationService.authenticate(_req!);

    this.logAction(typeof client);

    if (id) {
      console.log(`API: Fetching region with id: ${id}`);
      return client
        .from("regions")
        .select(`
            *,
            country:country_id(
              id,
              name
            )
          `)
        .eq("id", id)
        .is("deleted_at", null)
        .single()
        .then(({ data, error }) => {
          if (error) {
            return ResponseService.error(
              "Error fetching region",
              error.code,
              400,
              error,
              ResponseType.API,
            );
          }

          // Add country_name if country exists
          const regionWithCountryName = this.addCountryName(data);
          return ResponseService.success(
            regionWithCountryName,
            200,
            undefined,
            ResponseType.API,
          );
        });
    }

    console.log("API: Fetching all regions");
    return client
      .from("regions")
      .select(`
        *,
        country:country_id(
          id,
          name
        )
      `)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          return ResponseService.error(
            "Error fetching regions",
            error.code,
            400,
            error,
            ResponseType.API,
          );
        }

        // Add country_name to each region if country exists
        const regionsWithCountryNames = data?.map((region: any) => 
            this.addCountryName(region)
        );

        return ResponseService.success(
          regionsWithCountryNames,
          200,
          undefined,
          ResponseType.API,
        );
      });
  }
  
  override async post(
    data: RegionsData,
    _req?: Request,
  ): Promise<Response> {
    this.logAction("RegionsAPI POST", { data });

    // Validate region data
    const validation = this.validateRegionsData(data);
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
    const regionData = {
      name: data.name.trim(),
      country_id: data.country_id || null,
    };

    console.log("API: Creating new region", regionData);

    return client
      .from("regions")
      .insert(regionData)
      .select(`
        *,
        country:country_id(
          id,
          name
        )
      `)
      .single()
      .then(({ data, error }) => {
        if (error) {
          return ResponseService.error(
            "Error creating region",
            error.code,
            400,
            error,
            ResponseType.API,
          );
        }

        // Add country_name if country exists
        const regionWithCountryName = this.addCountryName(data);

        return ResponseService.created(
          regionWithCountryName,
          data.id,
          ResponseType.API,
        );
      });
  }

  override async put(
    id: string,
    data: Partial<RegionsData>,
    _req?: Request,
  ): Promise<Response> {
    this.logAction("RegionsAPI PUT", { id, data });

    // Validate region data (only validates present fields)
    const validation = this.validateRegionsDataForUpdate(data);
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
    const regionData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    // Only add fields if they were provided in the request
    if (data.name !== undefined) {
      regionData.name = data.name.trim();
    }

    if (data.country_id !== undefined) {
      regionData.country_id = data.country_id || null;
    }

    console.log(`API: Updating region with id: ${id}`, regionData);

    return client
      .from("regions")
      .update(regionData)
      .eq("id", id)
      .is("deleted_at", null)
      .select(`
        *,
        country:country_id(
          id,
          name
        )
      `)
      .single()
      .then(({ data, error }) => {
        if (error) {
          return ResponseService.error(
            "Error updating region",
            error.code,
            400,
            error,
            ResponseType.API,
          );
        }

        // Add country_name if country exists
        const regionWithCountryName = this.addCountryName(data);

        return ResponseService.success(
          regionWithCountryName,
          200,
          undefined,
          ResponseType.API,
        );
      });
  }
  
  override async delete(id: string, _req?: Request): Promise<Response> {
    this.logAction("RegionsAPI DELETE", { id });

    const { client } = await AuthenticationService.authenticate(_req!);

    console.log(`API: Soft deleting region with id: ${id}`);

    return client
      .from("regions")
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
            "Error deleting region",
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