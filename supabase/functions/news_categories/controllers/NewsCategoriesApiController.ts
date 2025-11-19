import { ResponseService } from "../../_shared/services/ResponseService.ts";
import { ResponseType } from "../../_shared/services/ErrorsService.ts";
import { Controller } from "../../_shared/controllers/Controller.ts";
import { AuthenticationService } from "../../_shared/services/AuthenticationService.ts";

// Define news categories data interface matching the database table
interface NewsCategoriesData {
  name: string;
  [key: string]: unknown;
}

export class NewsCategoriesApiController
  extends Controller<NewsCategoriesData> {

  // Validation method
  private validateNewsCategoriesData(
    data: NewsCategoriesData,
  ): { isValid: boolean; errors: string[] } {
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

  // Validation method for updates (only validates present fields)
  private validateNewsCategoriesDataForUpdate(
    data: Partial<NewsCategoriesData>,
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate name if present
    if (data.name !== undefined) {
      if (
        !data.name || typeof data.name !== "string" ||
        data.name.trim() === ""
      ) {
        errors.push("name must be a non-empty string");
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Core API methods
  override async get(id?: string, _req?: Request): Promise<Response> {
    this.logAction("NewsCategoriesAPI GET", { id });

    const { client } = await AuthenticationService.authenticate(_req!);

    this.logAction(typeof client);

    if (id) {
      console.log(`API: Fetching news category with id: ${id}`);
      return client
        .from("news_categories")
        .select("*")
        .eq("id", id)
        .is("deleted_at", null)
        .single()
        .then(({ data, error }) => {
          if (error) {
            return ResponseService.error(
              "Error fetching news category",
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

    console.log("API: Fetching all news categories");
    return client
      .from("news_categories")
      .select("*")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          return ResponseService.error(
            "Error fetching news categories",
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
    data: NewsCategoriesData,
    _req?: Request,
  ): Promise<Response> {
    this.logAction("NewsCategoriesAPI POST", { data });

    // Validate news category data
    const validation = this.validateNewsCategoriesData(data);
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
    const newsCategoryData = {
      name: data.name.trim(),
    };

    console.log("API: Creating new news category", newsCategoryData);

    return client
      .from("news_categories")
      .insert(newsCategoryData)
      .select()
      .single()
      .then(({ data, error }) => {
        if (error) {
          return ResponseService.error(
            "Error creating news category",
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
    data: Partial<NewsCategoriesData>,
    _req?: Request,
  ): Promise<Response> {
    this.logAction("NewsCategoriesAPI PUT", { id, data });

    // Validate news category data (only validates present fields)
    const validation = this.validateNewsCategoriesDataForUpdate(data);
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
    const newsCategoryData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    // Only add name field if it was provided in the request
    if (data.name !== undefined) {
      newsCategoryData.name = data.name.trim();
    }

    console.log(`API: Updating news category with id: ${id}`, newsCategoryData);

    return client
      .from("news_categories")
      .update(newsCategoryData)
      .eq("id", id)
      .is("deleted_at", null)
      .select()
      .single()
      .then(({ data, error }) => {
        if (error) {
          return ResponseService.error(
            "Error updating news category",
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
    this.logAction("NewsCategoriesAPI DELETE", { id });

    const { client } = await AuthenticationService.authenticate(_req!);

    console.log(`API: Soft deleting news category with id: ${id}`);

    return client
      .from("news_categories")
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
            "Error deleting news category",
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
