import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export class SupabaseWallet {
  static async get(supabaseClient, role: string) {
    const { user, error } = await supabaseClient.auth.getUser();

    if (error) {
      throw error;
    }

    const { data: isPos, error: rpcError } = await supabaseClient
      .rpc("has_user_role", { required_role: "pos" });

    if (rpcError) {
      throw rpcError;
    }

    if (!isPos) {
      throw new Error(
        "This account has no rights to access the wallet this way",
      );
    }

    return { user, roles: isPos };
  }
}
