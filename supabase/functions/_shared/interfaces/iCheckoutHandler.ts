import { Field, ProductDesign } from "../supabase/models/productDesign.ts";
import { SupabaseClient } from "../supabase/supabaseClient.ts";

interface ICheckoutHandler {
    req: Request;
    supabaseClient: SupabaseClient;
    payReady: boolean;
    productDesign: ProductDesign[];
    fieldsToProcess: Field[];
    fieldsToReturn: Field[];
    cartId: string | undefined;
  
    handleRequest(): Promise<Response>;
  }

  export default ICheckoutHandler;