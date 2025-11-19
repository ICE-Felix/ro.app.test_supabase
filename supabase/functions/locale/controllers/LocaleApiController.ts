import { ResponseService } from "../../_shared/services/ResponseService.ts";
import { ResponseType } from "../../_shared/services/ErrorsService.ts";
import { Controller } from "../../_shared/controllers/Controller.ts";
import { AuthenticationService } from "../../_shared/services/AuthenticationService.ts";

// Define resource data interface
interface LocaleResourceData {
  code: string;
  label: string;
  [key: string]: unknown;
}

export class LocaleApiController extends Controller<LocaleResourceData> {
 // Validation method
 private validateLocaleData(data: LocaleResourceData): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate required fields
  if (!data.code || typeof data.code !== 'string' || data.code.trim() === '') {
    errors.push('code is required and must be a non-empty string');
  }

  if (!data.label || typeof data.label !== 'string' || data.label.trim() === '') {
    errors.push('label is required and must be a non-empty string');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

  // Validation method for updates (only validates present fields)
  private validateLocaleDataForUpdate(data: Partial<LocaleResourceData>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate code if present
    if (data.code !== undefined) {
      if (!data.code || typeof data.code !== 'string' || data.code.trim() === '') {
        errors.push('code must be a non-empty string');
      }
    }

    // Validate label if present
    if (data.label !== undefined) {
      if (!data.label || typeof data.label !== 'string' || data.label.trim() === '') {
        errors.push('label must be a non-empty string');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  // Core API methods
  override async get(id?: string, _req?: Request): Promise<Response> {
    this.logAction("LocaleAPI GET", { id });

    const { client } = await AuthenticationService.authenticate(_req!);

    if (id) {
      console.log(`API: Fetching locale with id: ${id}`);
      return client
        .from("locale")
        .select('*')
        .eq('id', id)
        .is("deleted_at", null)
        .single()
        .then(({ data, error }) => {
          if (error) {
            // Handle the case where resource is not found
            if (error.code === 'PGRST116') {
              return ResponseService.error(
                "Locale not found",
                "NOT_FOUND",
                404,
                undefined,
                ResponseType.API,
              );
            }
            return ResponseService.error(
              "Error fetching locale",
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

    console.log("API: Fetching all locales");
    return client
      .from('locale')
      .select('*')
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          return ResponseService.error(
            "Error fetching locales",
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
  
  override async post(data: LocaleResourceData, _req?: Request): Promise<Response> {
    this.logAction('LocaleAPI POST', { data });
    
    // Validate locale data
    const validation = this.validateLocaleData(data);
    if (!validation.isValid) {
      return Promise.resolve(ResponseService.error(
        "Validation failed",
        "VALIDATION_ERROR",
        400,
        { errors: validation.errors },
        ResponseType.API
      ));
    }

    const {client} = await AuthenticationService.authenticate(_req!);
    
    // Prepare data for insertion (trim strings and handle nulls)
    const localeData = {
      code: data.code.trim(),
      label: data.label.trim()
    };
    
    console.log("API: Creating new locale", localeData);
    
    return client
      .from('locale')
      .insert(localeData)
      .select()
      .single()
      .then(({ data, error }) => {
        if (error) {
          return ResponseService.error(
            "Error creating locale",
            error.code,
            400,
            error,
            ResponseType.API
          );
        }
        return ResponseService.created(
          data,
          data.id,
          ResponseType.API
        );
      });
  }

  override async put(id: string, data: Partial<LocaleResourceData>, _req?: Request): Promise<Response> {
    this.logAction('LocaleAPI PUT', { id, data });
    
    // Validate locale data (only validates present fields)
    const validation = this.validateLocaleDataForUpdate(data);
    if (!validation.isValid) {
      return Promise.resolve(ResponseService.error(
        "Validation failed",
        "VALIDATION_ERROR",
        400,
        { errors: validation.errors },
        ResponseType.API
      ));
    }

    const {client} = await AuthenticationService.authenticate(_req!);
    
    // First check if the resource exists
    const { data: existingData, error: checkError } = await client
      .from('locale')
      .select('id')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (checkError) {
      if (checkError.code === 'PGRST116') {
        return ResponseService.error(
          "Locale not found",
          "NOT_FOUND", 
          404,
          undefined,
          ResponseType.API
        );
      }
      return ResponseService.error(
        "Error checking locale",
        checkError.code,
        400,
        checkError,
        ResponseType.API
      );
    }

    if (!existingData) {
      return ResponseService.error(
        "Locale not found",
        "NOT_FOUND",
        404,
        undefined,
        ResponseType.API
      );
    }
    
    // Prepare data for update (only include fields that were sent)
    const localeData: Record<string, any> = {
      updated_at: new Date().toISOString()
    };

    // Only add fields that were provided in the request
    if (data.code !== undefined) {
      localeData.code = data.code.trim();
    }
    
    if (data.label !== undefined) {
      localeData.label = data.label.trim();
    }
    
    console.log(`API: Updating locale with id: ${id}`, localeData);
    
    return client
      .from('locale')
      .update(localeData)
      .eq('id', id)
      .is('deleted_at', null)
      .select()
      .single()
      .then(({ data, error }) => {
        if (error) {
          return ResponseService.error(
            "Error updating locale",
            error.code,
            400,
            error,
            ResponseType.API
          );
        }
        return ResponseService.success(
          data,
          200,
          undefined,
          ResponseType.API
        );
      });
  }
  
  override async delete(id: string, _req?: Request): Promise<Response> {
    this.logAction('LocaleAPI DELETE', { id });
    
    const {client} = await AuthenticationService.authenticate(_req!);
    
    // First check if the resource exists
    const { data: existingData, error: checkError } = await client
      .from('locale')
      .select('id')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (checkError) {
      if (checkError.code === 'PGRST116') {
        return ResponseService.error(
          "Locale not found",
          "NOT_FOUND",
          404,
          undefined,
          ResponseType.API
        );
      }
      return ResponseService.error(
        "Error checking locale",
        checkError.code,
        400,
        checkError,
        ResponseType.API
      );
    }

    if (!existingData) {
      return ResponseService.error(
        "Locale not found",
        "NOT_FOUND",
        404,
        undefined,
        ResponseType.API
      );
    }
    
    console.log(`API: Soft deleting locale with id: ${id}`);
    
    // Perform soft delete by setting deleted_at timestamp
    return client
      .from('locale')
      .update({ 
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .is('deleted_at', null)
      .select()
      .single()
      .then(({ data, error }) => {
        if (error) {
          return ResponseService.error(
            "Error deleting locale",
            error.code,
            400,
            error,
            ResponseType.API
          );
        }
        return ResponseService.success(
          { deleted: true, id, deleted_at: data.deleted_at },
          200,
          undefined,
          ResponseType.API
        );
      });
  }
}