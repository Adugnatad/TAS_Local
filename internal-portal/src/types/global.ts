export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ApiListParams {
  page?: number;
  pageSize?: number;
  search?: string;
}
