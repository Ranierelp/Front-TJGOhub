import { useState, useMemo } from "react";

export interface SortDescriptor {
  column: string;
  direction: "ascending" | "descending";
}

export function useTableSorting<T>(
  data: T[],
  defaultSort: SortDescriptor = { column: "name", direction: "ascending" },
) {
  const [sortDescriptor, setSortDescriptor] =
    useState<SortDescriptor>(defaultSort);

  const sortedData = useMemo(() => {
    const sorted = [...data];

    if (!sortDescriptor.column) return sorted;

    sorted.sort((a: any, b: any) => {
      const first = a[sortDescriptor.column];
      const second = b[sortDescriptor.column];
      const direction = sortDescriptor.direction === "ascending" ? 1 : -1;

      // Handle null/undefined values
      if (first == null && second == null) return 0;
      if (first == null) return -1 * direction;
      if (second == null) return 1 * direction;

      // Handle different data types
      if (typeof first === "number" && typeof second === "number") {
        return (first - second) * direction;
      }

      if (first instanceof Date && second instanceof Date) {
        return (first.getTime() - second.getTime()) * direction;
      }

      // Default string comparison
      return first.toString().localeCompare(second.toString()) * direction;
    });

    return sorted;
  }, [data, sortDescriptor]);

  return {
    sortedData,
    sortDescriptor,
    setSortDescriptor,
  };
}
