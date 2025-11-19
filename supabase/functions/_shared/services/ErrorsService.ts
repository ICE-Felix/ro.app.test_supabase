import { HeadersService } from "./HeadersService.ts";

export type ErrorResponse = {
  status: number;
  code: string;
  message: string;
  details?: Record<string, unknown>;
};

// Import response type enum but create a local reference to avoid circular dependency
export enum ResponseType {
  API = "api",
  WEB = "web",
}

// Standard CORS headers that can be used across functions
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

export class ApiError extends Error {
  public status: number;
  public code: string;
  public details?: Record<string, unknown>;
  public responseType: ResponseType;

  constructor(
    status: number,
    code: string,
    message: string,
    details?: Record<string, unknown>,
    responseType: ResponseType = ResponseType.API,
  ) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
    this.code = code;
    this.details = details;
    this.responseType = responseType;
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  public toResponse(): Response {
    const body: ErrorResponse = {
      status: this.status,
      code: this.code,
      message: this.message,
    };

    if (this.details) {
      body.details = this.details;
    }

    const headers = this.responseType === ResponseType.API
      ? HeadersService.getApiHeaders()
      : HeadersService.getWebHeaders();

    return new Response(JSON.stringify(body), {
      status: this.status,
      headers,
    });
  }
}

export class ErrorsService {
  // Common error creators
  static badRequest(
    message: string = "Bad request",
    code: string = "BAD_REQUEST",
    details?: Record<string, unknown>,
    responseType: ResponseType = ResponseType.API,
  ): ApiError {
    return new ApiError(400, code, message, details, responseType);
  }

  static unauthorized(
    message: string = "Unauthorized",
    code: string = "UNAUTHORIZED",
    details?: Record<string, unknown>,
    responseType: ResponseType = ResponseType.API,
  ): ApiError {
    return new ApiError(401, code, message, details, responseType);
  }

  static forbidden(
    message: string = "Forbidden",
    code: string = "FORBIDDEN",
    details?: Record<string, unknown>,
    responseType: ResponseType = ResponseType.API,
  ): ApiError {
    return new ApiError(403, code, message, details, responseType);
  }

  static notFound(
    message: string = "Not found",
    code: string = "NOT_FOUND",
    details?: Record<string, unknown>,
    responseType: ResponseType = ResponseType.API,
  ): ApiError {
    return new ApiError(404, code, message, details, responseType);
  }

  static conflict(
    message: string = "Conflict",
    code: string = "CONFLICT",
    details?: Record<string, unknown>,
    responseType: ResponseType = ResponseType.API,
  ): ApiError {
    return new ApiError(409, code, message, details, responseType);
  }

  static validationError(
    message: string = "Validation failed",
    details?: Record<string, unknown>,
    responseType: ResponseType = ResponseType.API,
  ): ApiError {
    return new ApiError(400, "VALIDATION_ERROR", message, details, responseType);
  }

  static internalError(
    message: string = "Internal server error",
    details?: Record<string, unknown>,
    responseType: ResponseType = ResponseType.API,
  ): ApiError {
    return new ApiError(500, "INTERNAL_ERROR", message, details, responseType);
  }

  // Handle unexpected errors
  static handleError(
    error: unknown,
    responseType: ResponseType = ResponseType.API,
  ): Response {
    console.error("Error:", error);

    if (error instanceof ApiError) {
      return error.toResponse();
    }

    const message = error instanceof Error
      ? error.message
      : "An unexpected error occurred";
    return new ApiError(500, "INTERNAL_ERROR", message, undefined, responseType)
      .toResponse();
  }
}
