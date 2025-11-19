import { ResponseService } from "../../_shared/services/ResponseService.ts";
import { ResponseType } from "../../_shared/services/ErrorsService.ts";
import { Controller } from "../../_shared/controllers/Controller.ts";

// Define shop data interface for web controller
interface ShopWebData {
  name: string;
  identification_number?: string;
  phone?: string;
  email?: string;
  address?: string;
  [key: string]: unknown;
}

export class ShopsWebController extends Controller<ShopWebData> {
  // Core Web methods
  override get(id?: string, _req?: Request): Promise<Response> {
    this.logAction('ShopsWeb GET', { id });
    
    if (id) {
      console.log(`Web: Fetching shop resource with id: ${id}`);
      // Web-specific resource retrieval logic, possibly returning HTML
      return Promise.resolve(ResponseService.success({ 
        id, 
        data: "Shop Web Resource data", 
        html: `<div class="shop-details">
          <h2>Shop Details</h2>
          <p>Shop ID: ${id}</p>
          <p>Loading shop information...</p>
        </div>` 
      },
      200,
      undefined,
      ResponseType.WEB
      ));
    }
    
    console.log("Web: Fetching all shop resources");
    // Web-specific resources retrieval logic
    return Promise.resolve(ResponseService.success({ 
      resources: ["Shop_Web_Resource1", "Shop_Web_Resource2"], 
      html: `<div class="shops-list">
        <h2>Shops Management</h2>
        <ul>
          <li><a href="/shops/1">Electronics Store</a></li>
          <li><a href="/shops/2">Fashion Boutique</a></li>
        </ul>
        <a href="/shops/new" class="btn btn-primary">Add New Shop</a>
      </div>` 
    },
    200,
    undefined,
    ResponseType.WEB
    ));
  }
  
  override post(data: ShopWebData, _req?: Request): Promise<Response> {
    this.logAction('ShopsWeb POST', { data });
    console.log("Web POST data:", data);
    
    // Validate required fields
    if (!data.name || data.name.trim() === "") {
      console.log("Missing required name field in data:", data);
      return Promise.resolve(ResponseService.error(
        "Shop name is required",
        "MISSING_FIELD",
        400,
        { field: "name" },
        ResponseType.WEB
      ));
    }
    
    console.log("Web: Creating new shop resource", data);
    // Web-specific resource creation logic
    return Promise.resolve(ResponseService.created(
      { 
        ...data, 
        redirect: "/shops",
        message: "Shop created successfully",
        html: `<div class="alert alert-success">
          <h3>Shop Created!</h3>
          <p>Shop "${data.name}" has been created successfully.</p>
          <a href="/shops" class="btn btn-primary">Back to Shops</a>
        </div>`
      },
      "new-shop-web-id",
      ResponseType.WEB
    ));
  }
  
  override put(id: string, data: ShopWebData, _req?: Request): Promise<Response> {
    this.logAction('ShopsWeb PUT', { id, data });
    
    console.log(`Web: Updating shop resource with id: ${id}`);
    // Web-specific resource update logic
    return Promise.resolve(ResponseService.success({ 
      ...data, 
      id, 
      updated: true,
      redirect: `/shops/${id}`,
      message: "Shop updated successfully",
      html: `<div class="alert alert-success">
        <h3>Shop Updated!</h3>
        <p>Shop "${data.name || 'Unknown'}" has been updated successfully.</p>
        <a href="/shops/${id}" class="btn btn-primary">View Shop</a>
        <a href="/shops" class="btn btn-secondary">Back to Shops</a>
      </div>`
    },
    200,
    undefined,
    ResponseType.WEB
    ));
  }
  
  override delete(id: string, _req?: Request): Promise<Response> {
    this.logAction('ShopsWeb DELETE', { id });
    
    console.log(`Web: Deleting shop resource with id: ${id}`);
    // Web-specific resource deletion logic
    return Promise.resolve(ResponseService.success({ 
      deleted: true, 
      id, 
      redirect: "/shops",
      message: "Shop deleted successfully",
      html: `<div class="alert alert-info">
        <h3>Shop Deleted</h3>
        <p>Shop has been deleted successfully.</p>
        <a href="/shops" class="btn btn-primary">Back to Shops</a>
      </div>`
    },
    200,
    undefined,
    ResponseType.WEB
    ));
  }
}