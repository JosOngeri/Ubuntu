import React from 'react'

const Table = ({ columns, data, loading = false, className = '' }) => {
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
          {data.map((row, rowIdx) => (
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
    </div>
  )
}

export default Table
