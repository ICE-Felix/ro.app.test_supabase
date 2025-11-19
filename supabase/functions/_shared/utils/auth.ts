import { SupabaseClient } from "@supabase/supabase-js";

export class AuthUtils {
    // Add action mapping
    private static actionMap = {
      'me': 'me',
      'c': 'insert',
      'r': 'read',
      'u': 'update',
      'd': 'delete'
    } as const;

  /**
   * Check if user has permission for a specific action on a table
   * @param supabaseClient - Initialized Supabase client
   * @param action - Action type ('c' - create, 'r' - read, 'u' - update, 'd' - delete)
   * @param tableName - Name of the table to check permissions for
   * @returns boolean indicating if user has permission
   */
  static async checkPermission(
    supabaseClient: SupabaseClient,
    action: 'me' | 'c' | 'r' | 'u' | 'd',
    tableName: string
  ): Promise<boolean> {
    try {
      const { data: permission, error } = await supabaseClient.rpc("check_user_permission_with_claims", {
          "action_required": action,
          "table_name": tableName,
        });

      if (error) {
        console.error(`Permission check error for ${tableName}:`, error);
        throw new Error(`Permission check failed: ${error.message}`);
      }

      if (!permission) {
        console.error(`User lacks permission for ${this.actionMap[action]} on ${tableName}`);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Permission check error:", error);
      throw error;
    }
  }

  /**
   * Verify if user has required permission and throw error if not
   */
  static async verifyPermission(
    supabaseClient: SupabaseClient,
    action: 'me' |'c' | 'r' | 'u' | 'd',
    tableName: string
  ): Promise<void> {
    const hasPermission = await this.checkPermission(supabaseClient, action, tableName);
    if (!hasPermission) {
      throw new Error(`Unauthorized: Insufficient permissions for ${this.actionMap[action]} on ${tableName}`);
    }
  }
} 