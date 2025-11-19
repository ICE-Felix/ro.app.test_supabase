import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.42.4';
import { SupabaseClient } from './supabaseClient.ts';

export class SupabaseAdmin extends SupabaseClient {
  static override initialize() {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    if (!supabaseUrl) {
      throw new Error('Missing SUPABASE_URL environment variable');
    }

    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseServiceRoleKey) {
      throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
    }

    return createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }
}