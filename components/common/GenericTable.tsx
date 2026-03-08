"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  Search,
  Trash2,
  Edit,
  PlusCircle,
  Check,
  X,
  AlertTriangle,
  Lightbulb,
  Pencil,
  CheckCircle,
  XCircle,
  RefreshCw,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Pagination } from "@/components/ui/pagination";
import { cn } from "@/lib/utils";
import ResponsiveModal from "@/components/common/ResponsiveModal";

const EditableNumberInput = ({
  initialValue,
  onCommit,
  min,
  max,
}: {
  initialValue: number;
  onCommit: (value: number) => void;
  min?: number;
  max?: number;
}) => {
  const [localValue, setLocalValue] = useState(String(initialValue ?? ""));

  useEffect(() => {
    setLocalValue(String(initialValue ?? ""));
  }, [initialValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;

    if (newValue === "") {
      setLocalValue("");
      onCommit(0);
      return;
    }

    let numVal = Number(newValue);

    if (max !== undefined && numVal > max) numVal = max;
    if (min !== undefined && numVal < min) numVal = min;

    setLocalValue(String(numVal));
    if (!isNaN(numVal)) onCommit(numVal);
  };

  return (
    <Input
      className="w-24 h-8 text-sm"
      max={max}
      min={min}
      type="number"
      value={localValue}
      onClick={(e) => e.stopPropagation()}
      onFocus={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onChange={handleChange}
    />
  );
};

const ThemedSwitch = ({
  isSelected: initialIsSelected,
  onValueChange,
}: {
  isSelected: boolean;
  onValueChange: (isSelected: boolean) => void;
}) => {
  const [isSelected, setIsSelected] = useState(initialIsSelected);

  useEffect(() => {
    setIsSelected(initialIsSelected);
  }, [initialIsSelected]);

  const handleChange = (checked: boolean) => {
    setIsSelected(checked);
    onValueChange(checked);
  };

  return (
    <Switch
      checked={isSelected}
      onCheckedChange={handleChange}
    />
  );
};

interface Column {
  key: string;
  label: string;
  allowsSorting?: boolean;
  width?: number;
  className?: string;
  render?: (item: any, value: any) => React.ReactNode;
}

interface Action {
  key: string;
  label: string;
  icon: React.ElementType;
  color?:
    | "default"
    | "primary"
    | "secondary"
    | "success"
    | "warning"
    | "danger";
  isIconOnly?: boolean;
  onClick: (item: any) => void;
  isVisible?: (item: any) => boolean;
}

interface GenericTableProps {
  data: any[];
  columns: Column[];
  actions?: Action[];
  searchPlaceholder?: string;
  emptyContent?: string;
  rowsPerPage?: number;
  enableBulkActions?: boolean;
  bulkActions?: {
    delete?: {
      enabled: boolean;
      onDelete: (selectedItems: any[]) => Promise<void>;
      confirmMessage?: string;
      isDisabled?: (selectedItems: any[]) => boolean;
    };
    update?: {
      enabled: boolean;
      onUpdate: (updates: Record<string, any>) => Promise<void>;
      fields: {
        key: string;
        label: string;
        type: "number" | "text" | "select" | "slider" | "switch";
        options?: { value: any; label: string }[];
        min?: number;
        max?: number | ((item: any) => number | undefined);
      }[];
    };
    enable?: {
      enabled: boolean;
      onEnable: (selectedItems: any[]) => Promise<void>;
      isDisabled?: (selectedItems: any[]) => boolean;
    };
    disable?: {
      enabled: boolean;
      onDisable: (selectedItems: any[]) => Promise<void>;
      isDisabled?: (selectedItems: any[]) => boolean;
    };
    customActions?: {
      key: string;
      label: string;
      icon: React.ElementType;
      color?:
        | "default"
        | "primary"
        | "secondary"
        | "success"
        | "warning"
        | "danger";
      onPress: (selectedItems: any[]) => void;
      isDisabled?: (selectedItems: any[]) => boolean;
    }[];
  };
  customHeader?:
    | React.ReactNode
    | ((editedValues: Record<string, any>) => React.ReactNode);
  onAdd?: () => void;
  isLoading?: boolean;
  onRefresh?: () => void;
  getItemKey?: (item: any) => string;
  searchFields?: string[];
  canSelectItem?: (item: any) => boolean;
}

export default function GenericTable({
  data,
  columns,
  actions = [],
  searchPlaceholder = "Filtrar itens...",
  emptyContent = "Nenhum item encontrado.",
  rowsPerPage = 10,
  enableBulkActions = false,
  bulkActions,
  customHeader,
  onAdd,
  isLoading = false,
  onRefresh,
  getItemKey = (item) => item._id || item.id || String(Math.random()),
  searchFields = [],
  canSelectItem = () => true,
}: GenericTableProps) {
  const [filter, setFilter] = useState("");
  const [sortDescriptor, setSortDescriptor] = useState({
    column: columns[0]?.key || "",
    direction: "ascending" as "ascending" | "descending",
  });
  const [page, setPage] = useState(1);
  const [selectedItems, setSelectedItems] = useState<Set<string> | "all">(
    new Set(),
  );
  const [isEditing, setIsEditing] = useState(false);
  const [editedValues, setEditedValues] = useState<Record<string, any>>({});
  const [isDeletingItems, setIsDeletingItems] = useState(false);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const onDeleteModalOpen = () => setIsDeleteModalOpen(true);
  const onDeleteModalClose = () => setIsDeleteModalOpen(false);

  const filteredData = useMemo(() => {
    if (!filter) return data;

    return data.filter((item) => {
      if (searchFields.length > 0) {
        return searchFields.some((field) => {
          const value = field.split(".").reduce((obj, key) => obj?.[key], item);

          return value?.toString().toLowerCase().includes(filter.toLowerCase());
        });
      }

      return columns.some((column) => {
        const value = item[column.key];

        return value?.toString().toLowerCase().includes(filter.toLowerCase());
      });
    });
  }, [data, filter, columns, searchFields]);

  const sortedData = useMemo(() => {
    const sorted = [...filteredData].sort((a, b) => {
      const first = a[sortDescriptor.column];
      const second = b[sortDescriptor.column];
      const direction = sortDescriptor.direction === "ascending" ? 1 : -1;

      if (first == null) return -1 * direction;
      if (second == null) return 1 * direction;
      if (typeof first === "number" && typeof second === "number") {
        return (first - second) * direction;
      }

      return first.toString().localeCompare(second.toString()) * direction;
    });

    return sorted;
  }, [filteredData, sortDescriptor]);

  const paginatedData = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;

    return sortedData.slice(start, end);
  }, [sortedData, page, rowsPerPage]);

  const resetPage = useCallback(() => {
    setPage(1);
  }, []);

  useEffect(() => {
    resetPage();
  }, [filter, resetPage]);

  const getSelectedItemsArray = (): any[] => {
    if (selectedItems === "all") return sortedData;
    if (selectedItems instanceof Set) {
      const selectedItemKeys = Array.from(selectedItems as Set<string>);

      return data.filter((item) =>
        selectedItemKeys.includes(String(getItemKey(item))),
      );
    }

    return [];
  };

  const handleBulkDelete = async () => {
    if (bulkActions?.delete?.onDelete) {
      setIsDeletingItems(true);
      let itemsToDelete: any[];

      if (selectedItems === "all") {
        itemsToDelete = sortedData;
      } else {
        const selectedItemKeys = Array.from(selectedItems as Set<string>);

        itemsToDelete = data.filter((item) =>
          selectedItemKeys.includes(String(getItemKey(item))),
        );
      }
      await bulkActions.delete.onDelete(itemsToDelete);
      setSelectedItems(new Set());
      setIsDeletingItems(false);
      onDeleteModalClose();
    }
  };

  const handleBulkUpdate = async () => {
    if (bulkActions?.update?.onUpdate && Object.keys(editedValues).length > 0) {
      await bulkActions.update.onUpdate(editedValues);
      setEditedValues({});
      setIsEditing(false);
      setSelectedItems(new Set());
    }
  };

  const handleCancelEdit = () => {
    setEditedValues({});
    setIsEditing(false);
  };

  const handleStartEdit = () => {
    setIsEditing(true);

    // Inicializa os valores editados com os valores atuais dos itens selecionados
    if (bulkActions?.update?.enabled && selectedItems instanceof Set) {
      const initialValues: Record<string, any> = {};

      // Para cada item selecionado, inicializa os campos editáveis com seus valores atuais
      selectedItems.forEach((selectedItemKey) => {
        const item = data.find(
          (d) => String(getItemKey(d)) === String(selectedItemKey),
        );

        if (item && bulkActions.update) {
          bulkActions.update.fields.forEach((field) => {
            const currentValue = item[field.key];

            initialValues[`${selectedItemKey}:${field.key}`] = currentValue;
          });
        }
      });

      setEditedValues(initialValues);
    }
  };

  const handleBulkEnable = async () => {
    if (bulkActions?.enable?.onEnable) {
      await bulkActions.enable.onEnable(getSelectedItemsArray());
      setSelectedItems(new Set());
    }
  };
  const handleBulkDisable = async () => {
    if (bulkActions?.disable?.onDisable) {
      await bulkActions.disable.onDisable(getSelectedItemsArray());
      setSelectedItems(new Set());
    }
  };

  // Sair automaticamente do modo edição se todos os itens forem desmarcados
  useEffect(() => {
    if (isEditing && selectedItems instanceof Set && selectedItems.size === 0) {
      setIsEditing(false);
      setEditedValues({});
    }
  }, [selectedItems, isEditing]);

  return (
    <TooltipProvider>
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              className="pl-9"
              placeholder={searchPlaceholder}
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
          <div className="flex gap-3 items-center justify-end">
            {typeof customHeader === "function"
              ? customHeader(editedValues)
              : customHeader}
            <div className="flex gap-2 items-center">
              {onRefresh && (
                <Button
                  size="icon"
                  variant="outline"
                  className={cn("h-8 w-8", isLoading && "animate-spin")}
                  onClick={onRefresh}
                  disabled={isLoading}
                >
                  <RefreshCw size={16} />
                </Button>
              )}
              {onAdd && (
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onAdd}>
                  <PlusCircle className="text-primary" />
                </Button>
              )}
            </div>
          </div>
        </div>
        {enableBulkActions &&
          (selectedItems === "all" ||
            (selectedItems instanceof Set && selectedItems.size > 0)) && (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              <Badge variant="secondary" className="w-full sm:w-auto text-xs py-1">
                {selectedItems === "all"
                  ? `${sortedData.length} selecionado(s)`
                  : `${(selectedItems as Set<string>).size} selecionado(s)`}
              </Badge>
              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                {bulkActions?.update?.enabled && (
                  <>
                    {isEditing ? (
                      <div className="flex gap-1 w-full sm:w-auto">
                        <Button
                          className="flex-1 sm:flex-none h-8"
                          size="sm"
                          variant="outline"
                          onClick={handleBulkUpdate}
                        >
                          <Check size={16} className="mr-1" />
                          Salvar
                        </Button>
                        <Button
                          className="flex-1 sm:flex-none h-8"
                          size="sm"
                          variant="outline"
                          onClick={handleCancelEdit}
                        >
                          <X size={16} className="mr-1" />
                          Cancelar
                        </Button>
                      </div>
                    ) : (
                      <Button
                        className="w-full sm:w-auto h-8"
                        size="sm"
                        variant="outline"
                        disabled={
                          selectedItems instanceof Set &&
                          selectedItems.size === 0
                        }
                        onClick={handleStartEdit}
                      >
                        <Edit size={16} className="mr-1" />
                        Editar
                      </Button>
                    )}
                  </>
                )}
                {bulkActions?.enable?.enabled && !isEditing && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 border-blue-500 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950"
                    disabled={bulkActions.enable.isDisabled?.(getSelectedItemsArray())}
                    onClick={handleBulkEnable}
                  >
                    <CheckCircle size={16} className="mr-1" />
                    Habilitar
                  </Button>
                )}
                {bulkActions?.disable?.enabled && !isEditing && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 border-yellow-500 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-950"
                    disabled={bulkActions.disable.isDisabled?.(getSelectedItemsArray())}
                    onClick={handleBulkDisable}
                  >
                    <XCircle size={16} className="mr-1" />
                    Desabilitar
                  </Button>
                )}
                {bulkActions?.delete?.enabled && (
                  <Button
                    className="w-full sm:w-auto h-8"
                    size="sm"
                    variant="destructive"
                    disabled={
                      (bulkActions?.delete?.isDisabled?.(getSelectedItemsArray()) ?? false) ||
                      (selectedItems !== "all" &&
                        selectedItems instanceof Set &&
                        selectedItems.size === 0)
                    }
                    onClick={onDeleteModalOpen}
                  >
                    <Trash2 size={16} className="mr-1" />
                    Excluir
                  </Button>
                )}
                {bulkActions?.customActions?.map((action) => (
                  <Button
                    key={action.key}
                    className="w-full sm:w-auto h-8"
                    size="sm"
                    variant="outline"
                    disabled={action.isDisabled?.(getSelectedItemsArray()) ?? false}
                    onClick={() => action.onPress(getSelectedItemsArray())}
                  >
                    {React.createElement(action.icon, { size: 16, className: "mr-1" })}
                    {action.label}
                  </Button>
                ))}
              </div>
            </div>
          )}
        {enableBulkActions &&
          selectedItems instanceof Set &&
          selectedItems.size === 0 &&
          !isEditing && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <p className="text-sm text-blue-600 dark:text-blue-400 flex items-start gap-2">
                <strong className="flex items-center gap-2 text-sm sm:text-base">
                  <Lightbulb
                    className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400 flex-shrink-0"
                    strokeWidth={3}
                  />
                  Dica:
                </strong>
                <span className="text-xs sm:text-sm leading-snug sm:mt-0.5">
                  Selecione os itens que deseja editar usando os checkboxes e
                  depois clique em &quot;Editar&quot; ou &quot;Excluir&quot;
                  para usar os controles de edição em lote.
                </span>
              </p>
            </div>
          )}
      </div>

      {/* Indicador visual do modo de edição */}
      {isEditing && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <p className="text-sm text-blue-600 dark:text-blue-400 flex items-start gap-2">
            <strong className="flex items-center gap-2 text-sm sm:text-base">
              <Pencil
                className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400 flex-shrink-0"
                strokeWidth={3}
              />
              Modo de edição ativo:
            </strong>
            <span className="text-xs sm:text-sm leading-snug sm:mt-0.5">
              Ajuste os valores usando os controles abaixo e clique em
              &quot;Salvar&quot; para aplicar as alterações.
            </span>
          </p>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-border">
        <Table key={`table-${isEditing}`}>
          <TableHeader>
            <TableRow>
              {enableBulkActions && (
                <TableHead className="w-10 pr-0">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-border accent-primary cursor-pointer"
                    checked={
                      selectedItems === "all" ||
                      (selectedItems instanceof Set &&
                        selectedItems.size === sortedData.length &&
                        sortedData.length > 0)
                    }
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedItems(new Set(sortedData.map((item) => String(getItemKey(item)))));
                      } else {
                        setSelectedItems(new Set());
                      }
                    }}
                  />
                </TableHead>
              )}
              {columns.map((column) => (
                <TableHead
                  key={column.key}
                  className={cn(
                    column.className,
                    column.allowsSorting && "cursor-pointer select-none",
                  )}
                  style={column.width ? { width: column.width } : undefined}
                  onClick={() => {
                    if (!column.allowsSorting) return;
                    setSortDescriptor((prev) => ({
                      column: column.key,
                      direction:
                        prev.column === column.key && prev.direction === "ascending"
                          ? "descending"
                          : "ascending",
                    }));
                  }}
                >
                  <span className="flex items-center gap-1">
                    {column.label}
                    {column.allowsSorting && sortDescriptor.column === column.key && (
                      sortDescriptor.direction === "ascending"
                        ? <ChevronUp className="w-3 h-3" />
                        : <ChevronDown className="w-3 h-3" />
                    )}
                  </span>
                </TableHead>
              ))}
              {actions.length > 0 && (
                <TableHead className="text-right">AÇÕES</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (enableBulkActions ? 1 : 0) + (actions.length > 0 ? 1 : 0)}
                  className="text-center py-8 text-muted-foreground"
                >
                  Carregando...
                </TableCell>
              </TableRow>
            ) : paginatedData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (enableBulkActions ? 1 : 0) + (actions.length > 0 ? 1 : 0)}
                  className="text-center py-8 text-muted-foreground"
                >
                  {emptyContent}
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((item) => {
                const itemKey = getItemKey(item);
                const isItemSelected =
                  selectedItems === "all" ||
                  (selectedItems instanceof Set &&
                    (selectedItems.has(String(itemKey)) ||
                      selectedItems.has(itemKey)));
                const isDisabled = enableBulkActions && !canSelectItem(item);

                return (
                  <TableRow
                    key={String(itemKey)}
                    data-state={isItemSelected ? "selected" : undefined}
                    className={cn(isDisabled && "opacity-50")}
                  >
                    {enableBulkActions && (
                      <TableCell className="pr-0">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-border accent-primary cursor-pointer"
                          checked={isItemSelected}
                          disabled={isDisabled}
                          onChange={(e) => {
                            if (selectedItems === "all") {
                              const newSet = new Set(
                                sortedData.map((d) => String(getItemKey(d))),
                              );
                              if (e.target.checked) {
                                newSet.add(String(itemKey));
                              } else {
                                newSet.delete(String(itemKey));
                              }
                              setSelectedItems(newSet);
                            } else {
                              const newSet = new Set(selectedItems as Set<string>);
                              if (e.target.checked) {
                                newSet.add(String(itemKey));
                              } else {
                                newSet.delete(String(itemKey));
                              }
                              setSelectedItems(newSet);
                            }
                          }}
                        />
                      </TableCell>
                    )}
                    {columns.map((column) => {
                      const value = item[column.key];
                      const editableField =
                        isEditing &&
                        isItemSelected &&
                        bulkActions?.update?.enabled &&
                        bulkActions?.update?.fields?.find((f) => f.key === column.key);

                      if (editableField) {
                        return (
                          <TableCell key={column.key}>
                            {editableField.type === "number" ? (
                              (() => {
                                const maxProp =
                                  typeof editableField.max === "function"
                                    ? editableField.max(item)
                                    : editableField.max;
                                return (
                                  <EditableNumberInput
                                    initialValue={
                                      editedValues[`${itemKey}:${column.key}`] ?? value
                                    }
                                    max={maxProp}
                                    min={editableField.min}
                                    onCommit={(numericValue) => {
                                      setEditedValues((prev) => ({
                                        ...prev,
                                        [`${itemKey}:${column.key}`]: numericValue,
                                      }));
                                    }}
                                  />
                                );
                              })()
                            ) : editableField.type === "switch" ? (
                              <ThemedSwitch
                                isSelected={
                                  editedValues[`${itemKey}:${column.key}`] ?? value
                                }
                                onValueChange={(isSelected) => {
                                  setEditedValues((prev) => ({
                                    ...prev,
                                    [`${itemKey}:${column.key}`]: isSelected,
                                  }));
                                }}
                              />
                            ) : (
                              <div
                                role="presentation"
                                onClick={(e) => e.stopPropagation()}
                                onFocus={(e) => e.stopPropagation()}
                                onKeyDown={(e) => e.stopPropagation()}
                                onMouseDown={(e) => e.stopPropagation()}
                                onPointerDown={(e) => e.stopPropagation()}
                              >
                                <Input
                                  className="h-8 text-sm"
                                  value={editedValues[`${itemKey}:${column.key}`] ?? value}
                                  onChange={(e) =>
                                    setEditedValues((prev) => ({
                                      ...prev,
                                      [`${itemKey}:${column.key}`]: e.target.value,
                                    }))
                                  }
                                />
                              </div>
                            )}
                          </TableCell>
                        );
                      }

                      const editableFieldForDisplay =
                        bulkActions?.update?.enabled &&
                        bulkActions?.update?.fields?.find((f) => f.key === column.key);

                      const displayValue =
                        editableFieldForDisplay &&
                        editedValues[`${itemKey}:${column.key}`] !== undefined
                          ? editedValues[`${itemKey}:${column.key}`]
                          : value;

                      return (
                        <TableCell key={column.key}>
                          {column.render
                            ? column.render(item, displayValue)
                            : String(displayValue ?? "")}
                        </TableCell>
                      );
                    })}
                    {actions.length > 0 && (
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          {actions
                            .filter((action) => !action.isVisible || action.isVisible(item))
                            .map((action) => {
                              const Icon = action.icon;
                              return (
                                <Tooltip key={action.key}>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-7 w-7"
                                      onClick={() => action.onClick(item)}
                                    >
                                      <Icon size={15} />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>{action.label}</TooltipContent>
                                </Tooltip>
                              );
                            })}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {sortedData.length > rowsPerPage && (
        <div className="flex w-full items-center justify-center">
          <Pagination
            page={page}
            total={Math.ceil(sortedData.length / rowsPerPage)}
            onChange={setPage}
          />
        </div>
      )}

      <ResponsiveModal
        footer={
          <>
            <Button
              variant="outline"
              disabled={isDeletingItems}
              onClick={onDeleteModalClose}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={isDeletingItems}
              onClick={handleBulkDelete}
            >
              {isDeletingItems ? "Excluindo..." : "Confirmar"}
            </Button>
          </>
        }
        isOpen={isDeleteModalOpen}
        isSubmitting={isDeletingItems}
        size="md"
        title={
          <div className="flex items-center gap-2">
            <AlertTriangle className="text-destructive" />
            Confirmar Exclusão
          </div>
        }
        onClose={onDeleteModalClose}
      >
        <p>
          {bulkActions?.delete?.confirmMessage ||
            (selectedItems === "all"
              ? `Tem certeza que deseja excluir ${sortedData.length} item(s) selecionado(s)?`
              : `Tem certeza que deseja excluir ${(selectedItems as Set<string>).size} item(s) selecionado(s)?`)}
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Esta ação não pode ser desfeita.
        </p>
      </ResponsiveModal>
    </div>
    </TooltipProvider>
  );
}
