import { ResponseService } from "../../_shared/services/ResponseService.ts";
import { ResponseType } from "../../_shared/services/ErrorsService.ts";
import { Controller } from "../../_shared/controllers/Controller.ts";

// Define resource data interface
interface VenuesResourceData {
  name?: string;
  contact_id?: string;
  venue_category_id?: string;
  latitude?: string;
  longitude?: string;
  country_id?: string;
  region_id?: string;
  city?: string;
  address?: string;
  //is_active?: boolean;
  //is_online?: boolean;
  [key: string]: unknown;
}

export class VenuesWebController extends Controller<VenuesResourceData> {
  // Core Web methods
  override get(id?: string, _req?: Request): Promise<Response> {
    this.logAction("VenuesWeb GET", { id });

    if (id) {
      console.log(`Web: Fetching venues resource with id: ${id}`);
      // Web-specific resource retrieval logic, possibly returning HTML
      return Promise.resolve(ResponseService.success(
        {
          id,
          data: "Venues Web Resource data",
          html: "<div>Venues Resource Details</div>",
        },
        200,
        undefined,
        ResponseType.WEB,
      ));
    }

    console.log("Web: Fetching all venues resources");
    // Web-specific resources retrieval logic
    return Promise.resolve(ResponseService.success(
      {
        resources: ["Venues_Web_Resource1", "Venues_Web_Resource2"],
        html: "<ul><li>Venues Resource 1</li><li>Venues Resource 2</li></ul>",
      },
      200,
      undefined,
      ResponseType.WEB,
    ));
  }

  override post(data: VenuesResourceData, _req?: Request): Promise<Response> {
    this.logAction("VenuesWeb POST", { data });
    console.log("Web POST data:", data);

    // Basic validation for web requests
    if (!data.name && !data.city && !data.address) {
      console.log("Missing required fields in data:", data);
      return Promise.resolve(ResponseService.error(
        "At least one field (name, city, or address) is required",
        "MISSING_FIELD",
        400,
        { fields: ["name", "city", "address"] },
        ResponseType.WEB,
      ));
    }

    console.log("Web: Creating new venues resource", data);
    // Web-specific resource creation logic
    return Promise.resolve(ResponseService.created(
      { ...data, redirect: "/venues" },
      "new-venues-web-id",
      ResponseType.WEB,
    ));
  }

  override put(
    id: string,
    data: VenuesResourceData,
    _req?: Request,
  ): Promise<Response> {
    this.logAction("VenuesWeb PUT", { id, data });

    console.log(`Web: Updating venues resource with id: ${id}`);
    // Web-specific resource update logic
    return Promise.resolve(ResponseService.success(
      {
        ...data,
        id,
        updated: true,
        redirect: `/venues/${id}`,
      },
      200,
      undefined,
      ResponseType.WEB,
    ));
  }

  override delete(id: string, _req?: Request): Promise<Response> {
    this.logAction("VenuesWeb DELETE", { id });

    console.log(`Web: Deleting venues resource with id: ${id}`);
    // Web-specific resource deletion logic
    return Promise.resolve(ResponseService.success(
      {
        deleted: true,
        id,
        redirect: "/venues",
        message: "Venues resource deleted successfully",
      },
      200,
      undefined,
      ResponseType.WEB,
    ));
  }
} 