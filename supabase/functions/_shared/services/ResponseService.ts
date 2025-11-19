// ResponseService.ts - Standardized API response handling

import { ErrorsService, ResponseType } from "./ErrorsService.ts";
import { HeadersService } from "./HeadersService.ts";

/**
 * Service for standardizing API responses across edge functions
 */
export class ResponseService {
  /**
   * Creates a success response with standardized format
   *
   * @param data The data to return in the response
   * @param status HTTP status code (defaults to 200)
   * @param meta Optional metadata to include in the response
   * @param responseType Type of response (API or Web)
   * @returns Formatted Response object
   */
  static success<T>(
    data: T,
    status = 200,
    meta?: Record<string, unknown>,
    responseType: ResponseType = ResponseType.API,
  ): Response {
    const body = {
      success: true,
      data,
      ...(meta && { meta }),
    };

    return new Response(JSON.stringify(body), {
      status,
      headers: responseType === ResponseType.API
        ? HeadersService.getApiHeaders()
        : HeadersService.getWebHeaders(),
    });
  }

  /**
   * Creates a standardized error response
   *
   * @param message Human-readable error message
   * @param code Error code for client reference
   * @param status HTTP status code (defaults to 400)
   * @param details Additional error details
   * @param responseType Type of response (API or Web)
   * @returns Formatted Response object
   */
  static error(
    message: string,
    code = "GENERAL_ERROR",
    status = 400,
    details?: Record<string, unknown>,
    responseType: ResponseType = ResponseType.API,
  ): Response {
    const body = {
      success: false,
      error: {
        message,
        code,
        ...(details && { details }),
      },
    };

    return new Response(JSON.stringify(body), {
      status,
      headers: responseType === ResponseType.API
        ? HeadersService.getApiHeaders()
        : HeadersService.getWebHeaders(),
    });
  }

  /**
   * Handle CORS preflight requests
   *
   * @returns Response for OPTIONS requests
   */
  static handleCors(): Response {
    return new Response(null, {
      status: 204,
      headers: HeadersService.getCorsHeaders(),
    });
  }

  /**
   * Creates a created (201) response for resource creation
   *
   * @param data The created resource data
   * @param id Optional resource identifier
   * @param responseType Type of response (API or Web)
   * @returns Formatted Response object
   */
  static created<T>(
    data: T,
    id?: string | number,
    responseType: ResponseType = ResponseType.API,
  ): Response {
    const responseData = id ? { id, ...data as object } : data;
    return this.success(responseData, 201, undefined, responseType);
  }

  /**
   * Creates a not found (404) error response
   *
   * @param message Custom message (defaults to "Resource not found")
   * @param code Custom error code (defaults to "NOT_FOUND")
   * @param responseType Type of response (API or Web)
   * @returns Formatted Response object
   */
  static notFound(
    message = "Resource not found",
    code = "NOT_FOUND",
    responseType: ResponseType = ResponseType.API,
  ): Response {
    return ErrorsService.notFound(message, code, undefined, responseType)
      .toResponse();
  }

  /**
   * Creates an unauthorized (401) error response
   *
   * @param message Custom message (defaults to "Unauthorized")
   * @param code Custom error code (defaults to "UNAUTHORIZED")
   * @param responseType Type of response (API or Web)
   * @returns Formatted Response object
   */
  static unauthorized(
    message = "Unauthorized",
    code = "UNAUTHORIZED",
    responseType: ResponseType = ResponseType.API,
  ): Response {
    return ErrorsService.unauthorized(message, code, undefined, responseType)
      .toResponse();
  }

  /**
   * Creates a forbidden (403) error response
   *
   * @param message Custom message (defaults to "Forbidden")
   * @param code Custom error code (defaults to "FORBIDDEN")
   * @param responseType Type of response (API or Web)
   * @returns Formatted Response object
   */
  static forbidden(
    message = "Forbidden",
    code = "FORBIDDEN",
    responseType: ResponseType = ResponseType.API,
  ): Response {
    return ErrorsService.forbidden(message, code, undefined, responseType)
      .toResponse();
  }
}
