import { ResponseService } from "../../_shared/services/ResponseService.ts";
import { ResponseType } from "../../_shared/services/ErrorsService.ts";
import { Controller } from "../../_shared/controllers/Controller.ts";
import { AuthenticationService } from "../../_shared/services/AuthenticationService.ts";
import { SupabaseAdmin } from "../../_shared/supabase/supabaseAdmin.ts";

// Define user data interface matching auth.users table
interface UserData {
  email: string;
  raw_app_meta_data?: {
    provider?: string;
    userrole?: string;
    last_name?: string;
    providers?: string[];
    first_name?: string;
    [key: string]: unknown;
  };
  raw_user_meta_data?: {
    [key: string]: unknown;
  };
  email_confirmed_at?: string;
  phone?: string;
  phone_confirmed_at?: string;
  banned_until?: string;
  [key: string]: unknown;
}

// Define interface for user response data
interface UserResponseData {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  userrole?: string;
  email_confirmed_at?: string;
  phone?: string;
  phone_confirmed_at?: string;
  created_at?: string;
  updated_at?: string;
  last_sign_in_at?: string;
  banned_until?: string;
}

type UserRole = 'admin' | 'user' | 'moderator';

export class UsersApiController extends Controller<UserData> {
  // Define valid user roles
  private readonly VALID_USER_ROLES = ['admin', 'user', 'moderator'] as const;

  // Email validation helper
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Check if user has admin privileges
  private async isAdminUser(req: Request): Promise<{ isAdmin: boolean; currentUserId?: string }> {
    try {
      const { client } = await AuthenticationService.authenticate(req);
      const { data: { user } } = await client.auth.getUser();
      
      if (!user?.id) {
        return { isAdmin: false };
      }

      // Use admin client to get user's raw_app_meta_data
      const adminClient = SupabaseAdmin.initialize();
      const { data: authUser, error } = await adminClient.auth.admin.getUserById(user.id);
      
      if (error || !authUser?.user) {
        return { isAdmin: false, currentUserId: user.id };
      }

      const userrole = authUser.user.app_metadata?.userrole;
      return { 
        isAdmin: userrole === 'admin', 
        currentUserId: user.id 
      };
    } catch (error) {
      console.error('Error checking admin status:', error);
      return { isAdmin: false };
    }
  }

  // Validation method for user data
  private validateUserData(
    data: UserData,
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate required fields
    if (
      !data.email || typeof data.email !== "string" ||
      data.email.trim() === ""
    ) {
      errors.push("email is required and must be a non-empty string");
    } else if (!this.isValidEmail(data.email.trim())) {
      errors.push("email must be a valid email address");
    }

    // Validate raw_app_meta_data if provided
    if (data.raw_app_meta_data) {
      if (typeof data.raw_app_meta_data !== 'object') {
        errors.push("raw_app_meta_data must be an object");
      } else {
        // Validate userrole if provided
        if (data.raw_app_meta_data.userrole) {
          if (typeof data.raw_app_meta_data.userrole !== 'string') {
            errors.push("userrole must be a string");
          } else if (!this.VALID_USER_ROLES.includes(data.raw_app_meta_data.userrole as UserRole)) {
            errors.push(`userrole must be one of: ${this.VALID_USER_ROLES.join(', ')}`);
          }
        }
        
        // Validate first_name if provided
        if (data.raw_app_meta_data.first_name && 
            typeof data.raw_app_meta_data.first_name !== 'string') {
          errors.push("first_name must be a string");
        }
        
        // Validate last_name if provided
        if (data.raw_app_meta_data.last_name && 
            typeof data.raw_app_meta_data.last_name !== 'string') {
          errors.push("last_name must be a string");
        }
      }
    }

    // Validate phone if provided
    if (data.phone && typeof data.phone !== 'string') {
      errors.push("phone must be a string");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private transformUserData(user: Record<string, unknown>): UserResponseData {
    const appMetadata = user.app_metadata as Record<string, unknown> | undefined;
    return {
      id: user.id as string,
      email: user.email as string,
      first_name: appMetadata?.first_name as string | undefined,
      last_name: appMetadata?.last_name as string | undefined,
      userrole: appMetadata?.userrole as string | undefined,
      email_confirmed_at: user.email_confirmed_at as string | undefined,
      phone: user.phone as string | undefined,
      phone_confirmed_at: user.phone_confirmed_at as string | undefined,
      created_at: user.created_at as string | undefined,
      updated_at: user.updated_at as string | undefined,
      last_sign_in_at: user.last_sign_in_at as string | undefined,
      banned_until: user.banned_until as string | undefined,
    };
  }

  // Core API methods
  override async get(id?: string, _req?: Request): Promise<Response> {
    this.logAction("UsersAPI GET", { id });

    const { isAdmin, currentUserId } = await this.isAdminUser(_req!);
    const adminClient = SupabaseAdmin.initialize();

    if (id) {
      console.log(`API: Fetching user with id: ${id}`);
      
      // Non-admin users can only fetch their own data
      if (!isAdmin && id !== currentUserId) {
        return ResponseService.error(
          "Unauthorized: You can only access your own user data",
          "UNAUTHORIZED",
          403,
          undefined,
          ResponseType.API,
        );
      }

      const { data: authUser, error } = await adminClient.auth.admin.getUserById(id);

      if (error) {
        return ResponseService.error(
          "Error fetching user",
          error as unknown as string,
          400,
          error as unknown as Record<string, unknown>,
          ResponseType.API,
        );
      }

      if (!authUser?.user) {
        return ResponseService.error(
          "User not found",
          "USER_NOT_FOUND",
          404,
          undefined,
          ResponseType.API,
        );
      }

      const userData = this.transformUserData(authUser.user as unknown as Record<string, unknown>);
      return ResponseService.success(
        userData,
        200,
        undefined,
        ResponseType.API,
      );
    }

    // Only admin users can list all users
    if (!isAdmin) {
      return ResponseService.error(
        "Unauthorized: Only admin users can list all users",
        "UNAUTHORIZED",
        403,
        undefined,
        ResponseType.API,
      );
    }

    console.log("API: Fetching all users");
    const { data: authUsers, error } = await adminClient.auth.admin.listUsers();

    if (error) {
      return ResponseService.error(
        "Error fetching users",
        error as unknown as string,
        400,
        error as unknown as Record<string, unknown>,
        ResponseType.API,
      );
    }

    const usersData = authUsers.users.map(user => this.transformUserData(user as unknown as Record<string, unknown>));

    return ResponseService.success(
      usersData,
      200,
      undefined,
      ResponseType.API,
    );
  }

  override async post(data: UserData, _req?: Request): Promise<Response> {
    this.logAction("UsersAPI POST", { data });

    // Only admin users can create users
    const { isAdmin } = await this.isAdminUser(_req!);
    if (!isAdmin) {
      return ResponseService.error(
        "Unauthorized: Only admin users can create users",
        "UNAUTHORIZED",
        403,
        undefined,
        ResponseType.API,
      );
    }

    // Validate user data
    const validation = this.validateUserData(data);
    if (!validation.isValid) {
      return Promise.resolve(ResponseService.error(
        "Validation failed",
        "VALIDATION_ERROR",
        400,
        { errors: validation.errors },
        ResponseType.API,
      ));
    }

    const adminClient = SupabaseAdmin.initialize();

    // Prepare user data for creation
    const userData: Record<string, unknown> = {
      email: data.email.trim(),
      password: Math.random().toString(36).slice(-8), // Generate temporary password
      email_confirm: true, // Auto-confirm email for admin-created users
    };

    // Add metadata if provided
    const userOptions: Record<string, unknown> = {};
    if (data.raw_app_meta_data) {
      userOptions.app_metadata = data.raw_app_meta_data;
    }
    if (data.raw_user_meta_data) {
      userOptions.user_metadata = data.raw_user_meta_data;
    }
    if (data.phone) {
      userData.phone = data.phone;
    }

    console.log("API: Creating new user", { email: userData.email });

    const { data: authUser, error } = await adminClient.auth.admin.createUser({
      ...userData,
      ...userOptions
    });

    if (error) {
      return ResponseService.error(
        "Error creating user",
        error as unknown as string,
        400,
        error as unknown as Record<string, unknown>,
        ResponseType.API,
      );
    }

    if (!authUser?.user) {
      return ResponseService.error(
        "User creation failed",
        "CREATE_FAILED",
        400,
        undefined,
        ResponseType.API,
      );
    }

    const responseData = this.transformUserData(authUser.user as unknown as Record<string, unknown>);
    return ResponseService.created(
      responseData,
      authUser.user.id,
      ResponseType.API,
    );
  }

  override async put(
    id: string,
    data: Partial<UserData>,
    _req?: Request,
  ): Promise<Response> {
    this.logAction("UsersAPI PUT", { id, data });

    // Check permissions
    const { isAdmin, currentUserId } = await this.isAdminUser(_req!);
    
    // FIRST: Check if user is trying to update user role - ONLY ADMIN CAN DO THIS
    if (data.raw_app_meta_data?.userrole !== undefined) {
      if (!isAdmin) {
        return ResponseService.error(
          "Access denied: Only administrators can assign or modify user roles.",
          "ROLE_ASSIGNMENT_FORBIDDEN",
          403,
          { 
            action: "userrole_update",
            requiredRole: "admin"
          },
          ResponseType.API,
        );
      }
      
      // Validate the user role
      if (!this.VALID_USER_ROLES.includes(data.raw_app_meta_data.userrole as UserRole)) {
        return ResponseService.error(
          `Invalid user role specified. Allowed roles are: ${this.VALID_USER_ROLES.join(', ')}`,
          "INVALID_USER_ROLE",
          400,
          { 
            providedRole: data.raw_app_meta_data.userrole,
            validRoles: this.VALID_USER_ROLES 
          },
          ResponseType.API,
        );
      }
      
      // Prevent admin from accidentally removing their own admin role
      if (id === currentUserId && data.raw_app_meta_data.userrole !== 'admin') {
        return ResponseService.error(
          "Warning: You cannot remove your own admin privileges.",
          "SELF_ADMIN_REMOVAL_DENIED",
          403,
          { 
            message: "To change your own role, another admin must perform this action"
          },
          ResponseType.API,
        );
      }
      
      console.log(`API: Admin ${currentUserId} setting user role to '${data.raw_app_meta_data.userrole}' for user ${id}`);
    }

    // SECOND: Check if user can access this user's data (after role check)
    // Non-admin users can only update their own data, and with limited fields
    if (!isAdmin && id !== currentUserId) {
      return ResponseService.error(
        "Unauthorized: You can only update your own user data",
        "UNAUTHORIZED",
        403,
        undefined,
        ResponseType.API,
      );
    }

    // Check if user is trying to reset password
    if (data.password !== undefined) {
      // Allow password change if user is admin OR updating their own password
      const canChangePassword = isAdmin || (id === currentUserId);
      
      if (!canChangePassword) {
        return ResponseService.error(
          "Unauthorized: You can only change your own password or admin can reset any password",
          "PASSWORD_CHANGE_DENIED",
          403,
          undefined,
          ResponseType.API,
        );
      }
      
      // Validate password if provided
      if (typeof data.password !== 'string' || data.password.length < 6) {
        return ResponseService.error(
          "Password must be a string with at least 6 characters",
          "INVALID_PASSWORD",
          400,
          undefined,
          ResponseType.API,
        );
      }
      
      if (isAdmin && id !== currentUserId) {
        console.log(`API: Admin ${currentUserId} resetting password for user ${id}`);
      } else {
        console.log(`API: User ${currentUserId} changing their own password`);
      }
    }

    // For non-admin users, restrict what they can update (but allow password change)
    // Also ensure they cannot update any app metadata (including userrole)
    if (!isAdmin) {
      const allowedFields = ['raw_user_meta_data', 'phone', 'password'];
      const providedFields = Object.keys(data);
      const invalidFields = providedFields.filter(field => !allowedFields.includes(field));
      
      // Special check for raw_app_meta_data to give clearer error
      if (data.raw_app_meta_data && !data.raw_app_meta_data.userrole) {
        return ResponseService.error(
          "Access denied: Only administrators can modify user profile information or system metadata.",
          "APP_METADATA_FORBIDDEN",
          403,
          { 
            restrictedField: "raw_app_meta_data",
            allowedFields: allowedFields
          },
          ResponseType.API,
        );
      }
      
      if (invalidFields.length > 0) {
        return ResponseService.error(
          `Unauthorized: You can only update these fields: ${allowedFields.join(', ')}`,
          "FIELD_ACCESS_DENIED",
          403,
          { 
            invalidFields,
            allowedFields 
          },
          ResponseType.API,
        );
      }
    }

    const adminClient = SupabaseAdmin.initialize();

    // Prepare update data
    const updateData: Record<string, unknown> = {};
    
    if (data.email && isAdmin) { // Only admin can update email
      updateData.email = data.email.trim();
    }
    
    if (data.password) { // Admin can reset any password, users can change their own
      const canChangePassword = isAdmin || (id === currentUserId);
      if (canChangePassword) {
        updateData.password = data.password;
        // Ensure user doesn't need to confirm email after password change
        updateData.email_confirm = true;
      }
    }
    
    if (data.phone !== undefined) {
      updateData.phone = data.phone;
    }
    
    if (data.raw_app_meta_data && isAdmin) { // Only admin can update app metadata (including user role)
      updateData.app_metadata = data.raw_app_meta_data;
    }
    
    if (data.raw_user_meta_data) {
      updateData.user_metadata = data.raw_user_meta_data;
    }

    if (data.banned_until !== undefined && isAdmin) { // Only admin can ban/unban
      updateData.ban_duration = data.banned_until ? 'indefinite' : 'none';
    }

    console.log(`API: Updating user with id: ${id}`, { 
      hasPassword: !!data.password,
      hasRoleUpdate: !!data.raw_app_meta_data?.userrole,
      isOwnUpdate: id === currentUserId,
      updateFields: Object.keys(updateData) 
    });

    const { data: authUser, error } = await adminClient.auth.admin.updateUserById(id, updateData);

    if (error) {
      console.error('User update error:', error);
      return ResponseService.error(
        "Error updating user",
        error as unknown as string,
        400,
        error as unknown as Record<string, unknown>,
        ResponseType.API,
      );
    }

    if (!authUser?.user) {
      return ResponseService.error(
        "User update failed",
        "UPDATE_FAILED",
        400,
        undefined,
        ResponseType.API,
      );
    }

    const responseData = this.transformUserData(authUser.user as unknown as Record<string, unknown>);
    
    // Add success messages
    const response: Record<string, unknown> = { ...responseData };
    const messages: string[] = [];
    
    if (data.password) {
      const isOwnPassword = id === currentUserId;
      response.passwordChanged = true;
      messages.push(isOwnPassword 
        ? "Your password has been changed successfully" 
        : "Password has been reset successfully by admin");
    }
    
    if (data.raw_app_meta_data?.userrole && isAdmin) {
      response.roleUpdated = true;
      messages.push(`User role has been updated to '${data.raw_app_meta_data.userrole}'`);
    }
    
    if (messages.length > 0) {
      response.message = messages.join('. ');
    }
    
    return ResponseService.success(
      response,
      200,
      undefined,
      ResponseType.API,
    );
  }

  override async delete(id: string, _req?: Request): Promise<Response> {
    this.logAction("UsersAPI DELETE", { id });

    // Only admin users can delete users
    const { isAdmin } = await this.isAdminUser(_req!);
    if (!isAdmin) {
      return ResponseService.error(
        "Unauthorized: Only admin users can delete users",
        "UNAUTHORIZED",
        403,
        undefined,
        ResponseType.API,
      );
    }

    const adminClient = SupabaseAdmin.initialize();

    console.log(`API: Deleting user with id: ${id}`);

    const { error } = await adminClient.auth.admin.deleteUser(id);

    if (error) {
      return ResponseService.error(
        "Error deleting user",
        error as unknown as string,
        400,
        error as unknown as Record<string, unknown>,
        ResponseType.API,
      );
    }

    return ResponseService.success(
      { deleted: true, id },
      200,
      undefined,
      ResponseType.API,
    );
  }

  // Dedicated password reset method
  async resetPassword(
    id: string,
    newPassword: string,
    _req?: Request,
  ): Promise<Response> {
    this.logAction("UsersAPI RESET_PASSWORD", { id });

    // Only admin users can reset passwords
    const { isAdmin, currentUserId } = await this.isAdminUser(_req!);
    if (!isAdmin) {
      return ResponseService.error(
        "Unauthorized: Only admin users can reset passwords",
        "PASSWORD_RESET_DENIED",
        403,
        undefined,
        ResponseType.API,
      );
    }

    // Validate password
    if (typeof newPassword !== 'string' || newPassword.length < 6) {
      return ResponseService.error(
        "Password must be a string with at least 6 characters",
        "INVALID_PASSWORD",
        400,
        undefined,
        ResponseType.API,
      );
    }

    const adminClient = SupabaseAdmin.initialize();

    console.log(`API: Admin ${currentUserId} resetting password for user ${id}`);

    const { data: authUser, error } = await adminClient.auth.admin.updateUserById(id, {
      password: newPassword,
      email_confirm: true, // Prevent email confirmation requirement
    });

    if (error) {
      console.error('Password reset error:', error);
      return ResponseService.error(
        "Error resetting password",
        error as unknown as string,
        400,
        error as unknown as Record<string, unknown>,
        ResponseType.API,
      );
    }

    if (!authUser?.user) {
      return ResponseService.error(
        "Password reset failed",
        "RESET_FAILED",
        400,
        undefined,
        ResponseType.API,
      );
    }

    console.log(`Password successfully reset for user ${id}`);

    return ResponseService.success(
      {
        success: true,
        message: "Password has been reset successfully",
        userId: id,
        resetAt: new Date().toISOString(),
      },
      200,
      undefined,
      ResponseType.API,
    );
  }
}
