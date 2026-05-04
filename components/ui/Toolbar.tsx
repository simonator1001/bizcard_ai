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

interface ToolbarProps extends React.HTMLAttributes<HTMLDivElement> {
  onSearch?: (value: string) => void;
  sortField: string;
  sortDirection: string;
  onSortChange: (field: string, direction: string) => void;
  viewMode: string;
  onViewModeChange: (mode: string) => void;
  onExport?: (format?: string) => void;
  onExportCSV?: () => void;
  onExportVCard?: () => void;
  onManageDuplicates: () => void;
  cards: any[];
  filterType: 'company' | 'name' | 'title' | null;
  filterValue: string | null;
  onFilterChange: (type: 'company' | 'name' | 'title', value: string) => void;
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
  onExportCSV,
  onExportVCard,
  onManageDuplicates,
  cards = [],
  filterType,
  filterValue,
  onFilterChange,
  ...props
}: ToolbarProps) {
  const [showAll, setShowAll] = React.useState<DropdownMenuCheckboxItemProps["checked"]>(true);
  const [showActive, setShowActive] = React.useState<DropdownMenuCheckboxItemProps["checked"]>(false);
  const [showArchived, setShowArchived] = React.useState<DropdownMenuCheckboxItemProps["checked"]>(false);
  const [searchValue, setSearchValue] = React.useState("");

  // Extract unique filter options
  const companies = React.useMemo(() => Array.from(new Set(cards.flatMap(card => [card.company, card.company_zh]).filter(Boolean))), [cards]);
  const names = React.useMemo(() => Array.from(new Set(cards.flatMap(card => [card.name, card.name_zh]).filter(Boolean))), [cards]);
  const titles = React.useMemo(() => Array.from(new Set(cards.flatMap(card => [card.title, card.title_zh]).filter(Boolean))), [cards]);

  return (
    <div
      className={cn(
        "w-full bg-white/90 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 p-2 sm:p-4 shadow-md backdrop-blur-md transition-all overflow-x-auto",
        className
      )}
      style={{ WebkitOverflowScrolling: 'touch' }}
      {...props}
    >
      {/* Search Input */}
      <div className="flex-1 min-w-[200px] relative mb-2 sm:mb-0">
        <input
          type="text"
          placeholder="Search cards..."
          className="w-full h-12 pl-12 pr-4 bg-zinc-100 dark:bg-zinc-800 text-base font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary shadow-sm transition-all"
          value={searchValue}
          onChange={e => {
            setSearchValue(e.target.value);
            onSearch?.(e.target.value);
          }}
        />
        <Search className="w-5 h-5 text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2" />
        {searchValue && (
          <button
            onClick={() => {
              setSearchValue("");
              onSearch?.("");
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-md opacity-70 ring-offset-background transition-opacity hover:opacity-100 bg-zinc-200 dark:bg-zinc-700 px-2 py-1"
            aria-label="Clear search"
          >
            ×
          </button>
        )}
      </div>

      {/* Toolbar Actions: horizontal scroll on mobile */}
      <div className="flex flex-row flex-nowrap gap-2 sm:gap-3 overflow-x-auto items-center w-full min-w-0 sm:w-auto">
        {/* Filter Button */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
              <button
              className="h-9 w-9 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg flex items-center justify-center transition-colors min-w-[44px] flex-shrink-0 shadow-sm"
              aria-label="Filters"
            >
              <Filter className="w-5 h-5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 z-[9999] max-h-64 overflow-y-auto bg-white dark:bg-zinc-900 shadow-xl text-zinc-900 dark:text-zinc-100">
            <div className="px-2 py-1 text-xs font-semibold text-zinc-500">Company</div>
            {companies.map(company => (
              <DropdownMenuCheckboxItem
                key={company}
                checked={filterType === 'company' && filterValue === company}
                onCheckedChange={() => onFilterChange('company', company)}
              >
                {company}
              </DropdownMenuCheckboxItem>
            ))}
            <div className="px-2 py-1 text-xs font-semibold text-zinc-500 mt-2">Name</div>
            {names.map(name => (
              <DropdownMenuCheckboxItem
                key={name}
                checked={filterType === 'name' && filterValue === name}
                onCheckedChange={() => onFilterChange('name', name)}
              >
                {name}
              </DropdownMenuCheckboxItem>
            ))}
            <div className="px-2 py-1 text-xs font-semibold text-zinc-500 mt-2">Title</div>
            {titles.map(title => (
              <DropdownMenuCheckboxItem
                key={title}
                checked={filterType === 'title' && filterValue === title}
                onCheckedChange={() => onFilterChange('title', title)}
              >
                {title}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Sort Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="h-9 w-9 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-zinc-200 rounded-lg flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors min-w-[44px] flex-shrink-0 border border-gray-200 dark:border-gray-600" aria-label="Sort">
              <LayoutList className="w-5 h-5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 z-[9999] max-h-64 overflow-y-auto bg-white dark:bg-zinc-900 shadow-xl text-zinc-900 dark:text-zinc-100">
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

        {/* Export Dropdown */}
        {(onExportCSV || onExportVCard) ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="h-9 w-9 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-zinc-200 rounded-lg flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors min-w-[44px] flex-shrink-0 border border-gray-200 dark:border-gray-600" aria-label="Export">
                <FileDown className="w-5 h-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36 z-[9999] bg-white dark:bg-zinc-900 shadow-xl text-zinc-900 dark:text-zinc-100">
              {onExportCSV && (
                <button
                  className="w-full text-left px-2 py-1.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded cursor-pointer flex items-center gap-2"
                  onClick={onExportCSV}
                >
                  <FileDown className="w-4 h-4" />
                  Export CSV
                </button>
              )}
              {onExportVCard && (
                <button
                  className="w-full text-left px-2 py-1.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded cursor-pointer flex items-center gap-2"
                  onClick={onExportVCard}
                >
                  <FileDown className="w-4 h-4" />
                  Export vCard
                </button>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <button className="h-9 w-9 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-zinc-200 rounded-lg flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors min-w-[44px] flex-shrink-0 border border-gray-200 dark:border-gray-600" onClick={() => onExport?.()} aria-label="Export">
            <FileDown className="w-5 h-5" />
          </button>
        )}

        {/* Duplicate Manager Button */}
        <button className="h-9 w-9 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-zinc-200 rounded-lg flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors min-w-[44px] flex-shrink-0 border border-gray-200 dark:border-gray-600" onClick={onManageDuplicates} aria-label="Duplicates">
          <Copy className="w-5 h-5" />
        </button>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5 border border-gray-200 dark:border-gray-700">
          <button
            className={cn(
              "h-8 w-8 flex items-center justify-center rounded-md transition-all duration-200",
              viewMode === "list" ? "bg-white dark:bg-gray-600 text-indigo-600 dark:text-indigo-400 shadow-sm" : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
            )}
            onClick={() => onViewModeChange("list")}
            aria-label="List view"
          >
            <LayoutList className="w-4 h-4" />
          </button>
          <button
            className={cn(
              "h-8 w-8 flex items-center justify-center rounded-md transition-all duration-200",
              viewMode === "grid" ? "bg-white dark:bg-gray-600 text-indigo-600 dark:text-indigo-400 shadow-sm" : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
            )}
            onClick={() => onViewModeChange("grid")}
            aria-label="Grid view"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default Toolbar; 