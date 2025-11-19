import { ResponseService } from "../../_shared/services/ResponseService.ts";
import { ResponseType } from "../../_shared/services/ErrorsService.ts";
import { Controller } from "../../_shared/controllers/Controller.ts";

// Define notification data interface (same as API controller)
interface PushNotificationData {
    type: "token" | "topic" | "all_users";
    target?: string;
    title: string;
    body: string;
    data?: Record<string, string>;
    priority?: "high" | "normal";
    ttl?: number;
    badge?: number;
    sound?: string;
    click_action?: string;
    image?: string;
    [key: string]: unknown;
}

export class PushNotificationsWebController
    extends Controller<PushNotificationData> {
    override async get(_id?: string, _req?: Request): Promise<Response> {
        this.logAction("PushNotificationsWEB GET", {});

        const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Push Notifications Service</title>
        <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
            .container { background: #f5f5f5; padding: 20px; border-radius: 8px; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🔔 Push Notifications Service</h1>
            <p>This is a skeleton implementation. Add your FCM logic to make it work!</p>
            <p><strong>Supported Types:</strong> Token, Topic, All Users</p>
        </div>
    </body>
    </html>
    `;

        return ResponseService.success(
            { html },
            200,
            { message: "Push Notifications web interface" },
            ResponseType.WEB,
        );
    }

    override async post(
        data: PushNotificationData,
        _req?: Request,
    ): Promise<Response> {
        // TODO: Implement your web POST logic

        const html = `
    <html>
    <body>
        <h1>Notification Request Received</h1>
        <p>Type: ${data.type}</p>
        <p>Title: ${data.title}</p>
        <p>Body: ${data.body}</p>
        <p>Not implemented yet - add your logic!</p>
    </body>
    </html>
    `;

        return ResponseService.success(
            { html },
            200,
            { message: "Notification request received" },
            ResponseType.WEB,
        );
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
            ResponseType.WEB,
        );
    }

    override async delete(_id: string, _req?: Request): Promise<Response> {
        return ResponseService.error(
            "Method not supported",
            "METHOD_NOT_SUPPORTED",
            405,
            {},
            ResponseType.WEB,
        );
    }
}
