import { ResponseService } from "../../_shared/services/ResponseService.ts";
import { ResponseType } from "../../_shared/services/ErrorsService.ts";
import { Controller } from "../../_shared/controllers/Controller.ts";
import { JWT } from "npm:google-auth-library";

// Define notification types
export type NotificationType = "token" | "topic" | "all_users";

const { default: serviceAccount } = await import("../../service_account.json", {
    with: { type: "json" },
});

const getAccessToken = (
    clientEmail: string,
    privateKey: string,
): Promise<string> => {
    return new Promise((resolve, reject) => {
        const jwtClient = new JWT({
            email: clientEmail,
            key: privateKey,
            scopes: ["https://www.googleapis.com/auth/firebase.messaging"],
        });
        jwtClient.authorize((err, tokens) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(tokens!.access_token!);
        });
    });
};

const accessToken = await getAccessToken(
    serviceAccount.client_email,
    serviceAccount.private_key,
);
// Define notification data interface
interface PushNotificationData {
    type: NotificationType;
    target?: string; // FCM token for 'token' type, topic name for 'topic' type, null for 'all_users'
    title: string;
    body: string;
    data?: Record<string, string>; // Additional data payload
    priority?: "high" | "normal";
    ttl?: number; // Time to live in seconds
    badge?: number; // iOS badge count
    sound?: string; // Sound file name
    click_action?: string; // Action when notification is clicked
    image?: string; // Image URL for rich notifications
    [key: string]: unknown;
}

export class PushNotificationsApiController
    extends Controller<PushNotificationData> {
    // Core API methods
    override async get(_id?: string, _req?: Request): Promise<Response> {
        return ResponseService.success(
            {
                service: "Firebase Cloud Messaging",
                supported_types: ["token", "topic", "all_users"],
                version: "1.0.0",
            },
            200,
            { message: "Push Notifications service info" },
            ResponseType.API,
        );
    }

    override async post(
        data: PushNotificationData,
        _req?: Request,
    ): Promise<Response> {
        this.logAction("PushNotificationsAPI POST", { type: data.type });
        try {
            // TODO: Implement your FCM logic here
            const res = await fetch(
                `https://fcm.googleapis.com/v1/projects/${serviceAccount.project_id}/messages:send`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${accessToken}`,
                    },
                    body: JSON.stringify(
                        {
                            message: {
                                token: data.target,
                                notification: {
                                    title: data.title,
                                    body: data.body,
                                },
                                data: data.data,
                                // priority: data.priority,
                            },
                        },
                    ),
                },
            );
            const responseData = await res.json();
            console.log(responseData);

            return ResponseService.success(
                { message: "Notification would be sent", data },
                200,
                { message: "Not implemented yet" },
                ResponseType.API,
            );
        } catch (error: any) {
            console.error("Error in PushNotificationsAPI POST:", error);
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
        _id: string,
        _data: PushNotificationData,
        _req?: Request,
    ): Promise<Response> {
        return ResponseService.error(
            "Method not supported",
            "METHOD_NOT_SUPPORTED",
            405,
            {},
            ResponseType.API,
        );
    }

    override async delete(_id: string, _req?: Request): Promise<Response> {
        return ResponseService.error(
            "Method not supported",
            "METHOD_NOT_SUPPORTED",
            405,
            {},
            ResponseType.API,
        );
    }
}
