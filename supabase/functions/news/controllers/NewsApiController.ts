import { ResponseService } from "../../_shared/services/ResponseService.ts";
import { ResponseType } from "../../_shared/services/ErrorsService.ts";
import { Controller } from "../../_shared/controllers/Controller.ts";
import { AuthenticationService } from "../../_shared/services/AuthenticationService.ts";
import { SupabaseClient } from "../../_shared/supabase/supabaseClient.ts";
import { SupabaseAdmin } from "../../_shared/supabase/supabaseAdmin.ts";

// Define news data interface matching the database table
interface NewsData {
  id?: string;
  title: string;
  news_categories_id: string;
  partner_id: string;
  keywords?: string;
  body?: string;
  likes?: number;
  read_count?: number;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string;
  locale_id?: string;
  image_featured_id?: string;
  // Additional fields for file uploads
  image_file?: File | Blob;
  image_base64?: string;
  [key: string]: unknown;
}

// Interface for the enriched response data
interface NewsResponseData extends NewsData {
  news_category_title?: string;
  partner_company_name?: string;
  locale_label?: string;
  image_url?: string;
  image_error?: string;
}

export class NewsApiController extends Controller<NewsData> {

  // Validation method
  private validateNewsData(
    data: NewsData,
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate required fields
    if (!data.title || typeof data.title !== "string" || data.title.trim() === "") {
      errors.push("title is required and must be a non-empty string");
    }

    if (!data.news_categories_id || typeof data.news_categories_id !== "string") {
      errors.push("news_categories_id is required and must be a valid UUID");
    }

    if (!data.partner_id || typeof data.partner_id !== "string") {
      errors.push("partner_id is required and must be a valid UUID");
    }

    // Validate optional string fields
    if (data.keywords !== undefined && typeof data.keywords !== "string") {
      errors.push("keywords must be a string");
    }

    if (data.body !== undefined && typeof data.body !== "string") {
      errors.push("body must be a string");
    }

    // Validate optional UUID fields

    if (data.locale_id !== undefined && data.locale_id !== null && typeof data.locale_id !== "string") {
      errors.push("locale_id must be a valid UUID");
    }

    if (data.image_featured_id !== undefined && data.image_featured_id !== null && typeof data.image_featured_id !== "string") {
      errors.push("image_featured_id must be a valid UUID");
    }

    // Validate optional numeric fields
    if (data.likes !== undefined && data.likes !== null && typeof data.likes !== "number") {
      errors.push("likes must be a number");
    }

    if (data.read_count !== undefined && data.read_count !== null && typeof data.read_count !== "number") {
      errors.push("read_count must be a number");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Validation method for updates (only validates present fields)
  private validateNewsDataForUpdate(
    data: Partial<NewsData>,
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate title if present
    if (data.title !== undefined) {
      if (!data.title || typeof data.title !== "string" || data.title.trim() === "") {
        errors.push("title must be a non-empty string");
      }
    }

    // Validate news_categories_id if present
    if (data.news_categories_id !== undefined) {
      if (!data.news_categories_id || typeof data.news_categories_id !== "string") {
        errors.push("news_categories_id must be a valid UUID");
      }
    }

    // Validate partner_id if present
    if (data.partner_id !== undefined) {
      if (!data.partner_id || typeof data.partner_id !== "string") {
        errors.push("partner_id must be a valid UUID");
      }
    }

    // Validate optional fields if present
    if (data.keywords !== undefined && typeof data.keywords !== "string") {
      errors.push("keywords must be a string");
    }

    if (data.body !== undefined && typeof data.body !== "string") {
      errors.push("body must be a string");
    }

    if (data.locale_id !== undefined && data.locale_id !== null && typeof data.locale_id !== "string") {
      errors.push("locale_id must be a valid UUID");
    }

    if (data.image_featured_id !== undefined && data.image_featured_id !== null && typeof data.image_featured_id !== "string") {
      errors.push("image_featured_id must be a valid UUID");
    }

    if (data.likes !== undefined && data.likes !== null && typeof data.likes !== "number") {
      errors.push("likes must be a number");
    }

    if (data.read_count !== undefined && data.read_count !== null && typeof data.read_count !== "number") {
      errors.push("read_count must be a number");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Helper method to upload image to storage
  private async uploadImage(
    client: SupabaseClient,
    imageData: File | Blob | string,
    fileName: string
  ): Promise<{ path: string; url: string; id?: string } | null> {
    try {
      console.log("uploadImage: Starting upload, fileName:", fileName);
      let fileData: File | Blob;
      
      if (typeof imageData === 'string') {
        // Handle base64 data
        console.log("uploadImage: Processing base64 data");
        const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, '');
        const bytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
        fileData = new Blob([bytes], { type: 'image/jpeg' });
      } else {
        console.log("uploadImage: Processing file/blob data");
        fileData = imageData;
      }

      const uploadFileName = `${Date.now()}-${fileName}`;
      console.log("uploadImage: Uploading with filename:", uploadFileName);

      // Upload to storage
      const { data: uploadData, error: uploadError } = await client.storage
        .from('news-images')
        .upload(uploadFileName, fileData);

      if (uploadError) {
        console.error("Storage upload error:", uploadError);
        return null;
      }

      console.log("uploadImage: Upload successful, data:", uploadData);

      // Get public URL
      const { data: urlData } = client.storage
        .from('news-images')
        .getPublicUrl(uploadData.path);

      console.log("uploadImage: Public URL data:", urlData);

      // The upload response already includes the UUID we need!
      const storageId = (uploadData as any).id;
      console.log("uploadImage: Storage ID from upload response:", storageId);

      const result = {
        path: uploadData.path,
        url: urlData.publicUrl,
        id: storageId
      };

      console.log("uploadImage: Returning result:", result);
      return result;
    } catch (error) {
      console.error("Error uploading image:", error);
      return null;
    }
  }

  // Helper method to build the SELECT query (basic fields only)
  private getSelectQuery(): string {
    return `*`;
  }

  // Helper method to get related data separately
  private async getRelatedData(client: SupabaseClient, newsItem: any): Promise<any> {
    if (!newsItem) {
      return { category: null, partner: null, locale: null, image_featured: null };
    }

    const promises = [];

    // Get category data
    if (newsItem.news_categories_id) {
      promises.push(
        client
          .from('news_categories')
          .select('id, name')
          .eq('id', newsItem.news_categories_id)
          .single()
          .then(({ data, error }) => ({ category: error ? null : data }))
      );
    } else {
      promises.push(Promise.resolve({ category: null }));
    }

    // Get partner data
    if (newsItem.partner_id) {
      promises.push(
        client
          .from('partners')
          .select('id, company_name, business_email')
          .eq('id', newsItem.partner_id)
          .single()
          .then(({ data, error }) => ({ partner: error ? null : data }))
      );
    } else {
      promises.push(Promise.resolve({ partner: null }));
    }

    // Get locale data
    if (newsItem.locale_id) {
      promises.push(
        client
          .from('locale')
          .select('id, code, label')
          .eq('id', newsItem.locale_id)
          .single()
          .then(({ data, error }) => ({ locale: error ? null : data }))
      );
    } else {
      promises.push(Promise.resolve({ locale: null }));
    }

        // Get image data from storage
    if (newsItem.image_featured_id) {
      promises.push(
        (async () => {
          try {
            // Try to access storage.objects table using correct schema
            const adminClient = SupabaseAdmin.initialize();
            const { data, error } = await adminClient
              .schema('storage')
              .from('objects')
              .select('id, name, metadata')
              .eq('id', newsItem.image_featured_id)
              .single();
            
            if (error) {
              console.error("getRelatedData: Error querying storage objects:", error);
              // Try to list files in the bucket to find the one with matching ID
              const { data: files, error: listError } = await adminClient.storage
                .from('news-images')
                .list('', {
                  limit: 1000,
                  offset: 0
                });
              
              if (!listError && files) {
                // Find file where the metadata contains our UUID or the filename contains our UUID
                const matchingFile = files.find(file => {
                  return file.id === newsItem.image_featured_id || 
                         file.name.includes(newsItem.image_featured_id);
                });
                
                if (matchingFile) {
                  return { image_featured: matchingFile };
                }
              }
              
              console.log("getRelatedData: Could not find file for UUID:", newsItem.image_featured_id);
              return { image_featured: null, image_error: "Image file not found" };
            }
            
            return { image_featured: data };
          } catch (err) {
            console.error("getRelatedData: Exception querying storage:", err);
            return { image_featured: null, image_error: err instanceof Error ? err.message : String(err) };
          }
        })()
      );
    } else {
      promises.push(Promise.resolve({ image_featured: null }));
    }

    const results = await Promise.all(promises);
    return Object.assign({}, ...results);
  }

  // Helper method to enrich news data with computed fields
  private async enrichNewsData(client: SupabaseClient, newsItem: any, uploadedImagePath?: string): Promise<NewsResponseData> {
    const enriched: NewsResponseData = { ...newsItem };

    // Get related data
    const relatedData = await this.getRelatedData(client, newsItem);

    // Add news_category_title
    if (relatedData.category?.name) {
      enriched.news_category_title = relatedData.category.name;
    }

    // Add locale_label
    if (relatedData.locale?.label) {
      enriched.locale_label = relatedData.locale.label;
    }

    // Add image_url (construct from storage path)
    if (uploadedImagePath) {
      // For just-uploaded images, use the provided path
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      enriched.image_url = `${supabaseUrl}/storage/v1/object/public/news-images/${uploadedImagePath}`;
    } else if (newsItem.image_featured_id && relatedData.image_featured?.name) {
      // image_featured_id is a UUID, use the name from storage objects table
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      enriched.image_url = `${supabaseUrl}/storage/v1/object/public/news-images/${relatedData.image_featured.name}`;
    } else if (newsItem.image_featured_id && relatedData.image_error) {
      // Add error information if image lookup failed
      enriched.image_error = relatedData.image_error;
    }

    // Add partner_company_name
    if (relatedData.partner?.company_name) {
      enriched.partner_company_name = relatedData.partner.company_name;
    }

    return enriched;
  }

  // Core API methods
  override async get(id?: string, _req?: Request): Promise<Response> {
    this.logAction("NewsAPI GET", { id });

    const { client } = await AuthenticationService.authenticate(_req!);

    // Extract query parameters from the request URL
    let categoryId: string | null = null;
    let searchTerm: string | null = null;
    let limit = 20; // Default limit
    let offset = 0; // Default offset
    let page: number | null = null;

    if (_req) {
      const url = new URL(_req.url);
      categoryId = url.searchParams.get('category_id');
      searchTerm = url.searchParams.get('search');
      
      console.log("DEBUG: Raw URL parameters:", {
        category_id: categoryId,
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
      categoryId,
      searchTerm,
      limit,
      offset,
      page
    });

    if (id) {
      console.log(`API: Fetching news with id: ${id}`);
      return client
        .from("news")
        .select(this.getSelectQuery())
        .eq("id", id)
        .is("deleted_at", null)
        .single()
        .then(async ({ data, error }) => {
          if (error) {
            return ResponseService.error(
              "Error fetching news",
              error.code,
              400,
              error,
              ResponseType.API,
            );
          }

          console.log("Raw single news data from database:", data);

          if (!data) {
            return ResponseService.error(
              "News not found",
              "NOT_FOUND",
              404,
              undefined,
              ResponseType.API,
            );
          }

          const enrichedData = await this.enrichNewsData(client, data);

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
      .from("news")
      .select("*", { count: "exact", head: true })
      .is("deleted_at", null);

    // Build query for fetching multiple news items
    let query = client
      .from("news")
      .select(this.getSelectQuery())
      .is("deleted_at", null);

    // Add category filter if provided
    if (categoryId) {
      console.log("DEBUG: Adding category filter:", categoryId);
      query = query.eq("news_categories_id", categoryId);
      countQuery = countQuery.eq("news_categories_id", categoryId);
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
    if (categoryId) logParams.push(`category_id: ${categoryId}`);
    if (searchTerm) logParams.push(`search: "${searchTerm}"`);
    logParams.push(`limit: ${limit}, offset: ${offset}`);

    if (logParams.length > 0) {
      console.log(`API: Fetching news with ${logParams.join(', ')}`);
    } else {
      console.log(`API: Fetching all news with pagination (limit: ${limit}, offset: ${offset})`);
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
            "Error fetching news",
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
                category_id: categoryId,
                search: searchTerm
              }
            },
            ResponseType.API,
          );
        }

        // Enrich all news items
        const enrichedData = await Promise.all(
          data.map(async (newsItem: any) => {
            console.log("Processing newsItem:", newsItem);
            if (!newsItem) {
              console.log("newsItem is null or undefined");
              return null;
            }
            return await this.enrichNewsData(client, newsItem);
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
              category_id: categoryId,
              search: searchTerm
            }
          },
          ResponseType.API,
        );
      });
  }

  override async post(
    data: NewsData,
    _req?: Request,
  ): Promise<Response> {
    this.logAction("NewsAPI POST", { data });

    // Validate news data
    const validation = this.validateNewsData(data);
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

    // Handle image upload if provided
    let imageStoragePath = null;
    let imageStorageId = null;
    if (data.image_file || data.image_base64) {
      console.log("API: Image upload detected for POST");
      const imageData = data.image_file || data.image_base64!;
      const fileName = data.image_file instanceof File ? data.image_file.name : 'uploaded-image.jpg';
      const uploadResult = await this.uploadImage(client, imageData, fileName);
      
      if (uploadResult) {
        imageStoragePath = uploadResult.path;
        imageStorageId = uploadResult.id;
        console.log("API: Image uploaded successfully, path:", imageStoragePath);
        console.log("API: Image storage ID:", imageStorageId);
      } else {
        console.log("API: Image upload failed");
      }
    }

    // Prepare data for insertion
    const newsData: Partial<NewsData> = {
      title: data.title.trim(),
      news_categories_id: data.news_categories_id,
      partner_id: data.partner_id,
      keywords: data.keywords?.trim() || undefined,
      body: data.body?.trim() || undefined,
      likes: data.likes || 0,
      read_count: data.read_count || 0,
      locale_id: data.locale_id || undefined,
      image_featured_id: imageStorageId || data.image_featured_id || undefined,
    };

    console.log("API: Creating new news", newsData);
    console.log("API: imageStorageId value:", imageStorageId);
    console.log("API: imageStoragePath value:", imageStoragePath);

    return client
      .from("news")
      .insert(newsData)
      .select()
      .single()
      .then(async ({ data, error }) => {
        if (error) {
          return ResponseService.error(
            "Error creating news",
            error.code,
            400,
            error,
            ResponseType.API,
          );
        }

        // Enrich the created data to include image_url and other computed fields
        const enrichedData = await this.enrichNewsData(client, data, imageStoragePath || undefined);

        return ResponseService.created(
          enrichedData,
          data.id,
          ResponseType.API,
        );
      });
  }

  override async put(
    id: string,
    data: Partial<NewsData>,
    _req?: Request,
  ): Promise<Response> {
    this.logAction("NewsAPI PUT", { id, data });

    // Validate news data (only validates present fields)
    const validation = this.validateNewsDataForUpdate(data);
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

    // Handle image upload if provided
    let imageStoragePath = null;
    let imageStorageId = null;
    if (data.image_file || data.image_base64) {
      console.log("API: Image upload detected for PUT");
      const imageData = data.image_file || data.image_base64!;
      const fileName = data.image_file instanceof File ? data.image_file.name : 'uploaded-image.jpg';
      const uploadResult = await this.uploadImage(client, imageData, fileName);
      
      if (uploadResult) {
        imageStoragePath = uploadResult.path;
        imageStorageId = uploadResult.id;
        console.log("API: Image uploaded successfully for PUT, path:", imageStoragePath);
        console.log("API: Image storage ID for PUT:", imageStorageId);
      } else {
        console.log("API: Image upload failed for PUT");
      }
    }

    // Prepare data for update (only include fields that were sent)
    const newsData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    // Only add fields if they were provided in the request
    if (data.title !== undefined) {
      newsData.title = data.title.trim();
    }
    if (data.news_categories_id !== undefined) {
      newsData.news_categories_id = data.news_categories_id;
    }
    if (data.partner_id !== undefined) {
      newsData.partner_id = data.partner_id;
    }
    if (data.keywords !== undefined) {
      newsData.keywords = data.keywords?.trim() || undefined;
    }
    if (data.body !== undefined) {
      newsData.body = data.body?.trim() || undefined;
    }
    if (data.likes !== undefined) {
      newsData.likes = data.likes;
    }
    if (data.read_count !== undefined) {
      newsData.read_count = data.read_count;
    }
    if (data.locale_id !== undefined) {
      newsData.locale_id = data.locale_id;
    }
    if (data.image_featured_id !== undefined) {
      newsData.image_featured_id = data.image_featured_id;
    }

    // If an image was uploaded, store its UUID in image_featured_id
    if (imageStorageId) {
      newsData.image_featured_id = imageStorageId;
    }

    console.log(`API: Updating news with id: ${id}`, newsData);

    return client
      .from("news")
      .update(newsData)
      .eq("id", id)
      .is("deleted_at", null)
      .select()
      .single()
      .then(async ({ data, error }) => {
        if (error) {
          return ResponseService.error(
            "Error updating news",
            error.code,
            400,
            error,
            ResponseType.API,
          );
        }

        // Enrich the updated data to include image_url and other computed fields
        const enrichedData = await this.enrichNewsData(client, data, imageStoragePath || undefined);

        return ResponseService.success(
          enrichedData,
          200,
          undefined,
          ResponseType.API,
        );
      });
  }

  override async delete(id: string, _req?: Request): Promise<Response> {
    this.logAction("NewsAPI DELETE", { id });

    const { client } = await AuthenticationService.authenticate(_req!);

    console.log(`API: Soft deleting news with id: ${id}`);

    return client
      .from("news")
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
            "Error deleting news",
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
