"use client"

import { useState, useRef, useEffect } from 'react';
import { Search, Grid3X3, List, Table, FileDown, Copy, ChevronDown } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type ViewMode = 'list' | 'grid' | 'table';

interface SearchToolbarProps {
  onSearch: (query: string) => void;
  onSortChange: (value: string) => void;
  onViewChange: (mode: ViewMode) => void;
  onManageDuplicates: () => void;
  onExportCSV: () => void;
}

export default function SearchToolbar({
  onSearch,
  onSortChange,
  onViewChange,
  onManageDuplicates,
  onExportCSV,
}: SearchToolbarProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchValue, setSearchValue] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
    onSearch(e.target.value);
  };

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    onViewChange(mode);
  };

  return (
    <Card className="border-border bg-card">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between p-4">
        {/* Search Bar */}
        <div ref={searchRef} className="relative flex-grow max-w-2xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
            <Input
              type="text"
              placeholder="Search cards..."
              value={searchValue}
              className="w-full pl-10"
              onChange={handleSearchChange}
              onFocus={() => setIsExpanded(true)}
              aria-label="Search cards"
            />
            {searchValue && (
              <button
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setSearchValue('');
                  onSearch('');
                }}
              >
                <span className="sr-only">Clear search</span>
                ×
              </button>
            )}
          </div>
        </div>

        {/* Controls */}
        {(!isExpanded || window.innerWidth >= 640) && (
          <div className="flex flex-wrap gap-3 items-center sm:flex-nowrap">
            {/* Sort Dropdown */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="gap-2">
                        <span className="hidden sm:inline">Sort by</span>
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onSortChange('dateAdded')}>
                        Date Added
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onSortChange('name')}>
                        Name
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onSortChange('company')}>
                        Company
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Sort cards</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* View Toggle Buttons */}
            <div className="flex gap-1 border border-input rounded-lg p-1 bg-muted/30">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-9 w-9 ${viewMode === 'list' ? 'bg-background shadow-sm' : 'hover:bg-background/60'}`}
                      onClick={() => handleViewModeChange('list')}
                      aria-label="List view"
                    >
                      <List className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>List view</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-9 w-9 ${viewMode === 'grid' ? 'bg-background shadow-sm' : 'hover:bg-background/60'}`}
                      onClick={() => handleViewModeChange('grid')}
                      aria-label="Grid view"
                    >
                      <Grid3X3 className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Grid view</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-9 w-9 ${viewMode === 'table' ? 'bg-background shadow-sm' : 'hover:bg-background/60'}`}
                      onClick={() => handleViewModeChange('table')}
                      aria-label="Table view"
                    >
                      <Table className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Table view</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {/* Action Buttons */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 sm:w-auto sm:px-4"
                    onClick={onManageDuplicates}
                    aria-label="Manage duplicates"
                  >
                    <Copy className="h-5 w-5" />
                    <span className="hidden sm:inline ml-2">Manage Duplicates</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Manage duplicate cards</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="default"
                    size="icon"
                    className="h-9 w-9 sm:w-auto sm:px-4"
                    onClick={onExportCSV}
                    aria-label="Export CSV"
                  >
                    <FileDown className="h-5 w-5" />
                    <span className="hidden sm:inline ml-2">Export CSV</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Export cards as CSV</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
      </div>
    </Card>
  );
} 