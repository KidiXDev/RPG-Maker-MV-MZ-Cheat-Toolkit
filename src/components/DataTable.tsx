import { memo, useDeferredValue, useMemo, useState, type ReactNode } from 'react';

type Column<T> = {
  key: string;
  header: string;
  render(row: T): ReactNode;
  sortValue?: (row: T) => number | string;
  className?: string;
};

type DataTableProps<T> = {
  columns: Array<Column<T>>;
  rows: T[];
  searchPlaceholder?: string;
  filter(row: T, query: string): boolean;
  getRowId(row: T): string | number;
  /** Max visible rows before truncating. 0 = no limit. */
  pageSize?: number;
};

function DataTableInner<T>({
  columns,
  rows,
  searchPlaceholder = 'Search',
  filter,
  getRowId,
  pageSize = 500
}: DataTableProps<T>) {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);
  const deferredQuery = useDeferredValue(query);
  const normalizedQuery = deferredQuery.trim().toLowerCase();

  const filteredRows = useMemo(
    () => (normalizedQuery ? rows.filter((row) => filter(row, normalizedQuery)) : rows),
    [rows, normalizedQuery, filter]
  );

  const sortColumn = sort
    ? columns.find((column) => column.key === sort.key)
    : undefined;

  const sortedRows = useMemo(() => {
    if (!sortColumn?.sortValue || !sort) {
      return filteredRows;
    }
    return [...filteredRows].sort((left, right) => {
      const leftValue = sortColumn.sortValue?.(left) ?? '';
      const rightValue = sortColumn.sortValue?.(right) ?? '';
      const result =
        typeof leftValue === 'number' && typeof rightValue === 'number'
          ? leftValue - rightValue
          : String(leftValue).localeCompare(String(rightValue), undefined, {
              numeric: true
            });
      return sort.direction === 'asc' ? result : -result;
    });
  }, [filteredRows, sortColumn, sort]);

  const visibleRows = pageSize > 0 ? sortedRows.slice(0, pageSize) : sortedRows;
  const truncated = pageSize > 0 && sortedRows.length > pageSize;

  function toggleSort(column: Column<T>) {
    if (!column.sortValue) {
      return;
    }
    setSort((current) => {
      if (current?.key !== column.key) {
        return { key: column.key, direction: 'asc' };
      }
      if (current.direction === 'asc') {
        return { key: column.key, direction: 'desc' };
      }
      return null;
    });
  }

  return (
    <div className="grid gap-3">
      <input
        className="rounded-lg border border-white/10 bg-rmc-abyss/80 px-3 py-1.5 text-sm text-rmc-mist outline-none transition placeholder:text-rmc-slate focus:border-rmc-aether"
        placeholder={searchPlaceholder}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      <div className="max-h-[40vh] overflow-auto rounded-lg border border-white/10">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="text-xs tracking-[0.18em] text-rmc-aether uppercase">
            <tr>
              {columns.map((column) => (
                <th
                  className={`sticky top-0 bg-rmc-panel px-4 py-3 font-semibold z-10 ${column.className ?? ''}`}
                  key={column.key}
                >
                  {column.sortValue ? (
                    <button
                      className="grid grid-flow-col auto-cols-max items-center gap-1.5 text-left uppercase hover:text-rmc-ember transition-colors duration-150 cursor-pointer"
                      type="button"
                      onClick={() => toggleSort(column)}
                    >
                      <span>{column.header}</span>
                      <span className="text-rmc-ember font-normal">
                        {sort?.key === column.key
                          ? sort.direction === 'asc'
                            ? '▲'
                            : '▼'
                          : '↕'}
                      </span>
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row) => (
              <tr
                className="border-t border-white/10 odd:bg-white/3"
                key={getRowId(row)}
              >
                {columns.map((column) => (
                  <td
                    className={`px-4 py-3 align-middle text-rmc-mist ${column.className ?? ''}`}
                    key={column.key}
                  >
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))}
            {truncated ? (
              <tr>
                <td
                  className="px-4 py-3 text-sm text-rmc-slate text-center"
                  colSpan={columns.length}
                >
                  Showing {pageSize} of {sortedRows.length} — use search to narrow results
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export const DataTable = memo(DataTableInner) as typeof DataTableInner;
