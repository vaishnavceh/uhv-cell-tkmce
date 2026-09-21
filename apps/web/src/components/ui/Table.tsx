import React from 'react';
import { cn } from '../../utils/cn';
import { Inbox } from 'lucide-react';

interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  isLoading?: boolean;
  isEmpty?: boolean;
  emptyMessage?: string;
  columnCount?: number;
}

export const Table: React.FC<TableProps> = ({
  className,
  children,
  isLoading = false,
  isEmpty = false,
  emptyMessage = 'No institutional records found.',
  columnCount = 5,
  ...props
}) => {
  return (
    <div className="w-full overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-subtle">
      <table className={cn('w-full text-left text-sm text-slate-700', className)} {...props}>
        {children}
        {isLoading && (
          <tbody>
            {[...Array(5)].map((_, i) => (
              <tr key={i} className="border-b border-slate-100 animate-pulse">
                {[...Array(columnCount)].map((_, j) => (
                  <td key={j} className="px-6 py-4">
                    <div className="h-4 bg-slate-200 rounded w-3/4" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        )}
        {!isLoading && isEmpty && (
          <tbody>
            <tr>
              <td colSpan={columnCount} className="py-12 text-center text-slate-400">
                <div className="flex flex-col items-center justify-center gap-2">
                  <Inbox className="w-8 h-8 text-slate-300" />
                  <p className="text-sm font-medium">{emptyMessage}</p>
                </div>
              </td>
            </tr>
          </tbody>
        )}
      </table>
    </div>
  );
};

export const Thead: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({
  className,
  ...props
}) => <thead className={cn('bg-slate-50 border-b border-slate-200', className)} {...props} />;

export const Tbody: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({
  className,
  ...props
}) => <tbody className={cn('divide-y divide-slate-100 bg-white', className)} {...props} />;

export const TableHead: React.FC<React.ThHTMLAttributes<HTMLTableCellElement>> = ({
  className,
  ...props
}) => (
  <th
    className={cn(
      'px-6 py-3.5 text-xs font-semibold tracking-wider text-slate-600 uppercase bg-slate-50 border-b border-slate-200',
      className,
    )}
    {...props}
  />
);

export const TableRow: React.FC<React.HTMLAttributes<HTMLTableRowElement>> = ({
  className,
  ...props
}) => (
  <tr
    className={cn(
      'border-b border-slate-100 hover:bg-slate-50/60 transition-colors duration-100',
      className,
    )}
    {...props}
  />
);

export const TableCell: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = ({
  className,
  ...props
}) => <td className={cn('px-6 py-4 text-sm text-slate-700 align-middle', className)} {...props} />;

export const Th = TableHead;
export const Tr = TableRow;
export const Td = TableCell;

