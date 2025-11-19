import { ResponseService } from "../../_shared/services/ResponseService.ts";
import { ResponseType } from "../../_shared/services/ErrorsService.ts";
import { Controller } from "../../_shared/controllers/Controller.ts";
import { AuthenticationService } from "../../_shared/services/AuthenticationService.ts";
import { SupabaseClient } from "../../_shared/supabase/supabaseClient.ts";
import { SupabaseAdmin } from "../../_shared/supabase/supabaseAdmin.ts";


// Define resource data interface
interface ContractsData {
  number: string;
  type_id: string;
  partner_id: string;
  comment: string;
  file_url?: string;
  is_active?: boolean;
  [key: string]: unknown;
}

// Interface for the enriched response data
interface ContractsResponseData extends ContractsData {
  contract_type_name?: string;
  partner_name?: string;
}

export class ContractsApiController extends Controller<ContractsData> {

  // UUID validation helper
  private isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  // Validation method
  private validateContractsData(data: ContractsData,): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate required fields
    if (
      !data.number || typeof data.number !== "string" ||
      data.number.trim() === ""
    ) {
      errors.push("number is required and must be a non-empty string");
    }

     // Validate type_id if provided
     if (
      data.type_id && typeof data.type_id === "string"
    ) {
      if (!this.isValidUUID(data.type_id)) {
        errors.push("type_id must be a valid UUID");
      }
    }

    // Validate partner_id if provided
    if (
      data.partner_id && typeof data.partner_id === "string"
    ) {
      if (!this.isValidUUID(data.partner_id)) {
        errors.push("partner_id must be a valid UUID");
      }
    }

    //Validate is_active if provided - accept boolean or string "1"/"0"
    if (data.is_active !== undefined) {
      if (typeof data.is_active !== "boolean" && 
          typeof data.is_active !== "string" && 
          typeof data.is_active !== "number") {
        errors.push("is_active must be a boolean, string ('1'/'0'), or number (1/0)");
      } else if (typeof data.is_active === "string" && 
                 data.is_active !== "1" && 
                 data.is_active !== "0") {
        errors.push("is_active string value must be '1' or '0'");
      } else if (typeof data.is_active === "number" && 
                 data.is_active !== 1 && 
                 data.is_active !== 0) {
        errors.push("is_active number value must be 1 or 0");
      }
    }

    // Validate file_url if provided
    if (data.file_url && typeof data.file_url !== "string") {
      errors.push("file_url must be a string if provided");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Validation method for partial updates
  private validateContractsDataForUpdate(data: Partial<ContractsData>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (data.number !== undefined) {
      if (!data.number || typeof data.number !== "string" || data.number.trim() === "") {
        errors.push("number must be a non-empty string if provided");
      }
    }

    if (data.type_id !== undefined) {
      if (!data.type_id || typeof data.type_id !== "string" || data.type_id.trim() === "") {
        errors.push("type_id must be a non-empty string if provided");
      }
    }

    if (data.partner_id !== undefined) {
      if (!data.partner_id || typeof data.partner_id !== "string" || data.partner_id.trim() === "") {
        errors.push("partner_id must be a non-empty string if provided");
      }
    }

    //Validate is_active if provided - accept boolean or string "1"/"0"
    if (data.is_active !== undefined) {
      if (typeof data.is_active !== "boolean" && 
          typeof data.is_active !== "string" && 
          typeof data.is_active !== "number") {
        errors.push("is_active must be a boolean, string ('1'/'0'), or number (1/0)");
      } else if (typeof data.is_active === "string" && 
                data.is_active !== "1" && 
                data.is_active !== "0") {
        errors.push("is_active string value must be '1' or '0'");
      } else if (typeof data.is_active === "number" && 
                data.is_active !== 1 && 
                data.is_active !== 0) {
        errors.push("is_active number value must be 1 or 0");
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
  // Helper method to get related data separately
  private async getRelatedData(client: SupabaseClient, contractItem: any): Promise<any> {
    if (!contractItem) {
      return { contract_type: null, partner: null };
    }

    const promises = [];

    // Get contract_type data
    if (contractItem.type_id) {
      promises.push(
        client
          .from('contract_types')
          .select('id, name')
          .eq('id', contractItem.type_id)
          .single()
          .then(({ data, error }) => ({ contract_type: error ? null : data }))
      );
    } else {
      promises.push(Promise.resolve({ contract_type: null }));
    }

    // Get partner data
    if (contractItem.partner_id) {
      promises.push(
        client
          .from('partners')
          .select('id, company_name, business_email')
          .eq('id', contractItem.partner_id)
          .single()
          .then(({ data, error }) => ({ partner: error ? null : data }))
      );
    } else {
      promises.push(Promise.resolve({ partner: null }));
    }

    const results = await Promise.all(promises);
    return Object.assign({}, ...results);
  }

  // Helper method to enrich contract data with computed fields
  private async enrichContractsData(client: SupabaseClient, contractItem: any): Promise<ContractsResponseData> {
    const enriched: ContractsResponseData = { ...contractItem };

    // Get related data
    const relatedData = await this.getRelatedData(client, contractItem);

    // Add contract_type_name
    if (relatedData.contract_type?.name) {
      enriched.contract_type_name = relatedData.contract_type.name;
    }

    // Add partner_name
    if (relatedData.partner?.company_name) {
      enriched.partner_name = relatedData.partner.company_name;
    }

    return enriched;
  }
    // Core API methods
  override async get(id?: string, _req?: Request): Promise<Response> {
    this.logAction("NewsAPI GET", { id });

    const { client } = await AuthenticationService.authenticate(_req!);

    // Extract query parameters from the request URL
    let contractTypeId: string | null = null;
    let searchTerm: string | null = null;
    let limit = 20; // Default limit
    let offset = 0; // Default offset
    let page: number | null = null;

    if (_req) {
      const url = new URL(_req.url);
      contractTypeId = url.searchParams.get('contract_type_id');
      searchTerm = url.searchParams.get('search');
      
      console.log("DEBUG: Raw URL parameters:", {
        contract_type_id: contractTypeId,
        search: searchTerm,
        limit: url.searchParams.get('limit'),
        offset: url.searchParams.get('offset'),
        page: url.searchParams.get('page'),
        fullUrl: _req.url
      });
      
      // Parse pagination parameters
      const limitParam = url.searchParams.get('limit');
      const offsetParam = url.searchParams.get('offset');
      const pageParam = url.searchParams.get('page');

      if (limitParam) {
        const parsedLimit = parseInt(limitParam, 10);
        if (!isNaN(parsedLimit) && parsedLimit > 0 && parsedLimit <= 100) {
          limit = parsedLimit;
        }
      }

      if (offsetParam) {
        const parsedOffset = parseInt(offsetParam, 10);
        if (!isNaN(parsedOffset) && parsedOffset >= 0) {
          offset = parsedOffset;
        }
      }

      if (pageParam) {
        const parsedPage = parseInt(pageParam, 10);
        if (!isNaN(parsedPage) && parsedPage >= 1) {
          page = parsedPage;
          offset = (page - 1) * limit;
        }
      }

      // Clean and validate search term
      if (searchTerm) {
        searchTerm = searchTerm.trim();
        if (searchTerm.length === 0) {
          searchTerm = null;
        }
      }
    }

    console.log("DEBUG: Processed parameters:", {
      contractTypeId,
      searchTerm,
      limit,
      offset,
      page
    });

    if (id) {
      console.log(`API: Fetching contract with id: ${id}`);
      return client
        .from("contracts")
        .select("*")
        .eq("id", id)
        .is("deleted_at", null)
        .single()
        .then(async ({ data, error }) => {
          if (error) {
            return ResponseService.error(
              "Error fetching contract",
              error.code,
              400,
              error,
              ResponseType.API,
            );
          }

          console.log("Raw single contract data from database:", data);

          if (!data) {
            return ResponseService.error(
              "Contract not found",
              "NOT_FOUND",
              404,
              undefined,
              ResponseType.API,
            );
          }

          const enrichedData = await this.enrichContractsData(client, data);

          return ResponseService.success(
            enrichedData,
            200,
            undefined,
            ResponseType.API,
          );
        });
    }

    // Build base query for counting total items
    let countQuery = client
      .from("contracts")
      .select("*", { count: "exact", head: true })
      .is("deleted_at", null);

    // Build query for fetching multiple news items
    let query = client
      .from("contracts")
      .select("*")
      .is("deleted_at", null);

    // Add category filter if provided
    if (contractTypeId) {
      console.log("DEBUG: Adding contract_type_id filter:", contractTypeId);
      query = query.eq("contract_type_id", contractTypeId);
      countQuery = countQuery.eq("contract_type_id", contractTypeId);
    }

    // Add search filter if provided
    if (searchTerm) {
      console.log("DEBUG: Adding search filter:", searchTerm);
      
      // Simple approach: Search in title field first, then extend if needed
      const searchPattern = `%${searchTerm}%`;
      console.log("DEBUG: Search pattern:", searchPattern);
      
      // Method 1: Try PostgreSQL text search syntax
      try {
        // Using proper PostgREST syntax for OR conditions
        query = query.or(`title.ilike.${searchPattern},keywords.ilike.${searchPattern},body.ilike.${searchPattern}`);
        countQuery = countQuery.or(`title.ilike.${searchPattern},keywords.ilike.${searchPattern},body.ilike.${searchPattern}`);
        console.log("DEBUG: PostgREST OR search applied");
      } catch (error) {
        console.error("DEBUG: PostgREST OR failed, trying simple title search:", error);
        
        // Fallback: Simple title search
        query = query.ilike("title", searchPattern);
        countQuery = countQuery.ilike("title", searchPattern);
        console.log("DEBUG: Fallback to simple title search");
      }
    }

    // Log the current operation
    const logParams = [];
    if (contractTypeId) logParams.push(`contract_type_id: ${contractTypeId}`);
    if (searchTerm) logParams.push(`search: "${searchTerm}"`);
    logParams.push(`limit: ${limit}, offset: ${offset}`);

    if (logParams.length > 0) {
      console.log(`API: Fetching contracts with ${logParams.join(', ')}`);
    } else {
      console.log(`API: Fetching all contracts with pagination (limit: ${limit}, offset: ${offset})`);
    }

    // Get total count first
    console.log("DEBUG: Executing count query...");
    const countResult = await countQuery;
    console.log("DEBUG: Count query result:", countResult);
    const totalCount = countResult.count || 0;

    // Apply pagination and execute main query
    console.log("DEBUG: Executing main query with range:", { offset, end: offset + limit - 1 });
    return query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)
      .then(async ({ data, error }) => {
        if (error) {
          console.log("DEBUG: Query error:", error);
          return ResponseService.error(
            "Error fetching contracts",
            error.code,
            400,
            error,
            ResponseType.API,
          );
        }

        console.log("DEBUG: Raw data from database:", data);
        console.log("DEBUG: Data length:", data?.length);

        // Check if data exists and is an array
        if (!data || !Array.isArray(data)) {
          console.log("No data returned or data is not an array");
          return ResponseService.success(
            [],
            200,
            {
              pagination: {
                total: totalCount,
                limit: limit,
                offset: offset,
                page: page || Math.floor(offset / limit) + 1,
                totalPages: Math.ceil(totalCount / limit),
                hasNext: offset + limit < totalCount,
                hasPrevious: offset > 0
              },
              filters: {
                contract_type_id: contractTypeId,
                search: searchTerm
              }
            },
            ResponseType.API,
          );
        }

        // Enrich all news items
        const enrichedData = await Promise.all(
          data.map(async (contractItem: any) => {
            console.log("Processing contractItem:", contractItem);
            if (!contractItem) {
              console.log("contractItem is null or undefined");
              return null;
            }
            return await this.enrichContractsData(client, contractItem);
          })
        );

        // Filter out null values
        const validEnrichedData = enrichedData.filter(item => item !== null);

        // Return data with pagination metadata
        return ResponseService.success(
          validEnrichedData,
          200,
          {
            pagination: {
              total: totalCount,
              limit: limit,
              offset: offset,
              page: page || Math.floor(offset / limit) + 1,
              totalPages: Math.ceil(totalCount / limit),
              hasNext: offset + limit < totalCount,
              hasPrevious: offset > 0
            },
            filters: {
              contract_type_id: contractTypeId,
              search: searchTerm
            }
          },
          ResponseType.API,
        );
      });
  }
  
  // Core API methods
  override async post(
    data: ContractsData,
    _req?: Request,
  ): Promise<Response> {
    this.logAction("ContractsAPI POST", { data });

    // Validate contract data
    const validation = this.validateContractsData(data);
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
    const contractsData = {
      number: data.number.trim(),
      comment: data.comment.trim(),
      file_url: data.file_url?.trim(),
      is_active: data.is_active,
      type_id: data.type_id,
      partner_id: data.partner_id,
    };

    console.log("API: Creating new contract", contractsData);

    return client
      .from("contracts")
      .insert(contractsData)
      .select()
      .single()
      .then(async ({ data, error }) => {
        if (error) {
          return ResponseService.error(
            "Error creating contract",
            error.code,
            400,
            error,
            ResponseType.API,   
          );
        }

        // Enrich the created data to include contract_type_name and partner_name
        const enrichedData = await this.enrichContractsData(client, data);

        return ResponseService.created(
          enrichedData,
          data.id,
          ResponseType.API,
        );
      });
  }

  override async put(
    id: string,
    data: Partial<ContractsData>,
    _req?: Request,
  ): Promise<Response> {
    this.logAction("ContractsAPI PUT", { id, data });

    // Validate venue general attribute data (only validates present fields)
    const validation = this.validateContractsDataForUpdate(data);
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
    const contractsData: Partial<ContractsData> = {
      updated_at: new Date().toISOString(),
    };

    // Only add name field if it was provided in the request
    if (data.number !== undefined) {
        contractsData.number = data.number.trim();
    }

    if (data.type_id !== undefined) {
      contractsData.type_id = data.type_id;
    }

    if (data.partner_id !== undefined) {
      contractsData.partner_id = data.partner_id;
    }

    console.log(`API: Updating contract with id: ${id}`, contractsData);

    return client
      .from("contracts")
      .update(contractsData)
      .eq("id", id)
      .is("deleted_at", null)
      .select()
      .single()
      .then(async ({ data, error }) => {
        if (error) {
          return ResponseService.error(
            "Error updating contract",
            error.code,
            400,
            error,
            ResponseType.API,
          );
        }

        // Enrich the updated data to include contract_type_name and partner_name
        const enrichedData = await this.enrichContractsData(client, data);

        return ResponseService.success(
          enrichedData,
          200,
          undefined,
          ResponseType.API,
        );
      });
  }

  override async delete(id: string, _req?: Request): Promise<Response> {
    this.logAction("ContractsAPI DELETE", { id });

    const { client } = await AuthenticationService.authenticate(_req!);

    console.log(`API: Soft deleting contract with id: ${id}`);

    return client
      .from("contracts")
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
            "Error deleting contract",
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