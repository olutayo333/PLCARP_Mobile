export interface HttpSuccessResponse<T> {
  readonly message: string;
  readonly status: number;
  readonly success: string;
  readonly data: T;
}

export interface ApiResponse<T = any> {
  status: boolean;
  statusCode: number;
  message: string;
  data: T;
}
