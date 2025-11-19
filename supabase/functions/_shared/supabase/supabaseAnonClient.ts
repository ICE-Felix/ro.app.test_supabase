import { SupabaseClient as GlobalSupabaseClient, createClient } from 'https://esm.sh/@supabase/supabase-js@2.42.4';

export class SupabaseAnonClient extends GlobalSupabaseClient {
  static initialize(): GlobalSupabaseClient<any, "public", any> {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    if (!supabaseUrl) {
      throw new Error('Missing SUPABASE_URL environment variable');
    }

    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    if (!supabaseAnonKey) {
      throw new Error('Missing SUPABASE_ANON_KEY environment variable');
    }

    return createClient<any, "public", any>(
      supabaseUrl,
      supabaseAnonKey,
      { 
        auth: {
          persistSession: false
        }
      }
    );
  }
} 