import { SupabaseAdmin } from "../supabaseAdmin.ts";
import { latLngToCell } from "npm:h3-js";

const H3_RES = 9; // Resolution 9 ≈ city block cells

/**
 * Update H3 cells for all existing venues
 */
export async function updateAllVenuesH3(): Promise<void> {
    const client = await SupabaseAdmin.initialize();

    try {
        // Get all venues with coordinates but no H3 cell
        const { data: venues, error: fetchError } = await client
            .from("venues")
            .select("id, location_latitude, location_longitude")
            .not("location_latitude", "is", null)
            .not("location_longitude", "is", null)
            .is("h3", null)
            .is("deleted_at", null);

        if (fetchError) {
            console.error("Error fetching venues:", fetchError);
            return;
        }

        if (!venues || venues.length === 0) {
            console.log("No venues need H3 cell updates");
            return;
        }

        console.log(`Updating H3 cells for ${venues.length} venues...`);

        // Update venues in batches
        const batchSize = 100;
        for (let i = 0; i < venues.length; i += batchSize) {
            const batch = venues.slice(i, i + batchSize);

            const updates = batch.map(
                (
                    venue: {
                        id: string;
                        location_latitude: string;
                        location_longitude: string;
                    },
                ) => {
                    const h3Cell = latLngToCell(
                        parseFloat(venue.location_latitude),
                        parseFloat(venue.location_longitude),
                        H3_RES,
                    );

                    return {
                        id: venue.id,
                        h3: h3Cell,
                    };
                },
            );

            // Update batch
            const { error: updateError } = await client
                .from("venues")
                .upsert(updates);

            if (updateError) {
                console.error(
                    `Error updating batch ${i}-${i + batchSize}:`,
                    updateError,
                );
            } else {
                console.log(`Updated batch ${i}-${i + batchSize}`);
            }
        }

        console.log("H3 cell update completed");
    } catch (error) {
        console.error("Error in updateAllVenuesH3:", error);
    }
}

/**
 * Update H3 cell for a single venue
 */
export async function updateVenueH3(
    venueId: string,
    latitude: number,
    longitude: number,
): Promise<void> {
    const client = await SupabaseAdmin.initialize();

    try {
        const h3Cell = latLngToCell(latitude, longitude, H3_RES);

        const { error } = await client
            .from("venues")
            .update({ h3: h3Cell })
            .eq("id", venueId);

        if (error) {
            console.error("Error updating venue H3:", error);
        }
    } catch (error) {
        console.error("Error in updateVenueH3:", error);
    }
}
