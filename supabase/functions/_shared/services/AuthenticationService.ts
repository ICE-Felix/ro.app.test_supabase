import { SupabaseClient } from '../supabase/supabaseClient.ts';
import { SupabasePOSClient } from '../supabase/SupabasePOSClient.ts';
import { SupabaseAnonClient } from '../supabase/supabaseAnonClient.ts';
import { SupabaseAdmin } from '../supabase/supabaseAdmin.ts';

export class AuthenticationService {
  /**
   * Determines authentication type and returns appropriate Supabase client
   */
  public static async authenticate(req: Request): Promise<{
    client: SupabaseClient;
    type: 'pos' | 'user' | 'anon';
    requestType: 'web' | 'api';
    body?: unknown;
  }> {
    // Determine request type (web or api)
    const requestType = this.determineRequestType(req);

    // Check for POS-specific headers
    const hasPosId = req.headers.has('pos-id') || req.headers.has('device-id');
    const hasPosAuth = req.headers.has('pos-authorization');
    const hasSignature = req.headers.has('signature');

    // Check for user authentication header
    const hasUserAuth = req.headers.has('Authorization');

    // POS Authentication
    if (hasPosId && hasPosAuth && hasSignature) {
      try {
        // Use POS authentication flow
        const { client } = await SupabasePOSClient.initialize(req);
        return { client, type: 'pos', requestType };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`POS Authentication failed: ${errorMessage}`);
      }
    }

    // User Authentication
    if (hasUserAuth) {
      try {
        // Use authenticated user flow
        const client = SupabaseClient.initialize(req);
        return { client, type: 'user', requestType };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`User Authentication failed: ${errorMessage}`);
      }
    }

    // Anonymous Authentication
    try {
      // Use anonymous client when no auth headers are present
      const client = SupabaseAnonClient.initialize();
      return { client, type: 'anon', requestType };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Anonymous Authentication failed: ${errorMessage}`);
    }
  }

  /**
   * Determines if the request is a web request or API request
   */
  private static determineRequestType(req: Request): 'web' | 'api' {
    const acceptHeader = req.headers.get('Accept') || '';
    const contentType = req.headers.get('Content-Type') || '';
    
    // Check if it's a web request
    const isWebRequest = 
      acceptHeader.includes('text/html') || 
      contentType.includes('application/x-www-form-urlencoded') ||
      contentType.includes('multipart/form-data');

    return isWebRequest ? 'web' : 'api';
  }

  /**
   * Validates if the authenticated user has admin privileges
   */
  public static async validateAdminAccess(client: SupabaseClient): Promise<boolean> {
    try {
      const adminClient = SupabaseAdmin.initialize();
      const { data: { user } } = await client.auth.getUser();
      
      if (!user?.id) return false;

      const { data: profile } = await adminClient
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      return profile?.role === 'admin';
    } catch {
      return false;
    }
  }
} 