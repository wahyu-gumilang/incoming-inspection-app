// Envelope every backend response uses (see CLAUDE.md, "JSON response conventions").
export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta?: PageMeta;
}

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
