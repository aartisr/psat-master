import React from 'react';
import { QuestionTable } from '../types';
import { formatMathText } from './common/MathRenderer';

interface DataTableProps {
  data?: QuestionTable;
  table?: QuestionTable;
  className?: string;
}

export const DataTable: React.FC<DataTableProps> = ({ data, table, className = '' }) => {
  const tableData = data || table;

  if (!tableData || !Array.isArray(tableData.headers) || tableData.headers.length === 0) {
    return null;
  }

  const { title, headers, rows = [] } = tableData;
  if (!Array.isArray(rows) || rows.length === 0) {
    return null;
  }

  return (
    <div className={`inline-block border-2 border-slate-800 rounded-md overflow-hidden bg-white shadow-xs my-3.5 max-w-full ${className}`}>
      {title && (
        <div className="bg-slate-100 border-b-2 border-slate-800 px-4 py-1.5 text-center text-xs font-bold text-slate-900 font-serif">
          {formatMathText(title)}
        </div>
      )}
      <table className="border-collapse text-xs sm:text-sm w-auto min-w-[200px]">
        <thead>
          <tr className="border-b-2 border-slate-800 bg-slate-50">
            {headers.map((header, idx) => (
              <th
                key={idx}
                className={`py-2 px-6 font-bold text-slate-900 text-center ${
                  idx < headers.length - 1 ? 'border-r-2 border-slate-800' : ''
                }`}
              >
                <span className="font-serif italic font-semibold">{formatMathText(header)}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y border-slate-800">
          {rows.map((row, rowIdx) => (
            <tr
              key={rowIdx}
              className={`hover:bg-slate-50/60 transition-colors ${
                rowIdx < rows.length - 1 ? 'border-b border-slate-800' : ''
              }`}
            >
              {row.map((cell, cellIdx) => (
                <td
                  key={cellIdx}
                  className={`py-2 px-6 text-center text-slate-900 font-medium ${
                    cellIdx < row.length - 1 ? 'border-r-2 border-slate-800' : ''
                  }`}
                >
                  {typeof cell === 'string' ? formatMathText(cell) : cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};



