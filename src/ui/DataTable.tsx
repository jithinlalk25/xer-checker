import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ArrowUpDown, Search } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { formatCount } from './format';
import { Button } from './primitives/button';
import { Input } from './primitives/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './primitives/table';
import { SCROLL_AREA, STICKY_HEADER } from './scroll';

declare module '@tanstack/react-table' {
  interface ColumnMeta<TData, TValue> {
    /** Right-align numbers. */
    numeric?: boolean;
    className?: string;
  }
}

const PAGE_SIZE = 50;

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  /** Text a row is searched by. Rows keep the order given (worst first) until a column is sorted. */
  searchText: (row: T) => string;
  searchLabel: string;
  /** Names the scrolling table for screen readers, e.g. "Broken rows". */
  label: string;
  emptyMessage: string;
  /** Extra controls shown next to the search box. */
  toolbar?: ReactNode;
}

export function DataTable<T>({ data, columns, searchText, searchLabel, label, emptyMessage, toolbar }: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [query, setQuery] = useState('');

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter: query },
    onSortingChange: setSorting,
    onGlobalFilterChange: setQuery,
    globalFilterFn: (row, _columnId, value: string) => searchText(row.original).toLowerCase().includes(value.toLowerCase()),
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: PAGE_SIZE } },
    autoResetPageIndex: true,
  });

  const shown = table.getFilteredRowModel().rows.length;
  const { pageIndex } = table.getState().pagination;
  const pages = table.getPageCount();

  // The table scrolls inside its card: start each new page, sort or search at the top.
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [pageIndex, sorting, query]);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative sm:w-72">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchLabel}
            aria-label={searchLabel}
            className="pl-8"
          />
        </div>
        {toolbar}
        <p className="text-xs text-muted-foreground sm:ml-auto">
          {shown === data.length ? `${formatCount(data.length)} ${data.length === 1 ? 'row' : 'rows'}` : `${formatCount(shown)} of ${formatCount(data.length)} rows`}
        </p>
      </div>
      <div className="overflow-hidden rounded-lg border">
        <Table containerProps={{ ref: scrollRef, className: SCROLL_AREA, tabIndex: 0, role: 'region', 'aria-label': label }}>
          <TableHeader className={STICKY_HEADER}>
            {table.getHeaderGroups().map((group) => (
              <TableRow key={group.id}>
                {group.headers.map((header) => {
                  const meta = header.column.columnDef.meta;
                  const sorted = header.column.getIsSorted();
                  const SortIcon = sorted === 'asc' ? ArrowUp : sorted === 'desc' ? ArrowDown : ArrowUpDown;
                  return (
                    <TableHead key={header.id} className={cn(meta?.numeric && 'text-right', meta?.className)}>
                      {header.column.getCanSort() ? (
                        <button
                          type="button"
                          onClick={header.column.getToggleSortingHandler()}
                          className={cn(
                            'inline-flex items-center gap-1 rounded hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                            meta?.numeric && 'flex-row-reverse',
                          )}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          <SortIcon className={cn('size-3.5', !sorted && 'opacity-40')} />
                        </button>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="py-6 text-center text-muted-foreground">
                  {data.length === 0 ? emptyMessage : 'No rows match your search.'}
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => {
                    const meta = cell.column.columnDef.meta;
                    return (
                      <TableCell key={cell.id} className={cn(meta?.numeric && 'text-right tabular-nums', meta?.className)}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      {pages > 1 && (
        <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
          Page {pageIndex + 1} of {pages}
          <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
            Previous
          </Button>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
