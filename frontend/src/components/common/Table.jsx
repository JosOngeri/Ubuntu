import React, { useState } from 'react'

const Table = ({ columns, data, loading = false, className = '' }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  if (loading) {
    return (
      <div className="w-full overflow-x-auto">
        <div className="flex items-center justify-center py-8 text-slate-600 dark:text-slate-400">
          Loading...
        </div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="w-full overflow-x-auto">
        <div className="flex items-center justify-center py-8 text-slate-600 dark:text-slate-400">
          No data available
        </div>
      </div>
    )
  }

  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = data.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(data.length / rowsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleRowsPerPageChange = (e) => {
    setRowsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  return (
    <div className={`w-full overflow-x-auto ${className}`}>
      <table className="w-full border-collapse">
        <thead className="bg-slate-100 dark:bg-slate-800">
          <tr>
            {columns.map((col) => (
              <th 
                key={col.key} 
                style={{ width: col.width }}
                className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-700"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {currentRows.map((row, rowIdx) => (
            <tr 
              key={rowIdx}
              className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors duration-150"
            >
              {columns.map((col) => (
                <td 
                  key={col.key}
                  className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                >
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-700 gap-4">
        <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
          <span>Show</span>
          <select 
            value={rowsPerPage} 
            onChange={handleRowsPerPageChange}
            className="mx-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
          <span>entries</span>
        </div>
        
        <div className="flex items-center space-x-2 text-sm">
          <button 
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            Previous
          </button>
          <span className="text-slate-600 dark:text-slate-400">
            Page {currentPage} of {totalPages || 1}
          </span>
          <button 
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages || totalPages === 0}
            className="px-3 py-1 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}

export default Table
