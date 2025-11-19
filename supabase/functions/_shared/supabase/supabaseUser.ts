import { SupabaseAdmin } from "./supabaseAdmin.ts";
import { SupabaseClient } from "./supabaseClient.ts";

export class SupabaseUser {
  public static async checkUserPermission(
    action_required: string,
    table_name: string,
    supabaseClient: SupabaseClient,
  ): Promise<boolean> {
    try {
      const { data, error } = await supabaseClient.rpc(
        "check_user_permission_with_claims",
        {
          action_required,
          table_name,
        },
      );
      if (error || !data) {
        console.error(
          `Error checking user permission for ${table_name}:`,
          error,
        );
        throw new Error(`Error checking user permission for ${table_name}`);
      }
      throw new Error("User does not have permission");
    } catch (error) {
      console.error("There was an error checking user permission:", error);
      throw error;
    }
  }

  static async get(supabaseClient: SupabaseClient) {
    const { data, error } = await supabaseClient.auth.getUser();

    if (error) {
      throw error;
    }

    return data.user;
  }

  static async getAll(supabaseAdminClient: SupabaseAdmin) {
    try {
      const { data: { users }, error } = await supabaseAdminClient.auth.admin
        .listUsers();
      if (error) {
        console.error(error);
        throw error;
      }
      return users;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  static async create(
    supabaseAdminClient: SupabaseAdmin,
    email: string,
    password: string,
    role: string,
    name: string | null,
    autoconfirm: boolean,
  ) {
    try {
      const { data: { user }, error } = await supabaseAdminClient.auth.admin
        .createUser({
          email,
          password,
          app_metadata: {
            claims_admin: false,
            provider: "email",
            providers: [
              "email",
            ],
            "username": name,
            "userrole": role,
          },
          email_confirm: autoconfirm ? autoconfirm : undefined,
        });
      if (error) {
        console.error(error);
        throw error;
      }
      return user;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  static async update(
    supabaseAdminClient: SupabaseAdmin,
    id: string,
    email: string,
    password: string,
    role: string,
    name: string | null,
    autoconfirm: boolean,
  ) {
    try {
      const { data: user, error } = await supabaseAdminClient.auth.admin
        .updateUserById(
          id,
          {
            email,
            password,
            app_metadata: {
              claims_admin: false,
              provider: "email",
              providers: [
                "email",
              ],
              "username": name ? name : undefined,
              "userrole": role,
            },
            email_confirm: autoconfirm ? autoconfirm : undefined,
          },
        );

      if (error) {
        console.error(error);
        throw error;
      }
      return user;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  static async delete(
    supabaseAdminClient: SupabaseAdmin,
    id: string,
  ) {
    try {
      const { data, error } = await supabaseAdminClient.auth.admin.deleteUser(
        id,
      );
      if (error) {
        console.error(error);
        throw error;
      }
      return "success";
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}
