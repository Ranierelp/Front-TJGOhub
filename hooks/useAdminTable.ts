import { useEffect, useState, useMemo } from "react";

import { useTablePagination } from "./useTablePagination";
import { useTableSorting, SortDescriptor } from "./useTableSorting";

// Função utilitária para acessar propriedades aninhadas usando notação de ponto
function getNestedValue(obj: any, path: string): any {
  return path.split(".").reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined;
  }, obj);
}

// Função para normalizar texto para busca (remove acentos, converte para lowercase)
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // Remove acentos
}

// Implementação aprimorada do useTableFiltering (interno)
function useTableFiltering<T>(
  data: T[],
  searchFields: (keyof T | string)[],
  additionalFilters?: { [key: string]: any },
) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredData = useMemo(() => {
    let result = data;

    // Aplicar filtros de busca por texto
    if (searchTerm.trim()) {
      const normalizedSearchTerm = normalizeText(searchTerm);

      result = result.filter((item) => {
        return searchFields.some((field) => {
          let value;

          // Se o campo contém ponto, é um campo aninhado
          if (typeof field === "string" && field.includes(".")) {
            value = getNestedValue(item, field);
          } else {
            value = (item as any)[field];
          }

          // Converter valor para string e normalizar
          if (value !== null && value !== undefined) {
            const stringValue = String(value);

            return normalizeText(stringValue).includes(normalizedSearchTerm);
          }

          return false;
        });
      });
    }

    // Aplicar filtros adicionais (mantém compatibilidade total)
    if (additionalFilters) {
      result = result.filter((item) => {
        return Object.entries(additionalFilters).every(([key, filterValue]) => {
          if (
            filterValue === null ||
            filterValue === undefined ||
            filterValue === "" ||
            filterValue === "all"
          ) {
            return true; // Ignora filtros vazios
          }

          let itemValue;

          // Suporte a campos aninhados nos filtros adicionais também
          if (key.includes(".")) {
            itemValue = getNestedValue(item, key);
          } else {
            itemValue = (item as any)[key];
          }

          // Diferentes tipos de comparação baseados no tipo do filtro
          if (Array.isArray(filterValue)) {
            return filterValue.includes(itemValue);
          } else if (typeof filterValue === "boolean") {
            return itemValue === filterValue;
          } else if (typeof filterValue === "object" && filterValue !== null) {
            // Range de valores
            if (
              filterValue.min !== undefined &&
              filterValue.max !== undefined
            ) {
              return (
                itemValue >= filterValue.min && itemValue <= filterValue.max
              );
            }
            // Filtros de data
            if (
              filterValue.start !== undefined ||
              filterValue.end !== undefined
            ) {
              const itemDate = new Date(itemValue);

              if (isNaN(itemDate.getTime())) return false;

              const startValid =
                !filterValue.start || itemDate >= new Date(filterValue.start);
              const endValid =
                !filterValue.end || itemDate <= new Date(filterValue.end);

              return startValid && endValid;
            }

            // Outros objetos, comparação por igualdade
            return JSON.stringify(itemValue) === JSON.stringify(filterValue);
          } else {
            return itemValue === filterValue;
          }
        });
      });
    }

    return result;
  }, [data, searchTerm, additionalFilters, searchFields]);

  return {
    filteredData,
    searchTerm,
    setSearchTerm,
  };
}

interface UseAdminTableOptions<T> {
  data: T[];
  searchFields: (keyof T)[] | string[];
  defaultSort?: SortDescriptor;
  itemsPerPage?: number;
  additionalFilters?: { [key: string]: any };
}

export function useAdminTable<T>({
  data,
  searchFields,
  defaultSort,
  itemsPerPage = 10,
  additionalFilters,
}: UseAdminTableOptions<T>) {
  const { filteredData, searchTerm, setSearchTerm } = useTableFiltering(
    data,
    searchFields,
    additionalFilters,
  );

  const { sortedData, sortDescriptor, setSortDescriptor } = useTableSorting(
    filteredData,
    defaultSort,
  );

  const {
    paginatedData,
    page,
    setPage,
    totalPages,
    resetPage,
    hasMultiplePages,
  } = useTablePagination(sortedData, itemsPerPage);

  // Reset page when search term changes
  useEffect(() => {
    resetPage();
  }, [searchTerm, resetPage]);

  // Reset page when additional filters change (mas usa JSON.stringify para comparação profunda)
  useEffect(() => {
    resetPage();
  }, [JSON.stringify(additionalFilters), resetPage]);

  // Propriedades adicionais úteis (sem quebrar compatibilidade)
  const stats = useMemo(
    () => ({
      totalItems: data.length,
      filteredItems: filteredData.length,
      currentPageItems: paginatedData.length,
      isFiltered:
        searchTerm.trim() !== "" ||
        (additionalFilters &&
          Object.keys(additionalFilters).some(
            (key) =>
              additionalFilters[key] !== null &&
              additionalFilters[key] !== undefined &&
              additionalFilters[key] !== "",
          )),
    }),
    [
      data.length,
      filteredData.length,
      paginatedData.length,
      searchTerm,
      additionalFilters,
    ],
  );

  return {
    // Propriedades originais (mantém compatibilidade total)
    paginatedData,
    totalItems: filteredData.length,
    searchTerm,
    setSearchTerm,
    sortDescriptor,
    setSortDescriptor,
    page,
    setPage,
    totalPages,
    hasMultiplePages,

    // Propriedades adicionais (não quebram compatibilidade)
    filteredData,
    allData: data,
    stats,
  };
}

// Hooks utilitários extras (opcionais, não afetam o useAdminTable principal)
export function useAdminTableFilters() {
  const [filters, setFilters] = useState<{ [key: string]: any }>({});

  const updateFilter = (key: string, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]:
        value === null || value === undefined || value === ""
          ? undefined
          : value,
    }));
  };

  const removeFilter = (key: string) => {
    setFilters((prev) => {
      const newFilters = { ...prev };

      delete newFilters[key];

      return newFilters;
    });
  };

  const clearFilters = () => {
    setFilters({});
  };

  const setTextFilter = (key: string, value: string) => {
    updateFilter(key, value?.trim() || undefined);
  };

  const setSelectFilter = (key: string, value: string | string[]) => {
    updateFilter(
      key,
      Array.isArray(value) && value.length === 0 ? undefined : value,
    );
  };

  const setRangeFilter = (key: string, min?: number, max?: number) => {
    if (min === undefined && max === undefined) {
      updateFilter(key, undefined);
    } else {
      updateFilter(key, { min, max });
    }
  };

  const setDateFilter = (key: string, start?: Date, end?: Date) => {
    if (!start && !end) {
      updateFilter(key, undefined);
    } else {
      updateFilter(key, { start, end });
    }
  };

  const setBooleanFilter = (key: string, value?: boolean) => {
    updateFilter(key, value);
  };

  return {
    filters,
    updateFilter,
    removeFilter,
    clearFilters,
    setTextFilter,
    setSelectFilter,
    setRangeFilter,
    setDateFilter,
    setBooleanFilter,
  };
}

// Exemplo de como usar com filtros avançados (opcional)
export function useAdminTableWithAdvancedFilters<T>(
  options: UseAdminTableOptions<T>,
) {
  const { filters, ...filterMethods } = useAdminTableFilters();

  // Combina filtros personalizados com os existentes
  const combinedFilters = {
    ...options.additionalFilters,
    ...filters,
  };

  const tableResult = useAdminTable({
    ...options,
    additionalFilters: combinedFilters,
  });

  return {
    ...tableResult,
    ...filterMethods,
    activeFilters: filters,
  };
}

// Tipos para melhor tipagem (não afetam compatibilidade)
export type AdminTableReturn<T> = ReturnType<typeof useAdminTable<T>>;
export type AdminTableStats = {
  totalItems: number;
  filteredItems: number;
  currentPageItems: number;
  isFiltered: boolean;
};
