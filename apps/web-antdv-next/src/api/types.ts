export interface ApiResponse<T = unknown> {
  Success: boolean;
  Code: number;
  Message: string;
  Data: T;
  Extras: unknown;
  Timestamp: number;
}
