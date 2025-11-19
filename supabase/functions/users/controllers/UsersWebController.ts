import { ResponseService } from "../../_shared/services/ResponseService.ts";
import { ResponseType } from "../../_shared/services/ErrorsService.ts";
import { Controller } from "../../_shared/controllers/Controller.ts";

// Define user data interface for web controller
interface UserWebData {
  email: string;
  first_name?: string;
  last_name?: string;
  userrole?: string;
  phone?: string;
  [key: string]: unknown;
}

export class UsersWebController extends Controller<UserWebData> {
  // Core Web methods
  override get(id?: string, _req?: Request): Promise<Response> {
    this.logAction("UsersWeb GET", { id });

    if (id) {
      console.log(`Web: Fetching user with id: ${id}`);
      // Web-specific user retrieval logic, possibly returning HTML
      return Promise.resolve(ResponseService.success(
        {
          id,
          data: "User Web data",
          html: "<div>User Details</div>",
        },
        200,
        undefined,
        ResponseType.WEB,
      ));
    }

    console.log("Web: Fetching all users");
    // Web-specific users retrieval logic
    return Promise.resolve(ResponseService.success(
      {
        users: ["User1", "User2"],
        html: "<ul><li>User 1</li><li>User 2</li></ul>",
      },
      200,
      undefined,
      ResponseType.WEB,
    ));
  }

  override post(data: UserWebData, _req?: Request): Promise<Response> {
    this.logAction("UsersWeb POST", { data });
    console.log("Web POST data:", data);

    // Validate required fields
    if (!data.email) {
      console.log("Missing required field in data:", data);
      return Promise.resolve(ResponseService.error(
        "Missing required field",
        "MISSING_FIELD",
        400,
        { field: "email" },
        ResponseType.WEB,
      ));
    }

    console.log("Web: Creating new user", data);
    // Web-specific user creation logic
    return Promise.resolve(ResponseService.created(
      { ...data, redirect: "/users" },
      "new-user-web-id",
      ResponseType.WEB,
    ));
  }

  override put(
    id: string,
    data: UserWebData,
    _req?: Request,
  ): Promise<Response> {
    this.logAction("UsersWeb PUT", { id, data });

    console.log(`Web: Updating user with id: ${id}`);
    // Web-specific user update logic
    return Promise.resolve(ResponseService.success(
      {
        ...data,
        id,
        updated: true,
        redirect: `/users/${id}`,
      },
      200,
      undefined,
      ResponseType.WEB,
    ));
  }

  override delete(id: string, _req?: Request): Promise<Response> {
    this.logAction("UsersWeb DELETE", { id });

    console.log(`Web: Deleting user with id: ${id}`);
    // Web-specific user deletion logic
    return Promise.resolve(ResponseService.success(
      {
        deleted: true,
        id,
        redirect: "/users",
        message: "User deleted successfully",
      },
      200,
      undefined,
      ResponseType.WEB,
    ));
  }
}
