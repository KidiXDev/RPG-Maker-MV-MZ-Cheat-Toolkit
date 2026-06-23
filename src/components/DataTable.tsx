import { useDeferredValue, useState, type ReactNode } from 'react';

type Column<T> = {
  key: string;
  header: string;
  render(row: T): ReactNode;
  sortValue?: (row: T) => number | string;
};

type DataTableProps<T> = {
  columns: Array<Column<T>>;
  rows: T[];
  searchPlaceholder?: string;
  filter(row: T, query: string): boolean;
  getRowId(row: T): string | number;
};

export function DataTable<T>({
  columns,
  rows,
  searchPlaceholder = 'Search',
  filter,
  getRowId
}: DataTableProps<T>) {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const deferredQuery = useDeferredValue(query);
  const normalizedQuery = deferredQuery.trim().toLowerCase();
  const filteredRows = normalizedQuery ? rows.filter((row) => filter(row, normalizedQuery)) : rows;
  const sortColumn = sort ? columns.find((column) => column.key === sort.key) : undefined;
  const visibleRows =
    sortColumn?.sortValue && sort
      ? [...filteredRows].sort((left, right) => {
          const leftValue = sortColumn.sortValue?.(left) ?? '';
          const rightValue = sortColumn.sortValue?.(right) ?? '';
          const result =
            typeof leftValue === 'number' && typeof rightValue === 'number'
              ? leftValue - rightValue
              : String(leftValue).localeCompare(String(rightValue), undefined, { numeric: true });

          return sort.direction === 'asc' ? result : -result;
        })
      : filteredRows;

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
        className="rounded-2xl border border-white/10 bg-rmc-abyss/80 px-4 py-3 text-sm text-rmc-mist outline-none transition placeholder:text-rmc-slate focus:border-rmc-aether"
        placeholder={searchPlaceholder}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      <div className="max-h-[42vh] overflow-auto rounded-2xl border border-white/10">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="sticky top-0 bg-rmc-panel text-xs tracking-[0.18em] text-rmc-aether uppercase">
            <tr>
              {columns.map((column) => (
                <th className="px-4 py-3 font-semibold" key={column.key}>
                  {column.sortValue ? (
                    <button
                      className="flex items-center gap-2 text-left uppercase"
                      type="button"
                      onClick={() => toggleSort(column)}
                    >
                      {column.header}
                      <span className="text-rmc-ember">
                        {sort?.key === column.key ? sort.direction.toUpperCase() : 'SORT'}
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
              <tr className="border-t border-white/10 odd:bg-white/[0.03]" key={getRowId(row)}>
                {columns.map((column) => (
                  <td className="px-4 py-3 align-middle text-rmc-mist" key={column.key}>
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
