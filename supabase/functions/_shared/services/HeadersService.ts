/**
 * Service for managing HTTP headers in Supabase Edge Functions.
 * This service provides standardized header configurations for different types of responses
 * including API responses, web responses, and CORS handling.
 */
export class HeadersService {
    /**
     * Common CORS headers used across all responses.
     * These headers enable cross-origin resource sharing and define allowed methods and headers.
     */
    private static readonly corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, device-id, signature, pos-authorization, pos-id',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
    };
  
    /**
     * Standard JSON content type header for API responses.
     */
    private static readonly jsonContentType = {
      'Content-Type': 'application/json',
    };
    
    /**
     * HTML content type header for web page responses.
     */
    private static readonly htmlContentType = {
      'Content-Type': 'text/html; charset=utf-8',
    };
    
    /**
     * Security headers specific to API responses.
     * These headers enhance security by preventing common web vulnerabilities.
     */
    private static readonly apiSecurityHeaders = {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Cache-Control': 'no-store, max-age=0',
    };
    
    /**
     * Security headers specific to web responses.
     * These headers provide balanced security while allowing necessary functionality.
     */
    private static readonly webHeaders = {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN',
      'Content-Security-Policy': "default-src 'self'; img-src 'self' data: https:; script-src 'self' 'unsafe-inline'",
      'Cache-Control': 'public, max-age=3600',
    };

    /**
     * Headers specific to POS API responses.
     * These headers include POS-specific CORS and security configurations.
     */
    private static readonly posHeaders = {
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, device-id, signature, pos-authorization, pos-id',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Cache-Control': 'no-store, max-age=0',
    };
  
    /**
     * Get headers for API responses.
     * Combines CORS headers, JSON content type, and API-specific security headers.
     * 
     * @returns {Record<string, string>} Object containing all necessary headers for API responses
     */
    public static getApiHeaders(): Record<string, string> {
      return {
        ...this.corsHeaders,
        ...this.jsonContentType,
        ...this.apiSecurityHeaders,
      };
    }
  
    /**
     * Get headers for web responses.
     * Combines CORS headers, HTML content type, and web-specific security headers.
     * 
     * @returns {Record<string, string>} Object containing all necessary headers for web responses
     */
    public static getWebHeaders(): Record<string, string> {
      return {
        ...this.corsHeaders,
        ...this.htmlContentType,
        ...this.webHeaders,
      };
    }
    
    /**
     * Get headers specifically for HTML web responses.
     * Combines CORS headers, HTML content type, and web-specific security headers.
     * 
     * @returns {Record<string, string>} Object containing all necessary headers for HTML responses
     */
    public static getHtmlHeaders(): Record<string, string> {
      return {
        ...this.corsHeaders,
        ...this.htmlContentType,
        ...this.webHeaders,
      };
    }

    /**
     * Get headers for POS API responses.
     * Combines POS-specific headers with standard API headers.
     * 
     * @returns {Record<string, string>} Object containing all necessary headers for POS API responses
     */
    public static getPosHeaders(): Record<string, string> {
      return {
        ...this.corsHeaders,
        ...this.jsonContentType,
        ...this.posHeaders,
      };
    }
  
    /**
     * Get only CORS headers.
     * Useful for preflight requests or when only CORS headers are needed.
     * 
     * @returns {Record<string, string>} Object containing only CORS-related headers
     */
    public static getCorsHeaders(): Record<string, string> {
      return { ...this.corsHeaders };
    }
  
    /**
     * Get headers for a specific content type.
     * 
     * @param {string} contentType - The desired content type (e.g., 'application/pdf', 'image/jpeg')
     * @returns {Record<string, string>} Object containing the specified content type header
     */
    public static getContentTypeHeaders(contentType: string): Record<string, string> {
      return {
        'Content-Type': contentType,
      };
    }
    
    /**
     * Merge custom headers with base headers.
     * Useful when you need to combine standard headers with custom ones.
     * 
     * @param {Record<string, string>} baseHeaders - The base headers to start with
     * @param {Record<string, string>} customHeaders - Custom headers to merge with base headers
     * @returns {Record<string, string>} Combined headers object
     */
    public static mergeHeaders(baseHeaders: Record<string, string>, customHeaders: Record<string, string>): Record<string, string> {
      return {
        ...baseHeaders,
        ...customHeaders,
      };
    }
}