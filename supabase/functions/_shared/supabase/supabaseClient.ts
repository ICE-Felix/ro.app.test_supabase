import { SupabaseClient as GlobalSupabaseClient, createClient } from 'https://esm.sh/@supabase/supabase-js@2.42.4';

export class SupabaseClient extends GlobalSupabaseClient {
  static initialize(req: Request): GlobalSupabaseClient<any, "public", any> {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    if (!supabaseUrl) {
      throw new Error('Missing SUPABASE_URL environment variable');
    }

    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    if (!supabaseAnonKey) {
      throw new Error('Missing SUPABASE_ANON_KEY environment variable');
    }

    const authorizationHeader = req.headers.get('Authorization');
    if (!authorizationHeader) {
      throw new Error('Missing Authorization header');
    }

    return createClient<any, "public", any>(
      supabaseUrl,
      supabaseAnonKey,
      { global: { headers: { Authorization: authorizationHeader } } }
    );
  }
}