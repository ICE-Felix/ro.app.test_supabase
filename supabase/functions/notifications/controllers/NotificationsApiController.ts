import { ResponseService } from "../../_shared/services/ResponseService.ts";
import { ResponseType } from "../../_shared/services/ErrorsService.ts";
import { Controller } from "../../_shared/controllers/Controller.ts";
import { AuthenticationService } from "../../_shared/services/AuthenticationService.ts";
import { SupabaseAdmin } from "../../_shared/supabase/supabaseAdmin.ts";

// Define notifications data interface matching the database table
interface NotificationsData {
  title: string;
  body: string;
  is_global?: boolean;
  created_by?: string;
  [key: string]: unknown;
}

export class NotificationsApiController extends Controller<NotificationsData> {
  // Validation method for notifications
  private validateNotificationsData(
    data: NotificationsData,
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check if data exists
    if (!data || typeof data !== 'object') {
      errors.push("Request body is required and must be a valid object");
      return {
        isValid: false,
        errors,
      };
    }

    // Validate required fields
    if (
      !data.title || typeof data.title !== "string" ||
      data.title.trim() === ""
    ) {
      errors.push("title is required and must be a non-empty string");
    }

    if (
      !data.body || typeof data.body !== "string" ||
      data.body.trim() === ""
    ) {
      errors.push("body is required and must be a non-empty string");
    }

    // Validate is_global if provided
    if (data.is_global !== undefined && typeof data.is_global !== "boolean") {
      errors.push("is_global must be a boolean");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Validation method for updates (only validates present fields)
  private validateNotificationsDataForUpdate(
    data: Partial<NotificationsData>,
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check if data exists
    if (!data || typeof data !== 'object') {
      errors.push("Request body is required and must be a valid object");
      return {
        isValid: false,
        errors,
      };
    }

    // Validate title if present
    if (data.title !== undefined) {
      if (
        !data.title || typeof data.title !== "string" ||
        data.title.trim() === ""
      ) {
        errors.push("title must be a non-empty string");
      }
    }

    // Validate body if present
    if (data.body !== undefined) {
      if (
        !data.body || typeof data.body !== "string" ||
        data.body.trim() === ""
      ) {
        errors.push("body must be a non-empty string");
      }
    }

    // Validate is_global if present
    if (data.is_global !== undefined && typeof data.is_global !== "boolean") {
      errors.push("is_global must be a boolean");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Core API methods
  override async get(id?: string, _req?: Request): Promise<Response> {
    this.logAction("NotificationsAPI GET", { id });

    const { client } = await AuthenticationService.authenticate(_req!);
    const adminClient = SupabaseAdmin.initialize();

    if (id) {
      console.log(`API: Fetching notification with id: ${id}`);
      
      // First get the notification
      const { data: notification, error: notificationError } = await client
        .from("notifications")
        .select("*")
        .eq("id", id)
        .eq("is_global", true)
        .is("deleted_at", null)
        .single();

      if (notificationError) {
        return ResponseService.error(
          "Error fetching notification",
          notificationError.code,
          400,
          notificationError,
          ResponseType.API,
        );
      }

      // Get user info if created_by exists
      let userEmail = null;
      let userName = null;
      if (notification.created_by) {
        const { data: userData, error: userError } = await adminClient.auth.admin
          .getUserById(notification.created_by);
        
        if (!userError && userData.user) {
          userEmail = userData.user.email;
          
          // Check for first_name and last_name in app_metadata
          const metaData = userData.user.app_metadata;
          if (metaData && metaData.first_name && metaData.last_name) {
            userName = `${metaData.first_name} ${metaData.last_name}`;
          } else {
            userName = userEmail;
          }
        }
      }

      // Combine the data
      const responseData = {
        ...notification,
        created_by_email: userEmail,
        created_by_name: userName
      };

      return ResponseService.success(
        responseData,
        200,
        undefined,
        ResponseType.API,
      );
    }

    console.log("API: Fetching all global notifications");
    
    // Get all notifications
    const { data: notifications, error: notificationsError } = await client
      .from("notifications")
      .select("*")
      .eq("is_global", true)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (notificationsError) {
      return ResponseService.error(
        "Error fetching notifications",
        notificationsError.code,
        400,
        notificationsError,
        ResponseType.API,
      );
    }

    // Get user info for all notifications
    const notificationsWithUserInfo = await Promise.all(
      notifications.map(async (notification) => {
        let userEmail = null;
        let userName = null;
        if (notification.created_by) {
          const { data: userData, error: userError } = await adminClient.auth.admin
            .getUserById(notification.created_by);
          
          if (!userError && userData.user) {
            userEmail = userData.user.email;
            
            // Check for first_name and last_name in app_metadata
            const metaData = userData.user.app_metadata;
            if (metaData && metaData.first_name && metaData.last_name) {
              userName = `${metaData.first_name} ${metaData.last_name}`;
            } else {
              userName = userEmail;
            }
          }
        }

        return {
          ...notification,
          created_by_email: userEmail,
          created_by_name: userName
        };
      })
    );

    return ResponseService.success(
      notificationsWithUserInfo,
      200,
      undefined,
      ResponseType.API,
    );
  }

  override async post(
    data: NotificationsData,
    _req?: Request,
  ): Promise<Response> {
    this.logAction("NotificationsAPI POST", { data });

    // Validate notification data
    const validation = this.validateNotificationsData(data);
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
    
    // Get the current user
    const { data: { user }, error: userError } = await client.auth.getUser();
    if (userError || !user) {
      return Promise.resolve(ResponseService.error(
        "Authentication failed",
        "AUTH_ERROR",
        401,
        userError ? { message: userError.message } : undefined,
        ResponseType.API,
      ));
    }

    // Prepare data for insertion
    const notificationData = {
      title: data.title.trim(),
      body: data.body.trim(),
      is_global: data.is_global !== undefined ? data.is_global : true,
      created_by: user.id,
    };

    console.log("API: Creating new notification", notificationData);

    return client
      .from("notifications")
      .insert(notificationData)
      .select("*")
      .single()
      .then(({ data, error }) => {
        if (error) {
          return ResponseService.error(
            "Error creating notification",
            error.code,
            400,
            error,
            ResponseType.API,
          );
        }

        // Determine user name from metadata
        let userName = user.email;
        const metaData = user.app_metadata;
        if (metaData && metaData.first_name && metaData.last_name) {
          userName = `${metaData.first_name} ${metaData.last_name}`;
        }

        // Add user info to response
        const responseData = {
          ...data,
          created_by_email: user.email,
          created_by_name: userName
        };

        return ResponseService.created(
          responseData,
          data.id,
          ResponseType.API,
        );
      });
  }

  override async put(
    id: string,
    data: Partial<NotificationsData>,
    _req?: Request,
  ): Promise<Response> {
    this.logAction("NotificationsAPI PUT", { id, data });

    // Validate notification data (only validates present fields)
    const validation = this.validateNotificationsDataForUpdate(data);
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
    const notificationData: Record<string, string | boolean> = {
      updated_at: new Date().toISOString(),
    };

    // Only add fields that were provided in the request
    if (data.title !== undefined) {
      notificationData.title = data.title.trim();
    }

    if (data.body !== undefined) {
      notificationData.body = data.body.trim();
    }

    if (data.is_global !== undefined) {
      notificationData.is_global = data.is_global;
    }

    console.log(`API: Updating notification with id: ${id}`, notificationData);

    return client
      .from("notifications")
      .update(notificationData)
      .eq("id", id)
      .is("deleted_at", null)
      .select("*")
      .single()
      .then(({ data, error }) => {
        if (error) {
          return ResponseService.error(
            "Error updating notification",
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
    this.logAction("NotificationsAPI DELETE", { id });

    const { client } = await AuthenticationService.authenticate(_req!);

    console.log(`API: Soft deleting notification with id: ${id}`);

    return client
      .from("notifications")
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
            "Error deleting notification",
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
