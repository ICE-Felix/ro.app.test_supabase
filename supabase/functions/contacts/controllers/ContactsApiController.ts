import { ResponseService } from "../../_shared/services/ResponseService.ts";
import { ResponseType } from "../../_shared/services/ErrorsService.ts";
import { Controller } from "../../_shared/controllers/Controller.ts";
import { AuthenticationService } from "../../_shared/services/AuthenticationService.ts";

// Define contacts data interface matching the database table
interface ContactsData {
  first_name: string;
  last_name: string;
  phone_no?: string;
  email?: string;
  type?: string; // Department type (e.g., "Management", "Sales", "Support", etc.)
  [key: string]: unknown;
}

export class ContactsApiController extends Controller<ContactsData> {
  // Email validation helper
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Validation method
  private validateContactData(data: ContactsData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate required fields
    if (!data.first_name || typeof data.first_name !== 'string' || data.first_name.trim() === '') {
      errors.push('first_name is required and must be a non-empty string');
    }

    if (!data.last_name || typeof data.last_name !== 'string' || data.last_name.trim() === '') {
      errors.push('last_name is required and must be a non-empty string');
    }

    // Validate optional email format if provided
    if (data.email && typeof data.email === 'string' && data.email.trim() !== '') {
      if (!this.isValidEmail(data.email.trim())) {
        errors.push('email must be a valid email address');
      }
    }

    // Validate phone_no if provided (basic check for non-empty string)
    if (data.phone_no && typeof data.phone_no === 'string' && data.phone_no.trim() === '') {
      errors.push('phone_no must be a non-empty string if provided');
    }

    // Validate type (department) if provided
    if (data.type !== undefined && data.type !== null) {
      if (typeof data.type !== 'string' || data.type.trim() === '') {
        errors.push('type must be a non-empty string if provided');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Validation method for updates (only validates present fields)
  private validateContactDataForUpdate(data: Partial<ContactsData>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate first_name if present
    if (data.first_name !== undefined) {
      if (!data.first_name || typeof data.first_name !== 'string' || data.first_name.trim() === '') {
        errors.push('first_name must be a non-empty string');
      }
    }

    // Validate last_name if present
    if (data.last_name !== undefined) {
      if (!data.last_name || typeof data.last_name !== 'string' || data.last_name.trim() === '') {
        errors.push('last_name must be a non-empty string');
      }
    }

    // Validate optional email format if provided
    if (data.email !== undefined && data.email !== null) {
      if (typeof data.email === 'string' && data.email.trim() !== '') {
        if (!this.isValidEmail(data.email.trim())) {
          errors.push('email must be a valid email address');
        }
      }
    }

    // Validate phone_no if provided (basic check for non-empty string)
    if (data.phone_no !== undefined && data.phone_no !== null) {
      if (typeof data.phone_no === 'string' && data.phone_no.trim() === '') {
        errors.push('phone_no must be a non-empty string if provided');
      }
    }

    // Validate type (department) if provided
    if (data.type !== undefined && data.type !== null) {
      if (typeof data.type !== 'string' || data.type.trim() === '') {
        errors.push('type must be a non-empty string if provided');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Core API methods
  override async get(id?: string, _req?: Request): Promise<Response> {
    this.logAction('ContactsAPI GET', { id });
    
    const {client} = await AuthenticationService.authenticate(_req!);
    
    this.logAction(typeof client);
    
    if (id) {
      console.log(`API: Fetching contact with id: ${id}`);
      return client
        .from('contacts')
        .select('*')
        .eq('id', id)
        .is('deleted_at', null)
        .single()
        .then(({ data, error }) => {
          if (error) {
            return ResponseService.error(
              "Error fetching contact",
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
    
    console.log("API: Fetching all contacts");
    return client
      .from('contacts')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          return ResponseService.error(
            "Error fetching contacts",
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
  
  override async post(data: ContactsData, _req?: Request): Promise<Response> {
    this.logAction('ContactsAPI POST', { data });
    
    // Validate contact data
    const validation = this.validateContactData(data);
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
    const contactData = {
      first_name: data.first_name.trim(),
      last_name: data.last_name.trim(),
      phone_no: data.phone_no?.trim() || null,
      email: data.email?.trim() || null,
      type: data.type?.trim() || null
    };
    
    console.log("API: Creating new contact", contactData);
    
    return client
      .from('contacts')
      .insert(contactData)
      .select()
      .single()
      .then(({ data, error }) => {
        if (error) {
          return ResponseService.error(
            "Error creating contact",
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
  
  override async put(id: string, data: Partial<ContactsData>, _req?: Request): Promise<Response> {
    this.logAction('ContactsAPI PUT', { id, data });
    
    // Validate contact data (only validates present fields)
    const validation = this.validateContactDataForUpdate(data);
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
    
    // Prepare data for update (only include fields that were sent)
    const contactData: Record<string, any> = {
      updated_at: new Date().toISOString()
    };

    // Only add fields that were provided in the request
    if (data.first_name !== undefined) {
      contactData.first_name = data.first_name.trim();
    }
    
    if (data.last_name !== undefined) {
      contactData.last_name = data.last_name.trim();
    }
    
    if (data.phone_no !== undefined) {
      contactData.phone_no = data.phone_no?.trim() || null;
    }
    
    if (data.email !== undefined) {
      contactData.email = data.email?.trim() || null;
    }
    
    if (data.type !== undefined) {
      contactData.type = data.type?.trim() || null;
    }
    
    console.log(`API: Updating contact with id: ${id}`, contactData);
    
    return client
      .from('contacts')
      .update(contactData)
      .eq('id', id)
      .is('deleted_at', null)
      .select()
      .single()
      .then(({ data, error }) => {
        if (error) {
          return ResponseService.error(
            "Error updating contact",
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
    this.logAction('ContactsAPI DELETE', { id });
    
    const {client} = await AuthenticationService.authenticate(_req!);
    
    console.log(`API: Soft deleting contact with id: ${id}`);
    
    return client
      .from('contacts')
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
            "Error deleting contact",
            error.code,
            400,
            error,
            ResponseType.API
          );
        }
        return ResponseService.success(
          { deleted: true, id: data.id },
          200,
          undefined,
          ResponseType.API
        );
      });
  }
}