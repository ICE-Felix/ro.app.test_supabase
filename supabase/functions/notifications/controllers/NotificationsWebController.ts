import { ResponseService } from "../../_shared/services/ResponseService.ts";
import { ResponseType } from "../../_shared/services/ErrorsService.ts";
import { Controller } from "../../_shared/controllers/Controller.ts";

// Define resource data interface
interface NotificationsData {
  requiredField: string;
  [key: string]: unknown;
}

export class NotificationsWebController extends Controller<NotificationsData> {
  // Core Web methods
  override get(id?: string, _req?: Request): Promise<Response> {
    this.logAction("PartnersWeb GET", { id });

    if (id) {
      console.log(`Web: Fetching partners resource with id: ${id}`);
      // Web-specific resource retrieval logic, possibly returning HTML
      return Promise.resolve(ResponseService.success(
        {
          id,
          data: "Partners Web Resource data",
          html: "<div>Partners Resource Details</div>",
        },
        200,
        undefined,
        ResponseType.WEB,
      ));
    }

    console.log("Web: Fetching all partners resources");
    // Web-specific resources retrieval logic
    return Promise.resolve(ResponseService.success(
      {
        resources: ["Blank_Web_Resource1", "Blank_Web_Resource2"],
        html: "<ul><li>Blank Resource 1</li><li>Blank Resource 2</li></ul>",
      },
      200,
      undefined,
      ResponseType.WEB,
    ));
  }

  override post(data: NotificationsData, _req?: Request): Promise<Response> {
    this.logAction("PartnersWeb POST", { data });
    console.log("Web POST data:", data);

    // Validate required fields
    if (!data.requiredField) {
      console.log("Missing required field in data:", data);
      return Promise.resolve(ResponseService.error(
        "Missing required field",
        "MISSING_FIELD",
        400,
        { field: "requiredField" },
        ResponseType.WEB,
      ));
    }

    console.log("Web: Creating new partners resource", data);
    // Web-specific resource creation logic
    return Promise.resolve(ResponseService.created(
      { ...data, redirect: "/partners" },
      "new-partners-web-id",
      ResponseType.WEB,
    ));
  }

  override put(
    id: string,
    data: NotificationsData,
    _req?: Request,
  ): Promise<Response> {
    this.logAction("PartnersWeb PUT", { id, data });

    console.log(`Web: Updating partners resource with id: ${id}`);
    // Web-specific resource update logic
    return Promise.resolve(ResponseService.success(
      {
        ...data,
        id,
        updated: true,
        redirect: `/partners/${id}`,
      },
      200,
      undefined,
      ResponseType.WEB,
    ));
  }

  override delete(id: string, _req?: Request): Promise<Response> {
    this.logAction("PartnersWeb DELETE", { id });

    console.log(`Web: Deleting partners resource with id: ${id}`);
    // Web-specific resource deletion logic
    return Promise.resolve(ResponseService.success(
      {
        deleted: true,
        id,
        redirect: "/partners",
        message: "Partners resource deleted successfully",
      },
      200,
      undefined,
      ResponseType.WEB,
    ));
  }
}
