/**
 * Abstract controller class that defines the standard interface
 * for all API and Web controllers.
 */
export abstract class Controller<T = unknown> {
  /**
   * Log controller actions with consistent formatting
   */
  protected logAction(action: string, data?: unknown): void {
    console.log(`[${action}]`, data || '');
  }

  /**
   * Get a resource or list of resources
   */
  abstract get(id?: string, req?: Request): Promise<Response>;

  /**
   * Create a new resource
   */
  abstract post(data: T, req?: Request): Promise<Response>;
  
  /**
   * Update an existing resource
   */
  abstract put(id: string, data: T, req?: Request): Promise<Response>;
  
  /**
   * Delete an existing resource
   */
  abstract delete(id: string, req?: Request): Promise<Response>;
} 