export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ApiListParams {
  page?: number;
  size?: number;
  sort?: string;
  q?: string;
  [key: string]: string | number | boolean | undefined | null;
}

export interface FieldError {
  field: string;
  message: string;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
}
