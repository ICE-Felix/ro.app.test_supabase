import {
    updateAllVenuesH3,
    updateVenueH3,
} from "./supabase/functions/_shared/supabase/venues/updateVenuesH3.ts";

async function testH3Update() {
    console.log("Starting H3 update test...");

    try {
        // Update all venues with H3 cells
        await updateAllVenuesH3();
        console.log("✅ H3 update completed successfully!");
    } catch (error) {
        console.error("❌ Error during H3 update:", error);
    }
}

// Run the test
testH3Update();
