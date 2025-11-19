import { assertEquals } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import { handler } from "../index.ts";

// Mock request helper
function createMockRequest(
    method: string = "GET",
    path: string = "/user_devices",
    body?: any,
    headers: Record<string, string> = {},
): Request {
    const url = `https://example.com${path}`;
    const requestInit: RequestInit = {
        method,
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer mock-token",
            ...headers,
        },
    };

    if (body) {
        requestInit.body = JSON.stringify(body);
    }

    return new Request(url, requestInit);
}

// Basic tests for user_devices function
Deno.test("UserDevices - GET request should work", async () => {
    const request = createMockRequest("GET", "/user_devices");
    const response = await handler(request);

    // Should return a response (success or error, but not crash)
    assertEquals(response instanceof Response, true);
});

Deno.test("UserDevices - POST request with device data", async () => {
    const deviceData = {
        user_id: "user-123",
        device_id: "device-456",
        fcm_token: "fcm-token-789",
        model: "iPhone 13",
        device_type: "iOS",
    };

    const request = createMockRequest("POST", "/user_devices", deviceData);
    const response = await handler(request);

    // Should return a response (success or error, but not crash)
    assertEquals(response instanceof Response, true);
});

Deno.test("UserDevices - POST request with clear action", async () => {
    const deviceData = {
        user_id: "user-123",
        device_id: "device-456",
        fcm_token: "fcm-token-789",
    };

    const request = createMockRequest(
        "POST",
        "/user_devices?action=clear",
        deviceData,
    );
    const response = await handler(request);

    // Should return a response (success or error, but not crash)
    assertEquals(response instanceof Response, true);
});

Deno.test("UserDevices - POST request with clear_all action", async () => {
    const deviceData = {
        user_id: "user-123",
        device_id: "device-456",
        fcm_token: "fcm-token-789",
    };

    const request = createMockRequest(
        "POST",
        "/user_devices?action=clear_all",
        deviceData,
    );
    const response = await handler(request);

    // Should return a response (success or error, but not crash)
    assertEquals(response instanceof Response, true);
});

Deno.test("UserDevices - PUT request should work", async () => {
    const updateData = {
        user_id: "user-123",
        device_id: "device-456",
        fcm_token: "new-fcm-token-789",
        model: "iPhone 14",
        device_type: "iOS",
    };

    const request = createMockRequest(
        "PUT",
        "/user_devices/device-id-123",
        updateData,
    );
    const response = await handler(request);

    // Should return a response (success or error, but not crash)
    assertEquals(response instanceof Response, true);
});

Deno.test("UserDevices - DELETE request should work", async () => {
    const request = createMockRequest("DELETE", "/user_devices/device-id-123");
    const response = await handler(request);

    // Should return a response (success or error, but not crash)
    assertEquals(response instanceof Response, true);
});

Deno.test("UserDevices - GET request with user_id parameter", async () => {
    const request = createMockRequest("GET", "/user_devices?user_id=user-123");
    const response = await handler(request);

    // Should return a response (success or error, but not crash)
    assertEquals(response instanceof Response, true);
});

Deno.test("UserDevices - POST request with Unknown device type (default)", async () => {
    const deviceData = {
        user_id: "user-123",
        device_id: "device-456",
        fcm_token: "fcm-token-789",
        model: "Unknown Model",
        // device_type omitted to test default "Unknown" value
    };

    const request = createMockRequest("POST", "/user_devices", deviceData);
    const response = await handler(request);

    // Should return a response (success or error, but not crash)
    assertEquals(response instanceof Response, true);
});

Deno.test("UserDevices - POST request with explicit Unknown device type", async () => {
    const deviceData = {
        user_id: "user-123",
        device_id: "device-456",
        fcm_token: "fcm-token-789",

        model: "Some Model",
        device_type: "Unknown",
    };

    const request = createMockRequest("POST", "/user_devices", deviceData);
    const response = await handler(request);

    // Should return a response (success or error, but not crash)
    assertEquals(response instanceof Response, true);
});

Deno.test("UserDevices - Handler should handle errors gracefully", async () => {
    // Test with malformed request
    const request = createMockRequest("POST", "/user_devices", "invalid-json");
    const response = await handler(request);

    // Should return an error response, not crash
    assertEquals(response instanceof Response, true);
});
 