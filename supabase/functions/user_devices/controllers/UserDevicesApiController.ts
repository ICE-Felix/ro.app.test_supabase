import { ResponseService } from "../../_shared/services/ResponseService.ts";
import { ResponseType } from "../../_shared/services/ErrorsService.ts";
import { Controller } from "../../_shared/controllers/Controller.ts";
import { SupabaseClient } from "../../_shared/supabase/supabaseClient.ts";
import { SupabaseAdmin } from "../../_shared/supabase/supabaseAdmin.ts";

// Define device type enum values (supported device types)
export type DeviceType = "Android" | "iOS" | "Desktop" | "Web" | "Unknown";

// Define user device data interface matching the database table
interface UserDeviceData {
    device_id: string; // Primary key
    user_id: string;
    fcm_token: string;
    model?: string;
    device_type?: DeviceType;
    created_at?: string;
    updated_at?: string;
    [key: string]: unknown;
}

export class UserDevicesApiController extends Controller<UserDeviceData> {
    // Validation method
    private validateDeviceData(
        data: UserDeviceData,
    ): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];

        // Validate required fields
        if (
            !data.user_id || typeof data.user_id !== "string" ||
            data.user_id.trim() === ""
        ) {
            errors.push("user_id is required and must be a non-empty string");
        }

        if (
            !data.device_id || typeof data.device_id !== "string" ||
            data.device_id.trim() === ""
        ) {
            errors.push("device_id is required and must be a non-empty string");
        }

        if (
            !data.fcm_token || typeof data.fcm_token !== "string" ||
            data.fcm_token.trim() === ""
        ) {
            errors.push("fcm_token is required and must be a non-empty string");
        }

        // Validate optional string fields
        if (
            data.model !== undefined && data.model !== null &&
            typeof data.model !== "string"
        ) {
            errors.push("model must be a string");
        }

        // Validate device_type enum
        if (data.device_type !== undefined && data.device_type !== null) {
            const validDeviceTypes: DeviceType[] = [
                "Android",
                "iOS",
                "Desktop",
                "Web",
                "Unknown",
            ];
            if (!validDeviceTypes.includes(data.device_type as DeviceType)) {
                errors.push(
                    `device_type must be one of: ${
                        validDeviceTypes.join(", ")
                    }`,
                );
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
        };
    }

    // Get current user ID from auth context
    private async getCurrentUserId(req?: Request): Promise<string | null> {
        try {
            if (!req) return null;
            const authHeader = req.headers.get("authorization");
            if (!authHeader) return null;

            const supabase = SupabaseClient.initialize(req);
            const { data: { user }, error } = await supabase.auth.getUser();

            if (error || !user) return null;
            return user.id;
        } catch (error: any) {
            console.error(
                "Error getting current user:",
                error.message || error,
            );
            return null;
        }
    }

    // Core API methods
    override async get(deviceId?: string, req?: Request): Promise<Response> {
        this.logAction("UserDevicesAPI GET", { deviceId });

        try {
            const supabase = SupabaseAdmin.initialize();

            if (deviceId) {
                // Get specific device by device_id (primary key)
                const { data, error } = await supabase
                    .from("user_devices")
                    .select("*")
                    .eq("device_id", deviceId)
                    .single();

                if (error) {
                    console.error("Database error:", error);
                    return ResponseService.error(
                        "Failed to retrieve device",
                        "DATABASE_ERROR",
                        500,
                        { error: error.message },
                        ResponseType.API,
                    );
                }

                if (!data) {
                    return ResponseService.error(
                        "Device not found",
                        "DEVICE_NOT_FOUND",
                        404,
                        {},
                        ResponseType.API,
                    );
                }

                return ResponseService.success(
                    data,
                    200,
                    { message: "Device retrieved successfully" },
                    ResponseType.API,
                );
            } else {
                // Get all devices for current user or specified user
                const url = req ? new URL(req.url) : null;
                const userId = url?.searchParams.get("user_id");
                const currentUserId = await this.getCurrentUserId(req);

                // If no user_id specified, use current authenticated user
                const targetUserId = userId || currentUserId;

                if (!targetUserId) {
                    return ResponseService.error(
                        "User ID is required",
                        "USER_ID_REQUIRED",
                        400,
                        {},
                        ResponseType.API,
                    );
                }

                const { data, error } = await supabase
                    .from("user_devices")
                    .select("*")
                    .eq("user_id", targetUserId)
                    .order("updated_at", { ascending: false });

                if (error) {
                    console.error("Database error:", error);
                    return ResponseService.error(
                        "Failed to retrieve devices",
                        "DATABASE_ERROR",
                        500,
                        { error: error.message },
                        ResponseType.API,
                    );
                }

                return ResponseService.success(
                    data || [],
                    200,
                    {
                        message: `Retrieved ${data?.length || 0} devices`,
                        user_id: targetUserId,
                    },
                    ResponseType.API,
                );
            }
        } catch (error: any) {
            console.error("Error in UserDevicesAPI GET:", error);
            return ResponseService.error(
                "Internal server error",
                "INTERNAL_ERROR",
                500,
                { error: error.message || error },
                ResponseType.API,
            );
        }
    }

    override async post(
        data: UserDeviceData,
        req?: Request,
    ): Promise<Response> {
        this.logAction("UserDevicesAPI POST", { data });

        try {
            const supabase = SupabaseAdmin.initialize();

            // Check if this is a clear operation
            const url = req ? new URL(req.url) : null;
            const action = url?.searchParams.get("action");

            if (action === "clear") {
                return this.clearDeviceToken(data, req);
            }

            if (action === "clear_all") {
                return this.clearAllUserDevices(data, req);
            }

            // Validate device data
            const validation = this.validateDeviceData(data);
            if (!validation.isValid) {
                return ResponseService.error(
                    "Validation failed",
                    "VALIDATION_ERROR",
                    400,
                    { errors: validation.errors },
                    ResponseType.API,
                );
            }

            // Prepare device data for upsert (device_id is primary key)
            const deviceData = {
                device_id: data.device_id,
                user_id: data.user_id,
                fcm_token: data.fcm_token,
                model: data.model,
                device_type: data.device_type || "Unknown",
                updated_at: new Date().toISOString(),
            };

            // Use upsert to handle both create and update cases (device_id is primary key)
            const { data: result, error } = await supabase
                .from("user_devices")
                .upsert(deviceData, {
                    onConflict: "device_id",
                })
                .select()
                .single();

            if (error) {
                console.error("Database error:", error);
                return ResponseService.error(
                    "Failed to register device",
                    "DATABASE_ERROR",
                    500,
                    { error: error.message },
                    ResponseType.API,
                );
            }

            return ResponseService.success(
                result,
                201,
                { message: "Device registered successfully" },
                ResponseType.API,
            );
        } catch (error: any) {
            console.error("Error in UserDevicesAPI POST:", error);
            return ResponseService.error(
                "Internal server error",
                "INTERNAL_ERROR",
                500,
                { error: error.message || error },
                ResponseType.API,
            );
        }
    }

    override async put(
        deviceId: string,
        data: UserDeviceData,
        req?: Request,
    ): Promise<Response> {
        this.logAction("UserDevicesAPI PUT", { deviceId, data });

        try {
            if (!deviceId || deviceId.trim() === "") {
                return ResponseService.error(
                    "Device ID is required",
                    "DEVICE_ID_REQUIRED",
                    400,
                    {},
                    ResponseType.API,
                );
            }

            const supabase = SupabaseAdmin.initialize();

            // Validate device data
            const validation = this.validateDeviceData(data);
            if (!validation.isValid) {
                return ResponseService.error(
                    "Validation failed",
                    "VALIDATION_ERROR",
                    400,
                    { errors: validation.errors },
                    ResponseType.API,
                );
            }

            // Prepare update data (device_type defaults to "Unknown")
            const updateData = {
                fcm_token: data.fcm_token,
                model: data.model,
                device_type: data.device_type || "Unknown",
                updated_at: new Date().toISOString(),
            };

            const { data: result, error } = await supabase
                .from("user_devices")
                .update(updateData)
                .eq("device_id", deviceId)
                .select()
                .single();

            if (error) {
                console.error("Database error:", error);
                return ResponseService.error(
                    "Failed to update device",
                    "DATABASE_ERROR",
                    500,
                    { error: error.message },
                    ResponseType.API,
                );
            }

            if (!result) {
                return ResponseService.error(
                    "Device not found",
                    "DEVICE_NOT_FOUND",
                    404,
                    {},
                    ResponseType.API,
                );
            }

            return ResponseService.success(
                result,
                200,
                { message: "Device updated successfully" },
                ResponseType.API,
            );
        } catch (error: any) {
            console.error("Error in UserDevicesAPI PUT:", error);
            return ResponseService.error(
                "Internal server error",
                "INTERNAL_ERROR",
                500,
                { error: error.message || error },
                ResponseType.API,
            );
        }
    }

    override async delete(deviceId: string, req?: Request): Promise<Response> {
        this.logAction("UserDevicesAPI DELETE", { deviceId });

        try {
            if (!deviceId || deviceId.trim() === "") {
                return ResponseService.error(
                    "Device ID is required",
                    "DEVICE_ID_REQUIRED",
                    400,
                    {},
                    ResponseType.API,
                );
            }

            const supabase = SupabaseAdmin.initialize();

            const { data, error } = await supabase
                .from("user_devices")
                .delete()
                .eq("device_id", deviceId)
                .select()
                .single();

            if (error) {
                console.error("Database error:", error);
                return ResponseService.error(
                    "Failed to delete device",
                    "DATABASE_ERROR",
                    500,
                    { error: error.message },
                    ResponseType.API,
                );
            }

            if (!data) {
                return ResponseService.error(
                    "Device not found",
                    "DEVICE_NOT_FOUND",
                    404,
                    {},
                    ResponseType.API,
                );
            }

            return ResponseService.success(
                data,
                200,
                { message: "Device deleted successfully" },
                ResponseType.API,
            );
        } catch (error: any) {
            console.error("Error in UserDevicesAPI DELETE:", error);
            return ResponseService.error(
                "Internal server error",
                "INTERNAL_ERROR",
                500,
                { error: error.message || error },
                ResponseType.API,
            );
        }
    }

    // Clear specific device token (delete the record)
    private async clearDeviceToken(
        data: UserDeviceData,
        req?: Request,
    ): Promise<Response> {
        this.logAction("UserDevicesAPI CLEAR_TOKEN", { data });

        try {
            const supabase = SupabaseAdmin.initialize();

            if (!data.user_id || !data.device_id) {
                return ResponseService.error(
                    "user_id and device_id are required for clearing",
                    "MISSING_REQUIRED_FIELDS",
                    400,
                    {},
                    ResponseType.API,
                );
            }

            // Delete the device record completely
            const { data: result, error } = await supabase
                .from("user_devices")
                .delete()
                .eq("user_id", data.user_id)
                .eq("device_id", data.device_id)
                .select();

            if (error) {
                console.error("Database error:", error);
                return ResponseService.error(
                    "Failed to clear device token",
                    "DATABASE_ERROR",
                    500,
                    { error: error.message },
                    ResponseType.API,
                );
            }

            return ResponseService.success(
                { cleared: result?.length || 0 },
                200,
                { message: "Device token cleared successfully" },
                ResponseType.API,
            );
        } catch (error: any) {
            console.error("Error in clearDeviceToken:", error);
            return ResponseService.error(
                "Internal server error",
                "INTERNAL_ERROR",
                500,
                { error: error.message || error },
                ResponseType.API,
            );
        }
    }

    // Clear all devices for a user
    private async clearAllUserDevices(
        data: UserDeviceData,
        req?: Request,
    ): Promise<Response> {
        this.logAction("UserDevicesAPI CLEAR_ALL", { data });

        try {
            const supabase = SupabaseAdmin.initialize();

            if (!data.user_id) {
                return ResponseService.error(
                    "user_id is required for clearing all devices",
                    "USER_ID_REQUIRED",
                    400,
                    {},
                    ResponseType.API,
                );
            }

            // Delete all device records for the user
            const { data: result, error } = await supabase
                .from("user_devices")
                .delete()
                .eq("user_id", data.user_id)
                .select();

            if (error) {
                console.error("Database error:", error);
                return ResponseService.error(
                    "Failed to clear all user devices",
                    "DATABASE_ERROR",
                    500,
                    { error: error.message },
                    ResponseType.API,
                );
            }

            return ResponseService.success(
                { cleared: result?.length || 0, user_id: data.user_id },
                200,
                { message: `Cleared ${result?.length || 0} devices for user` },
                ResponseType.API,
            );
        } catch (error: any) {
            console.error("Error in clearAllUserDevices:", error);
            return ResponseService.error(
                "Internal server error",
                "INTERNAL_ERROR",
                500,
                { error: error.message || error },
                ResponseType.API,
            );
        }
    }

    // Additional helper method to touch updated_at timestamp
    async touchDevice(deviceId: string): Promise<Response> {
        this.logAction("UserDevicesAPI TOUCH_DEVICE", { deviceId });

        try {
            const supabase = SupabaseAdmin.initialize();

            const { data, error } = await supabase
                .from("user_devices")
                .update({
                    updated_at: new Date().toISOString(),
                })
                .eq("device_id", deviceId)
                .select();

            if (error) {
                console.error("Database error:", error);
                return ResponseService.error(
                    "Failed to update device timestamp",
                    "DATABASE_ERROR",
                    500,
                    { error: error.message },
                    ResponseType.API,
                );
            }

            return ResponseService.success(
                data?.[0] || null,
                200,
                { message: "Device timestamp updated successfully" },
                ResponseType.API,
            );
        } catch (error: any) {
            console.error("Error in touchDevice:", error);
            return ResponseService.error(
                "Internal server error",
                "INTERNAL_ERROR",
                500,
                { error: error.message || error },
                ResponseType.API,
            );
        }
    }
}
