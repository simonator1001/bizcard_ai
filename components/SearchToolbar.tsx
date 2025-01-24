import { useState } from 'react';
import { Search, Grid3X3, List, Table, FileDown, Copy } from 'lucide-react';

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

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between p-4 bg-white border-b">
      {/* Search Bar */}
      <div className="relative flex-grow max-w-2xl">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
        <input
          type="text"
          placeholder="Search cards..."
          className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          onChange={(e) => onSearch(e.target.value)}
          aria-label="Search cards"
        />
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        {/* Sort Dropdown */}
        <select
          className="px-4 py-2 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          onChange={(e) => onSortChange(e.target.value)}
          aria-label="Sort by"
        >
          <option value="dateAdded">Date Added</option>
          <option value="name">Name</option>
          <option value="company">Company</option>
        </select>

        {/* View Toggle Buttons */}
        <div className="flex gap-1 border rounded-lg p-1 bg-gray-50">
          <button
            className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-white/60'}`}
            onClick={() => {
              setViewMode('list');
              onViewChange('list');
            }}
            aria-label="List view"
          >
            <List className="h-5 w-5" />
          </button>
          <button
            className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-white/60'}`}
            onClick={() => {
              setViewMode('grid');
              onViewChange('grid');
            }}
            aria-label="Grid view"
          >
            <Grid3X3 className="h-5 w-5" />
          </button>
          <button
            className={`p-2 rounded ${viewMode === 'table' ? 'bg-white shadow-sm' : 'hover:bg-white/60'}`}
            onClick={() => {
              setViewMode('table');
              onViewChange('table');
            }}
            aria-label="Table view"
          >
            <Table className="h-5 w-5" />
          </button>
        </div>

        {/* Action Buttons */}
        <button
          onClick={onManageDuplicates}
          className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
          aria-label="Manage duplicates"
        >
          <Copy className="h-5 w-5" />
          <span className="hidden sm:inline">Manage Duplicates</span>
        </button>
        <button
          onClick={onExportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          aria-label="Export CSV"
        >
          <FileDown className="h-5 w-5" />
          <span className="hidden sm:inline">Export CSV</span>
        </button>
      </div>
    </div>
  );
} 