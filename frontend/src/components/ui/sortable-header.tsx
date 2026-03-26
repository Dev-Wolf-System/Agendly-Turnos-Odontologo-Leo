"use client";

import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { TableHead } from "@/components/ui/table";

interface SortableHeaderProps {
  label: string;
  field: string;
  currentSort: string;
  currentOrder: "ASC" | "DESC";
  onSort: (field: string, order: "ASC" | "DESC") => void;
  className?: string;
}

export function SortableHeader({
  label,
  field,
  currentSort,
  currentOrder,
  onSort,
  className,
}: SortableHeaderProps) {
  const isActive = currentSort === field;

  const handleClick = () => {
    if (isActive) {
      onSort(field, currentOrder === "ASC" ? "DESC" : "ASC");
    } else {
      onSort(field, "ASC");
    }
  };

  return (
    <TableHead className={className}>
      <button
        type="button"
        className="flex items-center gap-1 hover:text-foreground transition-colors text-left"
        onClick={handleClick}
      >
        {label}
        {isActive ? (
          currentOrder === "ASC" ? (
            <ArrowUp className="h-3.5 w-3.5 text-primary" />
          ) : (
            <ArrowDown className="h-3.5 w-3.5 text-primary" />
          )
        ) : (
          <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />
        )}
      </button>
    </TableHead>
  );
}
