import { useState, useMemo } from "react";

export function useTableFiltering<T>(
  data: T[],
  searchFields: (keyof T)[],
  additionalFilters?: { [key: string]: any },
) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredData = useMemo(() => {
    let filtered = [...data];

    if (searchTerm) {
      filtered = filtered.filter((item) => {
        return searchFields.some((field) => {
          const value = item[field];

          if (value == null) return false;

          return value
            .toString()
            .toLowerCase()
            .includes(searchTerm.toLowerCase());
        });
      });
    }

    if (additionalFilters) {
      Object.entries(additionalFilters).forEach(([key, filterValue]) => {
        if (filterValue && filterValue.toString().toLowerCase() !== "all") {
          filtered = filtered.filter((item: any) => {
            if (key === "isActive") {
              return filterValue === "active" ? item.isActive : !item.isActive;
            }
            if (key === "role") {
              return item.role === filterValue;
            }
            if (key === "itemType") {
              return item.itemType === filterValue;
            }
            if (key === "effectType") {
              return item.effectType === filterValue;
            }

            return item[key] === filterValue;
          });
        }
      });
    }

    return filtered;
  }, [data, searchTerm, searchFields, additionalFilters]);

  return {
    filteredData,
    searchTerm,
    setSearchTerm,
  };
}
