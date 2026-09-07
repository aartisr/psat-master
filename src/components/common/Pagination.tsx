import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = React.memo(({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  className = ''
}) => {
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Generate pagination items
  const getPageNumbers = () => {
    const pages: (number | '...')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <nav
      className={`flex flex-col sm:flex-row items-center justify-between gap-3 bg-white px-5 py-4 rounded-2xl border border-slate-200 shadow-2xs ${className}`}
      aria-label="Pagination Navigation"
    >
      <div className="text-xs font-medium text-slate-600">
        Showing <span className="font-bold text-slate-900">{startItem}</span> to{' '}
        <span className="font-bold text-slate-900">{endItem}</span> of{' '}
        <span className="font-bold text-slate-900">{totalItems}</span> items
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none rounded-xl border border-slate-200 transition-colors cursor-pointer"
          aria-label="Go to previous page"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Previous</span>
        </button>

        <div className="flex items-center gap-1">
          {getPageNumbers().map((item, index) => {
            if (item === '...') {
              return (
                <span key={`ellipsis-${index}`} className="w-7 text-center text-xs text-slate-400 font-bold">
                  ...
                </span>
              );
            }
            const isCurrent = currentPage === item;
            return (
              <button
                key={`page-${item}`}
                onClick={() => onPageChange(item as number)}
                aria-current={isCurrent ? 'page' : undefined}
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isCurrent
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {item}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none rounded-xl border border-slate-200 transition-colors cursor-pointer"
          aria-label="Go to next page"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </nav>
  );
});

Pagination.displayName = 'Pagination';
