import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { updateAllVenuesH3 } from "../_shared/supabase/venues/updateVenuesH3.ts";

serve(async (req) => {
    if (req.method !== "POST") {
        return new Response("Method not allowed", { status: 405 });
    }

    try {
        console.log("Starting H3 update for all venues...");
        await updateAllVenuesH3();

        return new Response(
            JSON.stringify({
                success: true,
                message: "H3 update completed successfully",
            }),
            {
                status: 200,
                headers: { "Content-Type": "application/json" },
            },
        );
    } catch (error) {
        console.error("Error in H3 update:", error);
        return new Response(
            JSON.stringify({
                success: false,
                error: error instanceof Error ? error.message : String(error),
            }),
            {
                status: 500,
                headers: { "Content-Type": "application/json" },
            },
        );
    }
});
