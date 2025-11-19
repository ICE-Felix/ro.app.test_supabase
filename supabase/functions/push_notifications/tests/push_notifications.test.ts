import { assertEquals } from "https://deno.land/std@0.192.0/testing/asserts.ts";
import { handler } from "../index.ts";

// Helper function to create mock requests
function createMockRequest(
    method: string,
    url: string,
    body?: unknown,
): Request {
    const headers = new Headers({
        "Content-Type": "application/json",
        "Accept": "application/json",
        "x-client-type": "api",
    });

    const requestInit: RequestInit = {
        method,
        headers,
    };

    if (body && (method === "POST" || method === "PUT")) {
        requestInit.body = JSON.stringify(body);
    }

    return new Request(url, requestInit);
}

// Basic tests
Deno.test("PushNotifications - GET request should return service info", async () => {
    const request = createMockRequest("GET", "/push_notifications");
    const response = await handler(request);

    assertEquals(response instanceof Response, true);
});

Deno.test("PushNotifications - POST request should work", async () => {
    const notificationData = {
        type: "token",
        target: "mock-token",
        title: "Test",
        body: "Test message",
    };

    const request = createMockRequest(
        "POST",
        "/push_notifications",
        notificationData,
    );
    const response = await handler(request);

    assertEquals(response instanceof Response, true);
});
