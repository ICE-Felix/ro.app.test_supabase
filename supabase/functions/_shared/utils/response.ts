export class ApiResponse {
  static Success(data: any, message: string = 'Success') {
    return {
      success: true,
      message,
      data,
    };
  }

  static Error(message: string, data: any = null) {
    return {
      success: false,
      message,
      data,
    };
  }
} 