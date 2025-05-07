"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Settings,
  Download,
  Share2,
  Sparkles,
  ChevronDown,
  Search,
  Filter,
  ArrowRight,
  LayoutList,
  LayoutGrid,
  Grid,
  FileDown,
  Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { DropdownMenuCheckboxItemProps } from "@radix-ui/react-dropdown-menu";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface ToolbarProps extends React.HTMLAttributes<HTMLDivElement> {
  onSearch?: (value: string) => void;
  sortField: string;
  sortDirection: string;
  onSortChange: (field: string, direction: string) => void;
  viewMode: string;
  onViewModeChange: (mode: string) => void;
  onExport: () => void;
  onManageDuplicates: () => void;
}

function Toolbar({
  className,
  onSearch,
  sortField,
  sortDirection,
  onSortChange,
  viewMode,
  onViewModeChange,
  onExport,
  onManageDuplicates,
  ...props
}: ToolbarProps) {
  const [showAll, setShowAll] = React.useState<DropdownMenuCheckboxItemProps["checked"]>(true);
  const [showActive, setShowActive] = React.useState<DropdownMenuCheckboxItemProps["checked"]>(false);
  const [showArchived, setShowArchived] = React.useState<DropdownMenuCheckboxItemProps["checked"]>(false);
  const [searchValue, setSearchValue] = React.useState("");

  return (
    <div
      className={cn(
        "w-full bg-background border border-border rounded-xl flex flex-col sm:flex-row items-center gap-2 p-2",
        className
      )}
      {...props}
    >
      {/* Search Input */}
      <div className="flex-1 relative w-full sm:w-auto sm:flex-1 max-w-2xl">
        <input
          type="text"
          placeholder="Search cards..."
          className="w-full h-10 pl-10 pr-4 bg-muted/50 text-sm text-foreground placeholder:text-muted-foreground/70 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20"
          value={searchValue}
          onChange={e => {
            setSearchValue(e.target.value);
            onSearch?.(e.target.value);
          }}
        />
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        {searchValue && (
          <button
            onClick={() => {
              setSearchValue("");
              onSearch?.("");
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100"
          >
            ×
          </button>
        )}
      </div>

      {/* Filter Button */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="h-9 px-3 gap-2"
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuCheckboxItem checked={showAll} onCheckedChange={setShowAll}>
            Show All
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem checked={showActive} onCheckedChange={setShowActive}>
            Active Only
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem checked={showArchived} onCheckedChange={setShowArchived}>
            Archived
          </DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Sort Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="h-10 gap-2">
            <LayoutList className="mr-2 h-4 w-4" />
            Sort
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuRadioGroup value={`${sortField}-${sortDirection}`} onValueChange={value => {
            const [field, direction] = value.split("-");
            onSortChange(field, direction);
          }}>
            <DropdownMenuRadioItem value="name-asc">Name (A-Z)</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="name-desc">Name (Z-A)</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="company-asc">Company (A-Z)</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="company-desc">Company (Z-A)</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="created_at-desc">Newest First</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="created_at-asc">Oldest First</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Export Button */}
      <Button variant="outline" size="sm" className="h-10" onClick={onExport}>
        <FileDown className="mr-2 h-4 w-4" />
        Export
      </Button>

      {/* Duplicate Manager Button */}
      <Button variant="outline" size="sm" className="h-10" onClick={onManageDuplicates}>
        <Copy className="mr-2 h-4 w-4" />
        Duplicates
      </Button>

      {/* View Mode Toggle */}
      <div className="relative h-10 bg-muted/50 rounded-md p-1">
        <ToggleGroup type="single" value={viewMode} onValueChange={value => value && onViewModeChange(value)}>
          <ToggleGroupItem value="list" aria-label="List view" className="relative h-8 w-8 p-0">
            <LayoutList className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="grid" aria-label="Grid view" className="relative h-8 w-8 p-0">
            <LayoutGrid className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="grid-motion" aria-label="Grid motion view" className="relative h-8 w-8 p-0">
            <Grid className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
    </div>
  );
}

export default Toolbar; 