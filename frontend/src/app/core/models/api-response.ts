export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta?: PageMeta;
}

export interface ApiErrorBody {
  success: false;
  error: {
    code: string;
    message: string;
    details?: ApiErrorDetail[];
  };
}

export interface ApiErrorDetail {
  field: string;
  message: string;
}

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
