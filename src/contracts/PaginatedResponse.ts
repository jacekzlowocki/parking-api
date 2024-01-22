export type PaginatedResponse<T> = {
  meta: PageinatedResponseMeta;
  data: T;
};

type PageinatedResponseMeta = {
  page: number;
  pageSize: number;
  total: number;
};
