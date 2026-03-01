import { useState, useMemo, useCallback } from "react";

export function useTablePagination<T>(data: T[], itemsPerPage = 10) {
  const [page, setPage] = useState(1);

  const totalPages = Math.ceil(data.length / itemsPerPage);

  const paginatedData = useMemo(() => {
    const safePage = Math.min(Math.max(1, page), Math.max(1, totalPages));
    const start = (safePage - 1) * itemsPerPage;
    const end = start + itemsPerPage;

    return data.slice(start, end);
  }, [data, page, itemsPerPage, totalPages]);

  const resetPage = useCallback(() => {
    setPage(1);
  }, []);

  return {
    paginatedData,
    page,
    setPage,
    totalPages,
    resetPage,
    hasMultiplePages: totalPages > 1,
  };
}
