import { ResponseService } from "../../_shared/services/ResponseService.ts";
import { ResponseType } from "../../_shared/services/ErrorsService.ts";
import { Controller } from "../../_shared/controllers/Controller.ts";

// Define resource data interface
interface BlankResourceData {
  requiredField: string;
  [key: string]: unknown;
}

export class NewsWebController extends Controller<BlankResourceData> {
  // Core Web methods
  override get(id?: string, _req?: Request): Promise<Response> {
    this.logAction('NewsCategoriesWeb GET', { id });
    
    if (id) {
      console.log(`Web: Fetching news categories resource with id: ${id}`);
      // Web-specific resource retrieval logic, possibly returning HTML
      return Promise.resolve(ResponseService.success({ 
        id, 
        data: "News Categories Web Resource data", 
        html: "<div>News Categories Resource Details</div>" 
      },
      200,
      undefined,
      ResponseType.WEB
      ));
    }
    
    console.log("Web: Fetching all news categories resources");
    // Web-specific resources retrieval logic
    return Promise.resolve(ResponseService.success({ 
      resources: ["News_Categories_Web_Resource1", "News_Categories_Web_Resource2"], 
      html: "<ul><li>News Categories Resource 1</li><li>News Categories Resource 2</li></ul>" 
    },
    200,
    undefined,
    ResponseType.WEB
    ));
  }
  
  override post(data: BlankResourceData, _req?: Request): Promise<Response> {
    this.logAction('NewsCategoriesWeb POST', { data });
    console.log("Web POST data:", data);
    
    // Validate required fields
    if (!data.requiredField) {
      console.log("Missing required field in data:", data);
      return Promise.resolve(ResponseService.error(
        "Missing required field",
        "MISSING_FIELD",
        400,
        { field: "requiredField" },
        ResponseType.WEB
      ));
    }
    
    console.log("Web: Creating new blank resource", data);
    // Web-specific resource creation logic
    return Promise.resolve(ResponseService.created(
      { ...data, redirect: "/news_categories" },
      "new-news-categories-web-id",
      ResponseType.WEB
    ));
  }
  
  override put(id: string, data: BlankResourceData, _req?: Request): Promise<Response> {
    this.logAction('NewsCategoriesWeb PUT', { id, data });
    
    console.log(`Web: Updating blank resource with id: ${id}`);
    // Web-specific resource update logic
    return Promise.resolve(ResponseService.success({ 
      ...data, 
      id, 
      updated: true,
      redirect: `/news_categories/${id}`
    },
    200,
    undefined,
    ResponseType.WEB
    ));
  }
  
  override delete(id: string, _req?: Request): Promise<Response> {
    this.logAction('NewsCategoriesWeb DELETE', { id });
    
    console.log(`Web: Deleting news categories resource with id: ${id}`);
    // Web-specific resource deletion logic
    return Promise.resolve(ResponseService.success({ 
      deleted: true, 
      id, 
      redirect: "/news_categories",
      message: "News categories resource deleted successfully"
    },
    200,
    undefined,
    ResponseType.WEB
    ));
  }
}