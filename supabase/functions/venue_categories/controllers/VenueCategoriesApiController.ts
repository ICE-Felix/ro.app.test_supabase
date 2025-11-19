import { ResponseService } from "../../_shared/services/ResponseService.ts";
import { ResponseType } from "../../_shared/services/ErrorsService.ts";
import { Controller } from "../../_shared/controllers/Controller.ts";
import { AuthenticationService } from "../../_shared/services/AuthenticationService.ts";

// Define venue categories data interface matching the database table
interface VenueCategoriesData {
  name: string;
  parent_id?: string | null;
  parent_name?: string | null;
  [key: string]: unknown;
}

export class VenueCategoriesApiController
  extends Controller<VenueCategoriesData> {
  // Validation method
  private validateVenueCategoriesData(
    data: VenueCategoriesData,
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate required fields
    if (
      !data.name || typeof data.name !== "string" ||
      data.name.trim() === ""
    ) {
      errors.push("name is required and must be a non-empty string");
    }

    // Validate parent_id if provided
    if (data.parent_id !== undefined && data.parent_id !== null) {
      if (typeof data.parent_id !== "string" || data.parent_id.trim() === "") {
        errors.push("parent_id must be a valid UUID string or null");
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Validation method for updates (only validates present fields)
  private validateVenueCategoriesDataForUpdate(
    data: Partial<VenueCategoriesData>,
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

    // Validate parent_id if present
    if (data.parent_id !== undefined && data.parent_id !== null) {
      if (typeof data.parent_id !== "string" || data.parent_id.trim() === "") {
        errors.push("parent_id must be a valid UUID string or null");
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Helper method to fetch parent name for a category
  private async fetchParentName(
    client: any,
    parentId: string,
  ): Promise<string | null> {
    if (!parentId) return null;

    try {
      const { data: parentData, error } = await client
        .from("venue_categories")
        .select("name")
        .eq("id", parentId)
        .is("deleted_at", null)
        .single();

      if (error || !parentData) {
        console.log("Error fetching parent category:", error);
        return null;
      }

      return parentData.name;
    } catch (error) {
      console.log("Exception fetching parent category:", error);
      return null;
    }
  }

  // Helper method to add parent_name to category data
  private async addParentName(client: any, category: any): Promise<any> {
    if (category && category.parent_id) {
      category.parent_name = await this.fetchParentName(
        client,
        category.parent_id,
      );
    } else {
      category.parent_name = null;
    }
    return category;
  }

  // Helper method to get parents only venue categories
  private async getParentsOnlyCategories(client: any): Promise<any[]> {
    const { data: categories, error } = await client
      .from("venue_categories")
      .select("*")
      .is("parent_id", null)
      .is("deleted_at", null)
      .order("name", { ascending: true });

    if (error) {
      throw error;
    }

    return categories;
  }

  // Helper method to get venue categories by parent id
  private async getCategoriesByParentId(
    client: any,
    parentId: string,
  ): Promise<any[]> {
    const { data: categories, error } = await client
      .from("venue_categories")
      .select("*")
      .eq("parent_id", parentId)
      .is("deleted_at", null)
      .order("name", { ascending: true });

    if (error) {
      throw error;
    }

    return categories;
  }

  // Helper method to get hierarchical venue categories
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async getHierarchicalCategories(client: any): Promise<any[]> {
    const { data: categories, error } = await client
      .from("venue_categories")
      .select("*")
      .is("deleted_at", null)
      .order("name", { ascending: true });

    if (error) {
      throw error;
    }

    // Build hierarchy
    const categoryMap = new Map();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rootCategories: any[] = [];

    // First pass: create map of all categories and add parent names
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const category of categories) {
      const categoryWithParentName = await this.addParentName(client, category);
      categoryMap.set(category.id, { ...categoryWithParentName, children: [] });
    }

    // Second pass: build hierarchy
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    categories.forEach((category: any) => {
      if (category.parent_id) {
        const parent = categoryMap.get(category.parent_id);
        if (parent) {
          parent.children.push(categoryMap.get(category.id));
        }
      } else {
        rootCategories.push(categoryMap.get(category.id));
      }
    });

    return rootCategories;
  }

  // Core API methods
  override async get(id?: string, _req?: Request): Promise<Response> {
    this.logAction("VenueCategoriesAPI GET", { id });

    const { client } = await AuthenticationService.authenticate(_req!);

    this.logAction(typeof client);

    // Check if hierarchical view is requested
    const url = new URL(_req!.url);
    const hierarchical = url.searchParams.get("hierarchical") === "true";
    const parentsOnly = url.searchParams.get("parents_only") === "true";
    const parentId = url.searchParams.get("parent_id");

    if (id) {
      console.log(`API: Fetching venue category with id: ${id}`);
      const { data, error } = await client
        .from("venue_categories")
        .select("*")
        .eq("id", id)
        .is("deleted_at", null)
        .single();

      if (error) {
        return ResponseService.error(
          "Error fetching venue category",
          error.code,
          400,
          error,
          ResponseType.API,
        );
      }

      // Add parent_name to the category data
      const categoryWithParentName = await this.addParentName(client, data);

      return ResponseService.success(
        categoryWithParentName,
        200,
        undefined,
        ResponseType.API,
      );
    }

    if (hierarchical) {
      console.log("API: Fetching hierarchical venue categories");
      try {
        const hierarchicalData = await this.getHierarchicalCategories(client);
        return ResponseService.success(
          hierarchicalData,
          200,
          undefined,
          ResponseType.API,
        );
      } catch (error) {
        return ResponseService.error(
          "Error fetching hierarchical venue categories",
          "FETCH_ERROR",
          400,
          error as Record<string, unknown>,
          ResponseType.API,
        );
      }
    }

    if (parentsOnly) {
      console.log("API: Fetching parents only venue categories");
      try {
        const parentsOnlyData = await this.getParentsOnlyCategories(client);
        return ResponseService.success(
          parentsOnlyData,
          200,
          undefined,
          ResponseType.API,
        );
      } catch (error) {
        console.log("Exception fetching parents only venue categories:", error);
        return ResponseService.error(
          "Error fetching parents only venue categories",
          "FETCH_ERROR",
          400,
          error as Record<string, unknown>,
          ResponseType.API,
        );
      }
    }

    if (parentId) {
      console.log(`API: Fetching venue categories by parent id: ${parentId}`);
      try {
        const categories = await this.getCategoriesByParentId(client, parentId);
        return ResponseService.success(
          categories,
          200,
          undefined,
          ResponseType.API,
        );
      } catch (error) {
        return ResponseService.error(
          "Error fetching venue categories by parent id",
          "FETCH_ERROR",
          400,
          error as Record<string, unknown>,
          ResponseType.API,
        );
      }
    }

    console.log("API: Fetching all venue categories");
    const { data, error } = await client
      .from("venue_categories")
      .select("*")
      .is("deleted_at", null)
      .order("name", { ascending: true });

    if (error) {
      return ResponseService.error(
        "Error fetching venue categories",
        error.code,
        400,
        error,
        ResponseType.API,
      );
    }

    // Add parent_name to each category if parent exists
    const categoriesWithParentNames = [];
    for (const category of data || []) {
      const categoryWithParentName = await this.addParentName(client, category);
      categoriesWithParentNames.push(categoryWithParentName);
    }

    return ResponseService.success(
      categoriesWithParentNames,
      200,
      undefined,
      ResponseType.API,
    );
  }

  override async post(
    data: VenueCategoriesData,
    _req?: Request,
  ): Promise<Response> {
    this.logAction("VenueCategoriesAPI POST", { data });

    // Validate venue category data
    const validation = this.validateVenueCategoriesData(data);
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

    // Check if parent_id exists if provided
    if (data.parent_id) {
      const { data: parentData, error: parentError } = await client
        .from("venue_categories")
        .select("id")
        .eq("id", data.parent_id)
        .is("deleted_at", null)
        .single();

      if (parentError || !parentData) {
        return Promise.resolve(ResponseService.error(
          "Parent category not found",
          "PARENT_NOT_FOUND",
          400,
          { parent_id: data.parent_id },
          ResponseType.API,
        ));
      }
    }

    // Prepare data for insertion (trim strings)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const venueCategoryData: any = {
      name: data.name.trim(),
      parent_id: data.parent_id || null,
    };

    console.log("API: Creating new venue category", venueCategoryData);

    const { data: insertedData, error } = await client
      .from("venue_categories")
      .insert(venueCategoryData)
      .select("*")
      .single();

    if (error) {
      return ResponseService.error(
        "Error creating venue category",
        error.code,
        400,
        error,
        ResponseType.API,
      );
    }

    // Add parent_name to the created category data
    const categoryWithParentName = await this.addParentName(
      client,
      insertedData,
    );

    return ResponseService.created(
      categoryWithParentName,
      insertedData.id,
      ResponseType.API,
    );
  }

  override async put(
    id: string,
    data: Partial<VenueCategoriesData>,
    _req?: Request,
  ): Promise<Response> {
    this.logAction("VenueCategoriesAPI PUT", { id, data });

    // Validate venue category data (only validates present fields)
    const validation = this.validateVenueCategoriesDataForUpdate(data);
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

    // Check if parent_id exists if provided
    if (data.parent_id) {
      // Prevent self-reference
      if (data.parent_id === id) {
        return Promise.resolve(ResponseService.error(
          "Category cannot be its own parent",
          "SELF_REFERENCE",
          400,
          { id, parent_id: data.parent_id },
          ResponseType.API,
        ));
      }

      const { data: parentData, error: parentError } = await client
        .from("venue_categories")
        .select("id")
        .eq("id", data.parent_id)
        .is("deleted_at", null)
        .single();

      if (parentError || !parentData) {
        return Promise.resolve(ResponseService.error(
          "Parent category not found",
          "PARENT_NOT_FOUND",
          400,
          { parent_id: data.parent_id },
          ResponseType.API,
        ));
      }
    }

    // Prepare data for update (only include fields that were sent)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const venueCategoryData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    // Only add name field if it was provided in the request
    if (data.name !== undefined) {
      venueCategoryData.name = data.name.trim();
    }

    // Only add parent_id field if it was provided in the request
    if (data.parent_id !== undefined) {
      venueCategoryData.parent_id = data.parent_id;
    }

    console.log(
      `API: Updating venue category with id: ${id}`,
      venueCategoryData,
    );

    const { data: updatedData, error } = await client
      .from("venue_categories")
      .update(venueCategoryData)
      .eq("id", id)
      .is("deleted_at", null)
      .select("*")
      .single();

    if (error) {
      return ResponseService.error(
        "Error updating venue category",
        error.code,
        400,
        error,
        ResponseType.API,
      );
    }

    // Add parent_name to the updated category data
    const categoryWithParentName = await this.addParentName(
      client,
      updatedData,
    );

    return ResponseService.success(
      categoryWithParentName,
      200,
      undefined,
      ResponseType.API,
    );
  }

  override async delete(id: string, _req?: Request): Promise<Response> {
    this.logAction("VenueCategoriesAPI DELETE", { id });

    const { client } = await AuthenticationService.authenticate(_req!);

    // Check if this category has children
    const { data: children, error: childrenError } = await client
      .from("venue_categories")
      .select("id")
      .eq("parent_id", id)
      .is("deleted_at", null);

    if (childrenError) {
      return ResponseService.error(
        "Error checking for child categories",
        childrenError.code,
        400,
        childrenError,
        ResponseType.API,
      );
    }

    if (children && children.length > 0) {
      return ResponseService.error(
        "Cannot delete category with child categories",
        "HAS_CHILDREN",
        400,
        { id, children_count: children.length },
        ResponseType.API,
      );
    }

    console.log(`API: Soft deleting venue category with id: ${id}`);

    return client
      .from("venue_categories")
      .update({
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .is("deleted_at", null)
      .select()
      .single()
      .then(({ data, error }: any) => {
        if (error) {
          return ResponseService.error(
            "Error deleting venue category",
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
