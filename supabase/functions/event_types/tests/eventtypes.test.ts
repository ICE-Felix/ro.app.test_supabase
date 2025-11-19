import { assertEquals, assertExists } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

// Add test configuration
const testConfig = {
  permissions: {
    net: true,
    read: true,
    write: true,
    env: true
  }
};

const TEST_KEYS = {
  anon: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxrbG51Z2hoeHZ0ZGJubXJkYWd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzAxODYxNDIsImV4cCI6MjA0NTc2MjE0Mn0.2JGz7y_G_EDXx5lIjldIcVPG7cKA84I2h6q6jskWRuo",
  apiKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxrbG51Z2hoeHZ0ZGJubXJkYWd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzAxODYxNDIsImV4cCI6MjA0NTc2MjE0Mn0.2JGz7y_G_EDXx5lIjldIcVPG7cKA84I2h6q6jskWRuo"
};

const BASE_URL = "https://lklnughhxvtdbnmrdagz.supabase.co/functions/v1/blank";

// Test API Requests
Deno.test("API Requests", async (t) => {
  // Test Anonymous API GET request
  await t.step("Anonymous API GET request", async () => {
    const response = await fetch(`${BASE_URL}`, {
      method: "GET",
      headers: {
        "apikey": TEST_KEYS.anon,
        "Authorization": `Bearer ${TEST_KEYS.anon}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
        "x-client-type": "api"
      }
    });
    
    assertEquals(response.status, 200);
    const data = await response.json();
    assertExists(data);
  });

  // Test Anonymous API POST request
  await t.step("Anonymous API POST request", async () => {
    const response = await fetch(`${BASE_URL}`, {
      method: "POST",
      headers: {
        "apikey": TEST_KEYS.anon,
        "Authorization": `Bearer ${TEST_KEYS.anon}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
        "x-client-type": "api"
      },
      body: JSON.stringify({ 
        id: "1",
        requiredField: "test value"
      })
    });
    
    assertEquals(response.status, 201);
    const data = await response.json();
    assertExists(data);
  });

  // Test Anonymous API PUT request
  await t.step("Anonymous API PUT request", async () => {
    const response = await fetch(`${BASE_URL}/1`, {
      method: "PUT",
      headers: {
        "apikey": TEST_KEYS.anon,
        "Authorization": `Bearer ${TEST_KEYS.anon}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
        "x-client-type": "api"
      },
      body: JSON.stringify({ data: "test" })
    });
    
    assertEquals(response.status, 200);
    const data = await response.json();
    assertExists(data);
  });

  // Test Anonymous API DELETE request
  await t.step("Anonymous API DELETE request", async () => {
    const response = await fetch(`${BASE_URL}/1`, {
      method: "DELETE",
      headers: {
        "apikey": TEST_KEYS.anon,
        "Authorization": `Bearer ${TEST_KEYS.anon}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
        "x-client-type": "api"
      }
    });
    
    assertEquals(response.status, 200);
    const data = await response.json();
    assertExists(data);
  });
});

// Test Web Requests
Deno.test("Web Requests", async (t) => {
  // Test Anonymous Web GET request
  await t.step("Anonymous Web GET request", async () => {
    const response = await fetch(`${BASE_URL}`, {
      method: "GET",
      headers: {
        "apikey": TEST_KEYS.anon,
        "Authorization": `Bearer ${TEST_KEYS.anon}`,
        "Accept": "text/html"
      }
    });
    
    assertEquals(response.status, 200);
    const data = await response.text();
    assertExists(data);
  });

  // Test Anonymous Web POST request
  await t.step("Anonymous Web POST request", async () => {
    const data = {
      id: "1",
      requiredField: "test value"
    };

    const response = await fetch(`${BASE_URL}`, {
      method: "POST",
      headers: {
        "apikey": TEST_KEYS.anon,
        "Authorization": `Bearer ${TEST_KEYS.anon}`,
        "Accept": "text/html",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    });
    
    console.log("Web POST response:", {
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      body: await response.clone().text()
    });
    
    assertEquals(response.status, 201);
    const responseData = await response.text();
    assertExists(responseData);
  });
});

// Test Error Cases
Deno.test("Error Cases", async (t) => {
  // Test Invalid JSON
  await t.step("Invalid JSON payload", async () => {
    const response = await fetch(`${BASE_URL}`, {
      method: "POST",
      headers: {
        "apikey": TEST_KEYS.anon,
        "Authorization": `Bearer ${TEST_KEYS.anon}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
        "x-client-type": "api"
      },
      body: "invalid json"
    });
    
    assertEquals(response.status, 400);
    const data = await response.json();
    assertEquals(data.error.code, "INVALID_JSON");
  });

  // Test Missing ID for PUT/DELETE
  await t.step("Missing ID for PUT request", async () => {
    const response = await fetch(`${BASE_URL}`, {
      method: "PUT",
      headers: {
        "apikey": TEST_KEYS.anon,
        "Authorization": `Bearer ${TEST_KEYS.anon}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
        "x-client-type": "api"
      },
      body: JSON.stringify({ data: "test" })
    });
    
    assertEquals(response.status, 400);
    const data = await response.json();
    assertEquals(data.error.code, "MISSING_ID");
  });

  // Test Method Not Allowed
  await t.step("Method Not Allowed", async () => {
    const response = await fetch(`${BASE_URL}`, {
      method: "PATCH",
      headers: {
        "apikey": TEST_KEYS.anon,
        "Authorization": `Bearer ${TEST_KEYS.anon}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
        "x-client-type": "api"
      }
    });
    
    assertEquals(response.status, 405);
    const data = await response.json();
    assertEquals(data.error.code, "METHOD_NOT_ALLOWED");
  });
});

// Test CORS
Deno.test("CORS", async (t) => {
  // Test OPTIONS request
  await t.step("OPTIONS request", async () => {
    const response = await fetch(`${BASE_URL}`, {
      method: "OPTIONS",
      headers: {
        "Origin": "https://example.com"
      }
    });
    
    assertEquals(response.status, 204);
    assertExists(response.headers.get("Access-Control-Allow-Origin"));
    assertExists(response.headers.get("Access-Control-Allow-Methods"));
    assertExists(response.headers.get("Access-Control-Allow-Headers"));
  });
}); 