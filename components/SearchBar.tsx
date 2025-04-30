"use client";

import * as React from "react";
import { Search, X, Filter, ChevronDown, Settings, Download, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchBarProps extends React.HTMLAttributes<HTMLDivElement> {
  onSearch?: (value: string) => void;
  placeholder?: string;
  showFilters?: boolean;
  showActions?: boolean;
}

export function SearchBar({
  className,
  onSearch,
  placeholder = "Search cards...",
  showFilters = true,
  showActions = true,
  ...props
}: SearchBarProps) {
  const [searchValue, setSearchValue] = React.useState("");

  const handleClear = () => {
    setSearchValue("");
    onSearch?.("");
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
    onSearch?.(e.target.value);
  };

  return (
    <div
      className={cn(
        "w-full bg-background border border-border rounded-lg flex items-center gap-2 p-2",
        className
      )}
      {...props}
    >
      {/* Search Input */}
      <div className="flex-1 relative">
        <div className="flex h-10 w-full items-center overflow-hidden rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
          <Search className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            type="text"
            value={searchValue}
            onChange={handleChange}
            placeholder={placeholder}
            className="flex-1 bg-background px-2 py-1.5 outline-none placeholder:text-muted-foreground"
          />
          {searchValue && (
            <button
              onClick={handleClear}
              className="ml-1 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Filter Button */}
      {showFilters && (
        <button
          className="h-10 px-3 inline-flex items-center justify-center whitespace-nowrap rounded-md border border-input bg-background text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <Filter className="mr-2 h-4 w-4" />
          <span>Filters</span>
          <ChevronDown className="ml-2 h-4 w-4 text-muted-foreground" />
        </button>
      )}

      {/* Action Buttons */}
      {showActions && (
        <div className="flex items-center gap-1">
          <button
            className="h-10 w-10 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <Settings className="h-4 w-4 text-muted-foreground" />
          </button>
          <button
            className="h-10 w-10 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <Download className="h-4 w-4 text-muted-foreground" />
          </button>
          <button
            className="h-10 w-10 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <Share2 className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      )}
    </div>
  );
} 