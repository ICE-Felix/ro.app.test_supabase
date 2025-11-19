import { corsHeaders } from "./cors.ts";

class SupabaseError {
    public static errorResponse(error: string): Response {
        console.error(error);
        return new Response(
          JSON.stringify({ error: error}),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 403,
          },
        );
      }
    
      public static  invalidParametersResponse(): Response {
        console.error("Invalid parameters");
        return new Response(JSON.stringify({ error: "Invalid parameters" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }
}

export { SupabaseError };