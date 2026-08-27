// components/admin/data-toolbar.tsx
"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FilterOption {
  label: string;
  value: string;
}

interface DataToolbarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filterOptions?: FilterOption[];
  filterValue?: string;
  onFilterChange?: (value: string) => void;
  filterLabel?: string;
}

export function DataToolbar({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
  filterOptions,
  filterValue,
  onFilterChange,
  filterLabel = "All",
}: DataToolbarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1 sm:max-w-xs">
        <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
        <Input
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="rounded-none pl-8"
        />
      </div>
      {filterOptions && onFilterChange && (
        <Select
          value={filterValue}
          onValueChange={(value) => {
            if (value !== null) {
              onFilterChange(value);
            }
          }}
        >
          <SelectTrigger className="w-full rounded-none sm:w-48">
            <SelectValue placeholder={filterLabel} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{filterLabel}</SelectItem>
            {filterOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
