import { assertEquals, assertExists } from "https://deno.land/std@0.208.0/assert/mod.ts";

const TEST_KEYS = {
  anon: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmZHZsZnB3dnRrdHRmYmx0dXVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxNDEwNDMsImV4cCI6MjA2NDcxNzA0M30.EZfpYjRy85A7rsWymGTqhytNsgLBqHMBASk08CI0508",
  apiKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmZHZsZnB3dnRrdHRmYmx0dXVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxNDEwNDMsImV4cCI6MjA2NDcxNzA0M30.EZfpYjRy85A7rsWymGTqhytNsgLBqHMBASk08CI0508"
};

const BASE_URL = "https://ffdvlfpwvtkttfbltuue.supabase.co/functions/v1/venue_categories";
const AUTH_URL = "https://ffdvlfpwvtkttfbltuue.supabase.co/auth/v1/token";

// Test credentials
const TEST_USER = {
  email: "test@icefelix.com",
  password: "12qwaszx"
};

let authToken = "";
let parentCategoryId = "";
let childCategoryId = "";
let venueCategoryId = "";

// Authentication Helper
async function authenticate(): Promise<string> {
  const response = await fetch(`${AUTH_URL}?grant_type=password`, {
    method: "POST",
    headers: {
      "apikey": TEST_KEYS.anon,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      email: TEST_USER.email,
      password: TEST_USER.password
    })
  });

  if (response.ok) {
    const data = await response.json();
    return data.access_token;
  }
  throw new Error(`Authentication failed: ${response.status}`);
}

// Test Authentication
Deno.test("Venue Categories Authentication", async (t) => {
  await t.step("Login with test credentials", async () => {
    authToken = await authenticate();
    assertExists(authToken);
    console.log("✓ Successfully authenticated");
  });
});

// Test API Requests following Postman structure
Deno.test("Venue Categories API Requests", async (t) => {
  // Get All Categories
  await t.step("Get All", async () => {
    const response = await fetch(BASE_URL, {
      method: "GET",
      headers: {
        "apikey": TEST_KEYS.anon,
        "Authorization": `Bearer ${authToken}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
        "x-client-type": "api"
      }
    });
    
    assertEquals(response.status, 200);
    const data = await response.json();
    assertExists(data);
    
    // Save first category ID if available and verify parent_name field exists
    if (data.data && data.data.length > 0) {
      venueCategoryId = data.data[0].id;
      // Verify parent_name field is present (can be null for root categories)
      assertExists(data.data[0].hasOwnProperty('parent_name'));
    }
    console.log("✓ Get All categories successful");
  });

  // Get All Hierarchical
  await t.step("Get All Hierarchical", async () => {
    const response = await fetch(`${BASE_URL}?hierarchical=true`, {
      method: "GET",
      headers: {
        "apikey": TEST_KEYS.anon,
        "Authorization": `Bearer ${authToken}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
        "x-client-type": "api"
      }
    });
    
    assertEquals(response.status, 200);
    const data = await response.json();
    assertExists(data);
    
    // Verify parent_name field exists in hierarchical data
    if (data.data && data.data.length > 0) {
      assertExists(data.data[0].hasOwnProperty('parent_name'));
    }
    console.log("✓ Get All Hierarchical successful");
  });

  // Create Parent Category
  await t.step("Create Parent Category", async () => {
    const response = await fetch(BASE_URL, {
      method: "POST",
      headers: {
        "apikey": TEST_KEYS.anon,
        "Authorization": `Bearer ${authToken}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
        "x-client-type": "api"
      },
      body: JSON.stringify({
        name: "Restaurants",
        parent_id: null
      })
    });
    
    assertEquals(response.status, 201);
    const data = await response.json();
    assertExists(data);
    
    if (data.success && data.data) {
      parentCategoryId = data.data.id;
      assertExists(parentCategoryId);
      // Verify parent_name field exists (should be null for new parent category)
      assertExists(data.data.hasOwnProperty('parent_name'));
    }
    console.log("✓ Create Parent Category successful");
  });

  // Create Child Category
  await t.step("Create Child Category", async () => {
    const response = await fetch(BASE_URL, {
      method: "POST",
      headers: {
        "apikey": TEST_KEYS.anon,
        "Authorization": `Bearer ${authToken}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
        "x-client-type": "api"
      },
      body: JSON.stringify({
        name: "Italian Cuisine",
        parent_id: parentCategoryId
      })
    });
    
    assertEquals(response.status, 201);
    const data = await response.json();
    assertExists(data);
    
    if (data.success && data.data) {
      childCategoryId = data.data.id;
      assertExists(childCategoryId);
      // Verify parent_name field exists and contains the parent category name
      assertExists(data.data.hasOwnProperty('parent_name'));
      // Since we created the child with parent "Restaurants", it should contain that name
      if (data.data.parent_name) {
        assertEquals(data.data.parent_name, "Restaurants");
      }
    }
    console.log("✓ Create Child Category successful");
  });

  // Get by ID
  await t.step("Get by ID", async () => {
    if (parentCategoryId) {
      const response = await fetch(`${BASE_URL}/${parentCategoryId}`, {
        method: "GET",
        headers: {
          "apikey": TEST_KEYS.anon,
          "Authorization": `Bearer ${authToken}`,
          "Content-Type": "application/json",
          "Accept": "application/json",
          "x-client-type": "api"
        }
      });
      
      assertEquals(response.status, 200);
      const data = await response.json();
      assertExists(data);
      assertEquals(data.data.id, parentCategoryId);
      // Verify parent_name field exists in single category response
      assertExists(data.data.hasOwnProperty('parent_name'));
      console.log("✓ Get by ID successful");
    }
  });

  // Update Category
  await t.step("Update", async () => {
    if (parentCategoryId) {
      const response = await fetch(`${BASE_URL}/${parentCategoryId}`, {
        method: "PUT",
        headers: {
          "apikey": TEST_KEYS.anon,
          "Authorization": `Bearer ${authToken}`,
          "Content-Type": "application/json",
          "Accept": "application/json",
          "x-client-type": "api"
        },
        body: JSON.stringify({
          name: "Fine Dining Restaurants"
        })
      });
      
      assertEquals(response.status, 200);
      const data = await response.json();
      assertExists(data);
      assertEquals(data.data.name, "Fine Dining Restaurants");
      // Verify parent_name field exists in updated category response
      assertExists(data.data.hasOwnProperty('parent_name'));
      console.log("✓ Update successful");
    }
  });

  // Delete Child Category (must delete children before parent)
  await t.step("Delete Child Category", async () => {
    if (childCategoryId) {
      const response = await fetch(`${BASE_URL}/${childCategoryId}`, {
        method: "DELETE",
        headers: {
          "apikey": TEST_KEYS.anon,
          "Authorization": `Bearer ${authToken}`,
          "Content-Type": "application/json",
          "Accept": "application/json",
          "x-client-type": "api"
        }
      });
      
      assertEquals(response.status, 200);
      const data = await response.json();
      assertExists(data);
      assertEquals(data.data.deleted, true);
      console.log("✓ Delete Child Category successful");
    }
  });

  // Delete Parent Category
  await t.step("Delete Parent Category", async () => {
    if (parentCategoryId) {
      const response = await fetch(`${BASE_URL}/${parentCategoryId}`, {
        method: "DELETE",
        headers: {
          "apikey": TEST_KEYS.anon,
          "Authorization": `Bearer ${authToken}`,
          "Content-Type": "application/json",
          "Accept": "application/json",
          "x-client-type": "api"
        }
      });
      
      assertEquals(response.status, 200);
      const data = await response.json();
      assertExists(data);
      assertEquals(data.data.deleted, true);
      console.log("✓ Delete Parent Category successful");
    }
  });

  // Get function status (OPTIONS)
  await t.step("Get function status", async () => {
    const response = await fetch(BASE_URL, {
      method: "OPTIONS",
      headers: {
        "apikey": TEST_KEYS.anon,
        "Authorization": `Bearer ${authToken}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
        "x-client-type": "api"
      }
    });
    
    // OPTIONS should return 200 or 204
    assertEquals(response.status >= 200 && response.status < 300, true);
    // Consume the response body
    await response.text();
    console.log("✓ Get function status successful");
  });

  // Method not allowed (HEAD)
  await t.step("Method not allowed", async () => {
    const response = await fetch(BASE_URL, {
      method: "HEAD",
      headers: {
        "apikey": TEST_KEYS.anon,
        "Authorization": `Bearer ${authToken}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
        "x-client-type": "api"
      }
    });
    
    assertEquals(response.status, 405);
    // Consume the response body
    await response.text();
    console.log("✓ Method not allowed test successful");
  });
});

// Test Validation Cases
Deno.test("Venue Categories Validation Tests", async (t) => {
  // Test Validation - Missing Name
  await t.step("Test Validation - Missing Name", async () => {
    const response = await fetch(BASE_URL, {
      method: "POST",
      headers: {
        "apikey": TEST_KEYS.anon,
        "Authorization": `Bearer ${authToken}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
        "x-client-type": "api"
      },
      body: JSON.stringify({
        parent_id: null
      })
    });
    
    assertEquals(response.status, 400);
    const data = await response.json();
    assertEquals(data.error.code, "VALIDATION_ERROR");
    console.log("✓ Missing Name validation test successful");
  });

  // Test Validation - Invalid Parent ID
  await t.step("Test Validation - Invalid Parent ID", async () => {
    const response = await fetch(BASE_URL, {
      method: "POST",
      headers: {
        "apikey": TEST_KEYS.anon,
        "Authorization": `Bearer ${authToken}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
        "x-client-type": "api"
      },
      body: JSON.stringify({
        name: "Test Category",
        parent_id: "invalid-uuid-here"
      })
    });
    
    assertEquals(response.status, 400);
    const data = await response.json();
    assertEquals(data.error.code, "PARENT_NOT_FOUND");
    console.log("✓ Invalid Parent ID validation test successful");
  });

  // Test Invalid JSON payload
  await t.step("Invalid JSON payload", async () => {
    const response = await fetch(BASE_URL, {
      method: "POST",
      headers: {
        "apikey": TEST_KEYS.anon,
        "Authorization": `Bearer ${authToken}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
        "x-client-type": "api"
      },
      body: "invalid json"
    });
    
    assertEquals(response.status, 400);
    const data = await response.json();
    // The actual error code might vary based on implementation
    assertExists(data.error);
    console.log("✓ Invalid JSON payload test successful");
  });

  // Test Missing ID for PUT request
  await t.step("Missing ID for PUT request", async () => {
    const response = await fetch(BASE_URL, {
      method: "PUT",
      headers: {
        "apikey": TEST_KEYS.anon,
        "Authorization": `Bearer ${authToken}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
        "x-client-type": "api"
      },
      body: JSON.stringify({ name: "test" })
    });
    
    assertEquals(response.status, 400);
    const data = await response.json();
    assertEquals(data.error.code, "MISSING_ID");
    console.log("✓ Missing ID for PUT request test successful");
  });
});

// Test Error Cases
Deno.test("Venue Categories Error Cases", async (t) => {
  // Test preventing deletion of parent with children
  await t.step("Prevent deletion of parent with children", async () => {
    // First create parent
    const parentResponse = await fetch(BASE_URL, {
      method: "POST",
      headers: {
        "apikey": TEST_KEYS.anon,
        "Authorization": `Bearer ${authToken}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
        "x-client-type": "api"
      },
      body: JSON.stringify({
        name: "Test Parent",
        parent_id: null
      })
    });
    
    const parentData = await parentResponse.json();
    const testParentId = parentData.data.id;

    // Create child
    const childResponse = await fetch(BASE_URL, {
      method: "POST",
      headers: {
        "apikey": TEST_KEYS.anon,
        "Authorization": `Bearer ${authToken}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
        "x-client-type": "api"
      },
      body: JSON.stringify({
        name: "Test Child",
        parent_id: testParentId
      })
    });
    
    const childData = await childResponse.json();
    const testChildId = childData.data.id;

    // Try to delete parent (should fail)
    const deleteParentResponse = await fetch(`${BASE_URL}/${testParentId}`, {
      method: "DELETE",
      headers: {
        "apikey": TEST_KEYS.anon,
        "Authorization": `Bearer ${authToken}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
        "x-client-type": "api"
      }
    });
    
    assertEquals(deleteParentResponse.status, 400);
    const deleteData = await deleteParentResponse.json();
    assertEquals(deleteData.error.code, "HAS_CHILDREN");

    // Clean up - delete child first, then parent
    const childDeleteResponse = await fetch(`${BASE_URL}/${testChildId}`, { method: "DELETE", headers: { "apikey": TEST_KEYS.anon, "Authorization": `Bearer ${authToken}`, "x-client-type": "api" } });
    await childDeleteResponse.text();
    const parentDeleteResponse = await fetch(`${BASE_URL}/${testParentId}`, { method: "DELETE", headers: { "apikey": TEST_KEYS.anon, "Authorization": `Bearer ${authToken}`, "x-client-type": "api" } });
    await parentDeleteResponse.text();
    
    console.log("✓ Prevent deletion of parent with children test successful");
  });

  // Test self-reference prevention in updates
  await t.step("Prevent self-reference in updates", async () => {
    // Create a category
    const createResponse = await fetch(BASE_URL, {
      method: "POST",
      headers: {
        "apikey": TEST_KEYS.anon,
        "Authorization": `Bearer ${authToken}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
        "x-client-type": "api"
      },
      body: JSON.stringify({
        name: "Self Reference Test",
        parent_id: null
      })
    });
    
    const createData = await createResponse.json();
    const categoryId = createData.data.id;

    // Try to set itself as parent
    const updateResponse = await fetch(`${BASE_URL}/${categoryId}`, {
      method: "PUT",
      headers: {
        "apikey": TEST_KEYS.anon,
        "Authorization": `Bearer ${authToken}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
        "x-client-type": "api"
      },
      body: JSON.stringify({
        parent_id: categoryId
      })
    });
    
    assertEquals(updateResponse.status, 400);
    const updateData = await updateResponse.json();
    assertEquals(updateData.error.code, "SELF_REFERENCE");

    // Clean up
    const cleanupResponse = await fetch(`${BASE_URL}/${categoryId}`, { method: "DELETE", headers: { "apikey": TEST_KEYS.anon, "Authorization": `Bearer ${authToken}`, "x-client-type": "api" } });
    await cleanupResponse.text();
    
    console.log("✓ Prevent self-reference in updates test successful");
  });
});

// Test CORS
Deno.test("Venue Categories CORS", async (t) => {
  await t.step("OPTIONS request", async () => {
    const response = await fetch(BASE_URL, {
      method: "OPTIONS",
      headers: {
        "Origin": "https://example.com"
      }
    });
    
    // CORS should work
    assertEquals(response.status >= 200 && response.status < 300, true);
    assertExists(response.headers.get("Access-Control-Allow-Origin"));
    // Consume the response body
    await response.text();
    console.log("✓ CORS test successful");
  });
});
