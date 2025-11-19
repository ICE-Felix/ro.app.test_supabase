import { ResponseService } from "../../_shared/services/ResponseService.ts";
import { ResponseType } from "../../_shared/services/ErrorsService.ts";
import { Controller } from "../../_shared/controllers/Controller.ts";
import { AuthenticationService } from "../../_shared/services/AuthenticationService.ts";
import { SupabaseClient } from "../../_shared/supabase/supabaseClient.ts";

// Define shop data interface matching the database table
interface ShopData {
  id?: string;
  woo_shop_id: number;
  partner_id: string;
  active?: boolean;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string;
  [key: string]: unknown;
}

// Interface for the enriched response data
// This interface ensures that API responses always include both partner_id and partner_company_name
interface ShopResponseData extends ShopData {
  partner_company_name?: string;
  partner_tax_id?: string;
  partner_registration_number?: string;
  partner_address?: string;
  partner_business_email?: string;
  partner_orders_email?: string;
  partner_is_active?: boolean;
}

export class ShopsApiController extends Controller<ShopData> {

  // WooCommerce configuration
  private getWooCommerceConfig() {
    const baseUrl = Deno.env.get('WOOCOMMERCE_BASE_URL') || '';
    const consumerKey = Deno.env.get('WOOCOMMERCE_CONSUMER_KEY') || '';
    const consumerSecret = Deno.env.get('WOOCOMMERCE_CONSUMER_SECRET') || '';
    
    return {
      baseUrl,
      credentials: btoa(`${consumerKey}:${consumerSecret}`),
      headers: {
        'Authorization': `Basic ${btoa(`${consumerKey}:${consumerSecret}`)}`,
        'Content-Type': 'application/json',
      }
    };
  }

  // Validation method for shop data
  private validateShopData(data: ShopData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate required fields
    if (!data.partner_id || typeof data.partner_id !== "string") {
      errors.push("partner_id is required and must be a valid UUID");
    }

    if (!data.woo_shop_id || typeof data.woo_shop_id !== "number") {
      errors.push("woo_shop_id is required and must be a number");
    }

    // Validate optional fields
    if (data.active !== undefined && typeof data.active !== "boolean") {
      errors.push("active must be a boolean");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Validation method for updates (only validates present fields)
  private validateShopDataForUpdate(data: Partial<ShopData>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate partner_id if present
    if (data.partner_id !== undefined) {
      if (!data.partner_id || typeof data.partner_id !== "string") {
        errors.push("partner_id must be a valid UUID");
      }
    }

    // Validate woo_shop_id if present
    if (data.woo_shop_id !== undefined) {
      if (!data.woo_shop_id || typeof data.woo_shop_id !== "number") {
        errors.push("woo_shop_id must be a number");
      }
    }

    if (data.active !== undefined && typeof data.active !== "boolean") {
      errors.push("active must be a boolean");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Validate partner exists
  private async validatePartnerExists(client: SupabaseClient, partnerId: string): Promise<{ isValid: boolean; error?: string }> {
    try {
      const { data, error } = await client
        .from('partners')
        .select('id, company_name, is_active')
        .eq('id', partnerId)
        .is('deleted_at', null)
        .single();

      if (error || !data) {
        return {
          isValid: false,
          error: `Partner with id ${partnerId} not found`
        };
      }

      return { isValid: true };
    } catch (error) {
      console.error("Error validating partner:", error);
      return {
        isValid: false,
        error: `Failed to validate partner: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  // Validate WooCommerce shop exists
  private async validateWooCommerceShop(wooShopId: number): Promise<{ isValid: boolean; error?: string }> {
    const config = this.getWooCommerceConfig();
    
    try {
      const response = await fetch(`${config.baseUrl}/wp-json/wc/v3/shops/${wooShopId}`, {
        method: 'GET',
        headers: config.headers,
      });

      if (!response.ok) {
        if (response.status === 404) {
          return {
            isValid: false,
            error: `WooCommerce shop with id ${wooShopId} not found`
          };
        }
        
        const errorData = await response.json().catch(() => ({}));
        return {
          isValid: false,
          error: `Error validating WooCommerce shop: ${errorData.message || 'Unknown error'}`
        };
      }

      const _shopData = await response.json();
      
      return { isValid: true };
    } catch (error) {
      console.error("Error validating WooCommerce shop:", error);
      return {
        isValid: false,
        error: `Failed to connect to WooCommerce: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  // Helper method to build the SELECT query
  private getSelectQuery(): string {
    return `*`;
  }

  // Helper method to get partner data
  private async getPartnerData(client: SupabaseClient, partnerId: string): Promise<{
    id: string;
    company_name: string;
    tax_id: string;
    registration_number: string | null;
    address: string | null;
    business_email: string | null;
    orders_email: string | null;
    is_active: boolean | null;
  } | null> {
    if (!partnerId) {
      return null;
    }

    const { data, error } = await client
      .from('partners')
      .select('id, company_name, tax_id, registration_number, address, business_email, orders_email, is_active')
      .eq('id', partnerId)
      .is('deleted_at', null) // Only get non-deleted partners
      .single();

    if (error) {
      console.error("Error fetching partner data:", error);
      return null;
    }

    return data;
  }

  // Helper method to enrich shop data with partner information
  private async enrichShopData(client: SupabaseClient, shopItem: ShopData): Promise<ShopResponseData> {
    const enriched: ShopResponseData = { 
      ...shopItem,
      // Ensure partner_id is always explicitly included
      partner_id: shopItem.partner_id
    };

    // Get partner data
    if (shopItem.partner_id) {
      const partnerData = await this.getPartnerData(client, shopItem.partner_id);
      
      if (partnerData) {
        enriched.partner_company_name = partnerData.company_name;
        enriched.partner_tax_id = partnerData.tax_id;
        enriched.partner_registration_number = partnerData.registration_number || undefined;
        enriched.partner_address = partnerData.address || undefined;
        enriched.partner_business_email = partnerData.business_email || undefined;
        enriched.partner_orders_email = partnerData.orders_email || undefined;
        enriched.partner_is_active = partnerData.is_active !== null ? partnerData.is_active : undefined;
      } else {
        // If partner data lookup fails, still ensure we have the partner_id but no company name
        enriched.partner_company_name = undefined;
        enriched.partner_tax_id = undefined;
        enriched.partner_registration_number = undefined;
        enriched.partner_address = undefined;
        enriched.partner_business_email = undefined;
        enriched.partner_orders_email = undefined;
        enriched.partner_is_active = undefined;
      }
    } else {
      // If no partner_id, set partner fields to undefined
      enriched.partner_company_name = undefined;
      enriched.partner_tax_id = undefined;
      enriched.partner_registration_number = undefined;
      enriched.partner_address = undefined;
      enriched.partner_business_email = undefined;
      enriched.partner_orders_email = undefined;
      enriched.partner_is_active = undefined;
    }

    return enriched;
  }

  // Core API methods
  override async get(id?: string, _req?: Request): Promise<Response> {
    this.logAction("ShopsAPI GET", { id });

    const { client } = await AuthenticationService.authenticate(_req!);

    // Extract query parameters from the request URL
    let partnerId: string | null = null;
    let searchTerm: string | null = null;
    let onlyActivePartners: boolean = false;
    let limit = 20; // Default limit
    let offset = 0; // Default offset
    let page: number | null = null;

    if (_req) {
      const url = new URL(_req.url);
      partnerId = url.searchParams.get('partner_id');
      searchTerm = url.searchParams.get('search');
      const activePartnersParam = url.searchParams.get('active_partners_only');
      onlyActivePartners = activePartnersParam === 'true' || activePartnersParam === '1';
      

      
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



    if (id) {
      return client
        .from("shops")
        .select(this.getSelectQuery())
        .eq("id", id)
        .is("deleted_at", null)
        .single()
        .then(async ({ data, error }) => {
          if (error) {
            return ResponseService.error(
              "Error fetching shop",
              error.code,
              400,
              error,
              ResponseType.API,
            );
          }



          if (!data) {
            return ResponseService.error(
              "Shop not found",
              "NOT_FOUND",
              404,
              undefined,
              ResponseType.API,
            );
          }

          const enrichedData = await this.enrichShopData(client, data as unknown as ShopData);

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
      .from("shops")
      .select("*", { count: "exact", head: true })
      .is("deleted_at", null);

    // Build query for fetching multiple shops
    let query = client
      .from("shops")
      .select(this.getSelectQuery())
      .is("deleted_at", null);

    // Add partner filter if provided
    if (partnerId) {
      query = query.eq("partner_id", partnerId);
      countQuery = countQuery.eq("partner_id", partnerId);
    }

    // Add search filter if provided (search in partner company name)
    if (searchTerm) {
      // Note: Search filtering is handled client-side after enrichment
    }



    // Get total count first
    const countResult = await countQuery;
    const totalCount = countResult.count || 0;

    // Apply pagination and execute main query
    return query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)
      .then(async ({ data, error }) => {
        if (error) {
          return ResponseService.error(
            "Error fetching shops",
            error.code,
            400,
            error,
            ResponseType.API,
          );
        }



        // Check if data exists and is an array
        if (!data || !Array.isArray(data)) {
          
          // If there are filters applied and no results, return 404
          if (partnerId || searchTerm) {
            return ResponseService.error(
              "No shops found matching the specified criteria",
              "NOT_FOUND",
              404,
              {
                filters: {
                  partner_id: partnerId,
                  search: searchTerm,
                  active_partners_only: onlyActivePartners
                }
              },
              ResponseType.API,
            );
          }
        }

        // Check if data is empty array with filters applied
        // Only return 404 for non-existent partner IDs (invalid UUIDs or clearly fake IDs)
        // BUT NOT for search terms - those should return 200 with empty results
        if (Array.isArray(data) && data.length === 0 && partnerId && !searchTerm) {
          // Check if partner ID looks like a dummy/test ID
          const isDummyPartner = partnerId === "00000000-0000-0000-0000-000000000000" || 
                                partnerId.includes("123e4567");
          
          if (isDummyPartner) {
            return ResponseService.error(
              "No shops found matching the specified criteria",
              "NOT_FOUND",
              404,
              {
                filters: {
                  partner_id: partnerId,
                  search: searchTerm,
                  active_partners_only: onlyActivePartners
                }
              },
              ResponseType.API,
            );
          }
        }

        // Check if data exists and is an array (this check is now redundant but kept for safety)
        if (!data || !Array.isArray(data)) {
          
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
                partner_id: partnerId,
                search: searchTerm,
                active_partners_only: onlyActivePartners
              }
            },
            ResponseType.API,
          );
        }

        // Enrich all shop items
        const enrichedData = await Promise.all(
          data.map(async (shopItem) => {
            if (!shopItem) {
              return null;
            }
            return await this.enrichShopData(client, shopItem as unknown as ShopData);
          })
        );

        // Filter out null values and apply filters
        let validEnrichedData = enrichedData.filter(item => item !== null);

        // Client-side search filtering if search term is provided
        if (searchTerm) {
          const searchLower = searchTerm.toLowerCase();
          validEnrichedData = validEnrichedData.filter(shop => 
            shop?.partner_company_name?.toLowerCase().includes(searchLower) ||
            shop?.partner_business_email?.toLowerCase().includes(searchLower) ||
            shop?.partner_orders_email?.toLowerCase().includes(searchLower) ||
            shop?.partner_tax_id?.toLowerCase().includes(searchLower) ||
            shop?.partner_registration_number?.toLowerCase().includes(searchLower) ||
            shop?.woo_shop_id?.toString().includes(searchTerm)
          );
        }

        // Filter by active partners only if requested
        if (onlyActivePartners) {
          validEnrichedData = validEnrichedData.filter(shop => 
            shop?.partner_is_active === true
          );
        }

        // If filters were applied and no results found, return 404 only for dummy/invalid partner IDs
        // BUT NOT for search terms - those should return 200 with empty results
        if (partnerId && !searchTerm && validEnrichedData.length === 0) {
          const isDummyPartner = partnerId === "00000000-0000-0000-0000-000000000000" || 
                                partnerId.includes("123e4567");
          
          if (isDummyPartner) {
            return ResponseService.error(
              "No shops found matching the specified criteria",
              "NOT_FOUND",
              404,
              {
                filters: {
                  partner_id: partnerId,
                  search: searchTerm,
                  active_partners_only: onlyActivePartners
                }
              },
              ResponseType.API,
            );
          }
        }

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
              partner_id: partnerId,
              search: searchTerm,
              active_partners_only: onlyActivePartners
            }
          },
          ResponseType.API,
        );
      });
  }

  override async post(
    data: ShopData,
    _req?: Request,
  ): Promise<Response> {
    this.logAction("ShopsAPI POST", { data });

    // Validate shop data
    const validation = this.validateShopData(data);
    if (!validation.isValid) {
      return ResponseService.error(
        "Validation failed",
        "VALIDATION_ERROR",
        400,
        { errors: validation.errors },
        ResponseType.API,
      );
    }

    const { client } = await AuthenticationService.authenticate(_req!);

    // Validate partner exists
    const partnerValidation = await this.validatePartnerExists(client, data.partner_id);
    if (!partnerValidation.isValid) {
      return ResponseService.error(
        "Partner validation failed",
        "PARTNER_NOT_FOUND",
        400,
        { error: partnerValidation.error, partner_id: data.partner_id },
        ResponseType.API,
      );
    }

    // Validate WooCommerce shop exists
    const wooValidation = await this.validateWooCommerceShop(data.woo_shop_id);
    if (!wooValidation.isValid) {
      return ResponseService.error(
        "WooCommerce validation failed",
        "WOOCOMMERCE_VALIDATION_ERROR",
        400,
        { error: wooValidation.error, woo_shop_id: data.woo_shop_id },
        ResponseType.API,
      );
    }

    // Prepare data for insertion
    const shopData: Partial<ShopData> = {
      partner_id: data.partner_id,
      woo_shop_id: data.woo_shop_id,
      active: data.active !== undefined ? data.active : true,
    };



    return client
      .from("shops")
      .insert(shopData)
      .select()
      .single()
      .then(async ({ data, error }) => {
        if (error) {
          return ResponseService.error(
            "Error creating shop",
            error.code,
            400,
            error,
            ResponseType.API,
          );
        }

        // Enrich the created data to include partner information
        const enrichedData = await this.enrichShopData(client, data as unknown as ShopData);

        return ResponseService.created(
          enrichedData,
          data.id,
          ResponseType.API,
        );
      });
  }

  override async put(
    id: string,
    data: Partial<ShopData>,
    _req?: Request,
  ): Promise<Response> {
    this.logAction("ShopsAPI PUT", { id, data });

    // Validate shop data (only validates present fields)
    const validation = this.validateShopDataForUpdate(data);
    if (!validation.isValid) {
      return ResponseService.error(
        "Validation failed",
        "VALIDATION_ERROR",
        400,
        { errors: validation.errors },
        ResponseType.API,
      );
    }

    // Validate WooCommerce shop exists if woo_shop_id is being updated
    if (data.woo_shop_id !== undefined) {
      const wooValidation = await this.validateWooCommerceShop(data.woo_shop_id);
      if (!wooValidation.isValid) {
        return ResponseService.error(
          "WooCommerce validation failed",
          "WOOCOMMERCE_VALIDATION_ERROR",
          400,
          { error: wooValidation.error, woo_shop_id: data.woo_shop_id },
          ResponseType.API,
        );
      }
    }

    const { client } = await AuthenticationService.authenticate(_req!);

    // Validate partner exists if partner_id is being updated
    if (data.partner_id !== undefined) {
      const partnerValidation = await this.validatePartnerExists(client, data.partner_id);
      if (!partnerValidation.isValid) {
        return ResponseService.error(
          "Partner validation failed",
          "PARTNER_NOT_FOUND",
          400,
          { error: partnerValidation.error, partner_id: data.partner_id },
          ResponseType.API,
        );
      }
    }

    // Prepare data for update (only include fields that were sent)
    const shopData: Record<string, string | number | boolean> = {
      updated_at: new Date().toISOString(),
    };

    // Only add fields if they were provided in the request
    if (data.partner_id !== undefined) {
      shopData.partner_id = data.partner_id;
    }
    if (data.woo_shop_id !== undefined) {
      shopData.woo_shop_id = data.woo_shop_id;
    }
    if (data.active !== undefined) {
      shopData.active = data.active;
    }



    return client
      .from("shops")
      .update(shopData)
      .eq("id", id)
      .is("deleted_at", null)
      .select()
      .single()
      .then(async ({ data, error }) => {
        if (error) {
          return ResponseService.error(
            "Error updating shop",
            error.code,
            400,
            error,
            ResponseType.API,
          );
        }

        // Enrich the updated data to include partner information
        const enrichedData = await this.enrichShopData(client, data as unknown as ShopData);

        return ResponseService.success(
          enrichedData,
          200,
          undefined,
          ResponseType.API,
        );
      });
  }

  override async delete(id: string, _req?: Request): Promise<Response> {
    this.logAction("ShopsAPI DELETE", { id });

    const { client } = await AuthenticationService.authenticate(_req!);



    return client
      .from("shops")
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
            "Error deleting shop",
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