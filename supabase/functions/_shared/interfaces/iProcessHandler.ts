import { Field } from "../supabase/models/productDesign.ts";
import { SupabaseClient } from "../supabase/supabaseClient.ts";

interface IProcessHandler {
    req: Request;
    supabaseClient: SupabaseClient;
    checkoutReady: boolean;
    cartId: string | undefined;
  
    handleRequest(): Promise<Response>;
  }

  export default IProcessHandler;