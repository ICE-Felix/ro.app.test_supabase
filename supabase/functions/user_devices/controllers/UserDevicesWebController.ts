import { ResponseService } from "../../_shared/services/ResponseService.ts";
import { ResponseType } from "../../_shared/services/ErrorsService.ts";
import { Controller } from "../../_shared/controllers/Controller.ts";

// Define user device data interface
interface UserDeviceData {
  device_id: string; // Primary key
  user_id: string;
  fcm_token: string;
  model?: string;
  device_type?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

export class UserDevicesWebController extends Controller<UserDeviceData> {
  // Core Web methods
  override async get(id?: string, req?: Request): Promise<Response> {
    this.logAction("UserDevicesWeb GET", { id });

    if (id) {
      console.log(`Web: Fetching user device with id: ${id}`);
      // Web-specific device retrieval logic, returning HTML
      return ResponseService.success(
        {
          id,
          data: "User Device Web Resource data",
          html: `
          <div class="device-details">
            <h2>User Device Details</h2>
            <div class="device-card">
              <p><strong>Device ID:</strong> ${id}</p>
              <p><strong>Status:</strong> Active</p>
              <p><strong>Last Seen:</strong> ${new Date().toLocaleString()}</p>
              <div class="actions">
                <button onclick="clearToken('${id}')">Clear Token</button>
                <button onclick="deleteDevice('${id}')">Delete Device</button>
              </div>
            </div>
          </div>
          <style>
            .device-card { 
              border: 1px solid #ddd; 
              padding: 20px; 
              border-radius: 8px; 
              margin: 15px 0; 
              background: #f9f9f9; 
            }
            .actions button { 
              margin: 5px; 
              padding: 8px 16px; 
              border: none; 
              border-radius: 4px; 
              cursor: pointer; 
            }
            .actions button:first-child { background: #dc3545; color: white; }
            .actions button:last-child { background: #6c757d; color: white; }
          </style>
        `,
        },
        200,
        undefined,
        ResponseType.WEB,
      );
    }

    console.log("Web: Fetching all user devices");
    // Parse query parameters
    const url = req ? new URL(req.url) : null;
    const userId = url?.searchParams.get("user_id") || "current-user";

    // Web-specific devices retrieval logic
    return ResponseService.success(
      {
        devices: [
          `Device-1-${userId}`,
          `Device-2-${userId}`,
          `Device-3-${userId}`,
        ],
        user_id: userId,
        html: `
        <div class="devices-list">
          <h2>User Devices</h2>
          <div class="user-info">
            <p><strong>User ID:</strong> ${userId}</p>
            <p><strong>Total Devices:</strong> 3</p>
          </div>
          <div class="devices-grid">
            <div class="device-card">
              <h3>Mobile Device</h3>
              <p><strong>Device ID:</strong> device-mobile-001</p>
              <p><strong>Platform:</strong> iOS</p>
              <p><strong>Model:</strong> iPhone 13</p>
              <p><strong>Last Seen:</strong> 2 minutes ago</p>
              <span class="status active">Active</span>
            </div>
            <div class="device-card">
              <h3>Web Browser</h3>
              <p><strong>Device ID:</strong> device-web-002</p>
              <p><strong>Platform:</strong> Web</p>
              <p><strong>Model:</strong> Chrome Browser</p>
              <p><strong>Last Seen:</strong> 5 minutes ago</p>
              <span class="status active">Active</span>
            </div>
            <div class="device-card">
              <h3>Tablet Device</h3>
              <p><strong>Device ID:</strong> device-tablet-003</p>
              <p><strong>Platform:</strong> Android</p>
              <p><strong>Model:</strong> Samsung Galaxy Tab</p>
              <p><strong>Last Seen:</strong> 1 hour ago</p>
              <span class="status inactive">Inactive</span>
            </div>
          </div>
          <div class="actions">
            <button onclick="clearAllDevices('${userId}')">Clear All Devices</button>
            <button onclick="refreshDevices()">Refresh List</button>
          </div>
        </div>
        <style>
          .devices-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); 
            gap: 20px; 
            margin: 20px 0; 
          }
          .device-card { 
            border: 1px solid #ddd; 
            padding: 20px; 
            border-radius: 8px; 
            background: #f9f9f9; 
          }
          .device-card h3 { 
            margin-top: 0; 
            color: #007cba; 
          }
          .status { 
            padding: 4px 8px; 
            border-radius: 4px; 
            font-size: 0.9em; 
            font-weight: bold; 
          }
          .status.active { 
            background: #d4edda; 
            color: #155724; 
          }
          .status.inactive { 
            background: #f8d7da; 
            color: #721c24; 
          }
          .user-info { 
            background: #e9ecef; 
            padding: 15px; 
            border-radius: 4px; 
            margin: 15px 0; 
          }
          .actions { 
            margin-top: 20px; 
          }
          .actions button { 
            margin: 5px; 
            padding: 10px 20px; 
            border: none; 
            border-radius: 4px; 
            cursor: pointer; 
            font-size: 1em; 
          }
          .actions button:first-child { 
            background: #dc3545; 
            color: white; 
          }
          .actions button:last-child { 
            background: #007cba; 
            color: white; 
          }
        </style>
      `,
      },
      200,
      undefined,
      ResponseType.WEB,
    );
  }

  override async post(
    data: UserDeviceData,
    req?: Request,
  ): Promise<Response> {
    this.logAction("UserDevicesWeb POST", { data });
    console.log("Web POST data:", data);

    // Check for action parameter
    const url = req ? new URL(req.url) : null;
    const action = url?.searchParams.get("action");

    if (action === "clear") {
      return this.handleClearDevice(data, req);
    }

    if (action === "clear_all") {
      return this.handleClearAllDevices(data, req);
    }

    // Validate required fields
    if (!data.user_id || !data.device_id || !data.fcm_token) {
      console.log("Missing required fields in data:", data);
      return ResponseService.error(
        "Missing required fields: user_id, device_id, and fcm_token are required",
        "VALIDATION_ERROR",
        400,
        {
          required_fields: ["user_id", "device_id", "fcm_token"],
          received: Object.keys(data),
        },
        ResponseType.WEB,
      );
    }

    // Device registration success response
    return ResponseService.success(
      {
        message: "Device registered successfully",
        device: {
          user_id: data.user_id,
          device_id: data.device_id,
          model: data.model || "unknown",
          device_type: data.device_type || "Unknown",
        },
        html: `
        <div class="success-message">
          <h2>Device Registered Successfully</h2>
          <div class="device-summary">
                        <p><strong>User ID:</strong> ${data.user_id}</p>
            <p><strong>Device ID:</strong> ${data.device_id}</p>
            <p><strong>Model:</strong> ${data.model || "Not specified"}</p>
            <p><strong>Device Type:</strong> ${
          data.device_type || "Unknown"
        }</p>
            <p><strong>FCM Token:</strong> ${
          data.fcm_token.substring(0, 20)
        }...</p>
            <p><strong>Registration Time:</strong> ${
          new Date().toLocaleString()
        }</p>
          </div>
          <div class="actions">
            <button onclick="history.back()">Back to Devices</button>
            <button onclick="registerAnother()">Register Another Device</button>
          </div>
        </div>
        <style>
          .success-message { 
            background: #d4edda; 
            border: 1px solid #c3e6cb; 
            padding: 20px; 
            border-radius: 8px; 
            margin: 20px 0; 
          }
          .device-summary { 
            background: white; 
            padding: 15px; 
            border-radius: 4px; 
            margin: 15px 0; 
          }
          .actions button { 
            margin: 5px; 
            padding: 10px 20px; 
            border: none; 
            border-radius: 4px; 
            cursor: pointer; 
          }
          .actions button:first-child { 
            background: #6c757d; 
            color: white; 
          }
          .actions button:last-child { 
            background: #28a745; 
            color: white; 
          }
        </style>
      `,
      },
      201,
      undefined,
      ResponseType.WEB,
    );
  }

  override async put(
    id: string,
    data: UserDeviceData,
    req?: Request,
  ): Promise<Response> {
    this.logAction("UserDevicesWeb PUT", { id, data });
    console.log("Web PUT data:", data);

    if (!id) {
      return ResponseService.error(
        "Device ID is required for updates",
        "MISSING_ID",
        400,
        {},
        ResponseType.WEB,
      );
    }

    // Device update success response
    return ResponseService.success(
      {
        message: "Device updated successfully",
        device_id: id,
        updated_fields: Object.keys(data),
        html: `
        <div class="update-success">
          <h2>Device Updated Successfully</h2>
          <div class="update-summary">
            <p><strong>Device ID:</strong> ${id}</p>
            <p><strong>Updated Fields:</strong> ${
          Object.keys(data).join(", ")
        }</p>
            <p><strong>Update Time:</strong> ${new Date().toLocaleString()}</p>
          </div>
          <div class="actions">
            <button onclick="viewDevice('${id}')">View Device</button>
            <button onclick="history.back()">Back to List</button>
          </div>
        </div>
        <style>
          .update-success { 
            background: #cce7ff; 
            border: 1px solid #99d6ff; 
            padding: 20px; 
            border-radius: 8px; 
            margin: 20px 0; 
          }
          .update-summary { 
            background: white; 
            padding: 15px; 
            border-radius: 4px; 
            margin: 15px 0; 
          }
          .actions button { 
            margin: 5px; 
            padding: 10px 20px; 
            border: none; 
            border-radius: 4px; 
            cursor: pointer; 
            background: #007cba; 
            color: white; 
          }
        </style>
      `,
      },
      200,
      undefined,
      ResponseType.WEB,
    );
  }

  override async delete(id: string, req?: Request): Promise<Response> {
    this.logAction("UserDevicesWeb DELETE", { id });

    if (!id) {
      return ResponseService.error(
        "Device ID is required for deletion",
        "MISSING_ID",
        400,
        {},
        ResponseType.WEB,
      );
    }

    // Device deletion success response
    return ResponseService.success(
      {
        message: "Device deleted successfully",
        deleted_device_id: id,
        html: `
        <div class="delete-success">
          <h2>Device Deleted Successfully</h2>
          <div class="delete-summary">
            <p><strong>Deleted Device ID:</strong> ${id}</p>
            <p><strong>Deletion Time:</strong> ${
          new Date().toLocaleString()
        }</p>
            <p>The device has been removed from your account and will no longer receive notifications.</p>
          </div>
          <div class="actions">
            <button onclick="location.href='/user_devices'">Back to Devices List</button>
            <button onclick="registerDevice()">Register New Device</button>
          </div>
        </div>
        <style>
          .delete-success { 
            background: #f8d7da; 
            border: 1px solid #f1a3a8; 
            padding: 20px; 
            border-radius: 8px; 
            margin: 20px 0; 
          }
          .delete-summary { 
            background: white; 
            padding: 15px; 
            border-radius: 4px; 
            margin: 15px 0; 
          }
          .actions button { 
            margin: 5px; 
            padding: 10px 20px; 
            border: none; 
            border-radius: 4px; 
            cursor: pointer; 
          }
          .actions button:first-child { 
            background: #6c757d; 
            color: white; 
          }
          .actions button:last-child { 
            background: #007cba; 
            color: white; 
          }
        </style>
      `,
      },
      200,
      undefined,
      ResponseType.WEB,
    );
  }

  // Handle clear device action
  private async handleClearDevice(
    data: UserDeviceData,
    req?: Request,
  ): Promise<Response> {
    this.logAction("UserDevicesWeb CLEAR_DEVICE", { data });

    if (!data.user_id || !data.device_id) {
      return ResponseService.error(
        "user_id and device_id are required for clearing device",
        "MISSING_FIELDS",
        400,
        {},
        ResponseType.WEB,
      );
    }

    return ResponseService.success(
      {
        message: "Device token cleared successfully",
        user_id: data.user_id,
        device_id: data.device_id,
        html: `
        <div class="clear-success">
          <h2>Device Token Cleared</h2>
          <div class="clear-summary">
            <p><strong>User ID:</strong> ${data.user_id}</p>
            <p><strong>Device ID:</strong> ${data.device_id}</p>
            <p><strong>Action:</strong> FCM token cleared</p>
            <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
            <p>The device will no longer receive push notifications until re-registered.</p>
          </div>
          <div class="actions">
            <button onclick="location.href='/user_devices'">Back to Devices</button>
            <button onclick="reregisterDevice('${data.device_id}')">Re-register Device</button>
          </div>
        </div>
        <style>
          .clear-success { 
            background: #fff3cd; 
            border: 1px solid #ffeaa7; 
            padding: 20px; 
            border-radius: 8px; 
            margin: 20px 0; 
          }
          .clear-summary { 
            background: white; 
            padding: 15px; 
            border-radius: 4px; 
            margin: 15px 0; 
          }
          .actions button { 
            margin: 5px; 
            padding: 10px 20px; 
            border: none; 
            border-radius: 4px; 
            cursor: pointer; 
          }
          .actions button:first-child { 
            background: #6c757d; 
            color: white; 
          }
          .actions button:last-child { 
            background: #ffc107; 
            color: black; 
          }
        </style>
      `,
      },
      200,
      undefined,
      ResponseType.WEB,
    );
  }

  // Handle clear all devices action
  private async handleClearAllDevices(
    data: UserDeviceData,
    req?: Request,
  ): Promise<Response> {
    this.logAction("UserDevicesWeb CLEAR_ALL_DEVICES", { data });

    if (!data.user_id) {
      return ResponseService.error(
        "user_id is required for clearing all devices",
        "MISSING_USER_ID",
        400,
        {},
        ResponseType.WEB,
      );
    }

    return ResponseService.success(
      {
        message: "All user devices cleared successfully",
        user_id: data.user_id,
        cleared_count: 3, // Mock count
        html: `
        <div class="clear-all-success">
          <h2>All Devices Cleared</h2>
          <div class="clear-all-summary">
            <p><strong>User ID:</strong> ${data.user_id}</p>
            <p><strong>Devices Cleared:</strong> 3</p>
            <p><strong>Action:</strong> All FCM tokens cleared</p>
            <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
            <p>All devices for this user have been removed. No devices will receive push notifications until re-registered.</p>
          </div>
          <div class="actions">
            <button onclick="location.href='/user_devices'">View Devices List</button>
            <button onclick="registerFirstDevice()">Register New Device</button>
          </div>
        </div>
        <style>
          .clear-all-success { 
            background: #f8d7da; 
            border: 1px solid #f1a3a8; 
            padding: 20px; 
            border-radius: 8px; 
            margin: 20px 0; 
          }
          .clear-all-summary { 
            background: white; 
            padding: 15px; 
            border-radius: 4px; 
            margin: 15px 0; 
          }
          .actions button { 
            margin: 5px; 
            padding: 10px 20px; 
            border: none; 
            border-radius: 4px; 
            cursor: pointer; 
          }
          .actions button:first-child { 
            background: #6c757d; 
            color: white; 
          }
          .actions button:last-child { 
            background: #28a745; 
            color: white; 
          }
        </style>
      `,
      },
      200,
      undefined,
      ResponseType.WEB,
    );
  }
}
 