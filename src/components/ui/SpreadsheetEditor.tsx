import React, { useState, useMemo, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Database, ArrowUp, ArrowDown } from 'lucide-react'

interface SpreadsheetEditorProps {
  data: Record<string, any[]>
  onCancel: () => void
  onApply: (newData: Record<string, any[]>) => void
}

export function SpreadsheetEditor({ data, onCancel, onApply }: SpreadsheetEditorProps) {
  const [localData, setLocalData] = useState<Record<string, any[]>>(data)
  
  const tables = useMemo(() => Object.keys(localData).filter((key) => Array.isArray(localData[key])), [localData])

  const [activeTab, setActiveTab] = useState<string>(tables[0] || '')
  const [page, setPage] = useState(1)
  const pageSize = 50

  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null)
  const [focusedCell, setFocusedCell] = useState<{ row: number; col: string } | null>(null)
  const [editedCells, setEditedCells] = useState<Set<string>>(new Set())

  // Reset focus/page/sort on tab change
  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    setPage(1)
    setSortConfig(null)
    setFocusedCell(null)
  }

  const activeData = localData[activeTab] || []

  // Track original index for safe editing after sorting
  const dataWithOriginalIndex = useMemo(() => {
    return activeData.map((item, index) => ({ item, originalIndex: index }))
  }, [activeData])

  // Sorting
  const sortedData = useMemo(() => {
    if (!sortConfig) return dataWithOriginalIndex
    return [...dataWithOriginalIndex].sort((a, b) => {
      const aVal = a.item[sortConfig.key]
      const bVal = b.item[sortConfig.key]
      if (aVal === bVal) return 0
      if (aVal === null || aVal === undefined) return 1
      if (bVal === null || bVal === undefined) return -1
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })
  }, [dataWithOriginalIndex, sortConfig])

  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize))
  const paginatedData = sortedData.slice((page - 1) * pageSize, page * pageSize)

  // Columns extraction
  const columns = useMemo(() => {
    if (!activeData || activeData.length === 0) return []
    const keys = new Set<string>()
    activeData.slice(0, 15).forEach(item => {
      if (item && typeof item === 'object') {
        Object.keys(item).forEach(k => keys.add(k))
      }
    })
    return Array.from(keys).sort((a, b) => {
      if (a === 'id') return -1
      if (b === 'id') return 1
      return 0
    })
  }, [activeData])

  const editableCols = columns.filter(c => c !== 'id')

  const handleSort = (col: string) => {
    setSortConfig(prev => {
      if (prev?.key === col) {
        if (prev.direction === 'asc') return { key: col, direction: 'desc' }
        return null
      }
      return { key: col, direction: 'asc' }
    })
  }

  const handleCellChange = (originalIndex: number, column: string, value: string | number) => {
    setLocalData(prev => {
      const newData = { ...prev }
      const newArray = [...newData[activeTab]]
      newArray[originalIndex] = { ...newArray[originalIndex], [column]: value }
      newData[activeTab] = newArray
      return newData
    })
    
    setEditedCells(prev => {
      const next = new Set(prev)
      next.add(`${originalIndex}-${column}`)
      return next
    })
  }

  // Keyboard engine
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!focusedCell) return

    const { row, col } = focusedCell
    const colIndex = editableCols.indexOf(col)

    let nextRow = row
    let nextColIndex = colIndex

    if (e.key === 'ArrowDown' || e.key === 'Enter') {
      e.preventDefault()
      nextRow = Math.min(paginatedData.length - 1, row + 1)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      nextRow = Math.max(0, row - 1)
    } else if (e.key === 'Tab') {
      e.preventDefault()
      if (e.shiftKey) {
        if (colIndex > 0) nextColIndex = colIndex - 1
        else if (row > 0) { nextRow = row - 1; nextColIndex = editableCols.length - 1 }
      } else {
        if (colIndex < editableCols.length - 1) nextColIndex = colIndex + 1
        else if (row < paginatedData.length - 1) { nextRow = row + 1; nextColIndex = 0 }
      }
    } else if (e.key === 'ArrowRight' && (e.target as HTMLInputElement).selectionStart === (e.target as HTMLInputElement).value?.length) {
      if (colIndex < editableCols.length - 1) {
        e.preventDefault()
        nextColIndex = colIndex + 1
      }
    } else if (e.key === 'ArrowLeft' && (e.target as HTMLInputElement).selectionStart === 0) {
      if (colIndex > 0) {
        e.preventDefault()
        nextColIndex = colIndex - 1
      }
    }

    if (nextRow !== row || nextColIndex !== colIndex) {
      setFocusedCell({ row: nextRow, col: editableCols[nextColIndex] })
    }
  }

  const focusInputRef = (el: HTMLInputElement | null, isFocused: boolean) => {
    if (isFocused && el && document.activeElement !== el) {
      el.focus()
    }
  }

  // Calculate cell widths
  const getColMinWidth = (col: string) => {
    if (col === 'id') return '160px'
    if (col.toLowerCase().includes('date')) return '140px'
    if (col.toLowerCase().includes('amount') || col === 'price') return '120px'
    return '180px'
  }

  return (
    <div className="fixed inset-0 z-[200] bg-white dark:bg-neutral-950 flex flex-col font-sans overflow-hidden">
      
      {/* 1. Top Navbar */}
      <div className="min-h-14 py-2 md:py-0 border-b border-slate-300 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-900 flex flex-col md:flex-row items-start md:items-center justify-between px-4 md:px-6 shrink-0 shadow-sm z-50 gap-3 md:gap-0">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center border border-indigo-200 dark:border-indigo-800 shrink-0">
            <Database className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="font-bold text-[15px] leading-tight text-slate-800 dark:text-neutral-200">Import Configuration Editor</h1>
            <p className="text-[11px] font-medium text-slate-500 dark:text-neutral-400 hidden sm:block">Review and modify your database records before applying</p>
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-3 w-full md:w-auto justify-end">
          <button 
            onClick={onCancel} 
            className="px-3 py-1.5 md:px-4 md:py-2 text-[12px] md:text-[13px] font-bold uppercase tracking-wide text-slate-500 dark:text-neutral-400 hover:bg-slate-200 dark:hover:bg-neutral-800 rounded-lg transition-colors flex-1 md:flex-none text-center"
          >
            Cancel
          </button>
          <button 
            onClick={() => onApply(localData)} 
            className="px-3 py-1.5 md:px-5 md:py-2 text-[12px] md:text-[13px] font-bold uppercase tracking-wide text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors flex-1 md:flex-none text-center"
          >
            Confirm & Apply Data
          </button>
        </div>
      </div>

      {/* Main Body */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 bg-white dark:bg-neutral-950">
        
        {/* 2. Left Sidebar (Top scroll on mobile) */}
        <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-slate-300 dark:border-neutral-800 bg-slate-50/50 dark:bg-neutral-900/30 shrink-0 overflow-x-auto md:overflow-y-auto custom-scrollbar flex flex-row md:flex-col p-2 md:p-4 gap-1.5 z-40 items-center md:items-stretch">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500 md:mb-2 px-2 hidden md:block">Data Tables</h3>
          {tables.map((table) => (
            <button
              key={table}
              onClick={() => handleTabChange(table)}
              className={`flex items-center justify-between px-3 py-2 text-[13px] font-medium rounded-lg transition-all text-left ${
                activeTab === table
                  ? 'bg-white dark:bg-neutral-800 text-indigo-700 dark:text-indigo-400 shadow-sm border border-slate-200 dark:border-neutral-700 ring-1 ring-indigo-500/20'
                  : 'text-slate-600 dark:text-neutral-400 hover:bg-white/60 dark:hover:bg-neutral-800/50 border border-transparent'
              }`}
            >
              <span className="capitalize whitespace-nowrap md:truncate pr-2">{table.replace(/([A-Z])/g, ' $1').trim()}</span>
              <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold ${activeTab === table ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300' : 'bg-slate-200 dark:bg-neutral-800 text-slate-500 dark:text-neutral-400'}`}>
                {localData[table].length}
              </span>
            </button>
          ))}
        </div>

        {/* 3. Main Canvas */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0 relative bg-white dark:bg-neutral-950" onKeyDown={handleKeyDown}>
          {activeData.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-neutral-600 p-6 text-center">
              <Database className="h-12 w-12 mb-4 opacity-20" />
              <p className="text-sm font-medium">No records found in this table</p>
            </div>
          ) : (
            <>
              {/* Table Container */}
              <div className="flex-1 overflow-auto custom-scrollbar relative">
                <table className="w-max min-w-full text-left border-collapse text-[13px] leading-tight select-none">
                  <thead className="sticky top-0 z-30 bg-slate-100 dark:bg-neutral-900 shadow-[0_1px_0_rgba(203,213,225,1)] dark:shadow-[0_1px_0_rgba(64,64,64,1)]">
                    <tr>
                      <th className="px-3 py-2 font-medium text-slate-500 dark:text-neutral-400 border-b border-r border-slate-300 dark:border-neutral-700 whitespace-nowrap sticky left-0 z-40 bg-slate-100 dark:bg-neutral-900 w-14 text-center">
                        #
                      </th>
                      {columns.map((col) => {
                        const isId = col === 'id'
                        return (
                          <th 
                            key={col} 
                            onClick={() => handleSort(col)}
                            style={{ minWidth: getColMinWidth(col) }}
                            className={`px-4 py-2 font-medium text-slate-500 dark:text-neutral-400 border-b border-r border-slate-300 dark:border-neutral-700 whitespace-nowrap cursor-pointer hover:bg-slate-200/50 dark:hover:bg-neutral-800/50 transition-colors group ${isId ? 'sticky left-[55px] z-40 bg-slate-100 dark:bg-neutral-900 shadow-[1px_0_0_rgba(203,213,225,1)] dark:shadow-[1px_0_0_rgba(64,64,64,1)]' : ''}`}
                          >
                            <div className="flex items-center gap-1.5">
                              {col}
                              {sortConfig?.key === col && (
                                sortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3 text-indigo-500" /> : <ArrowDown className="h-3 w-3 text-indigo-500" />
                              )}
                            </div>
                          </th>
                        )
                      })}
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-neutral-950">
                    {paginatedData.map((rowWrapper, rowIndex) => {
                      const row = rowWrapper.item
                      const oIndex = rowWrapper.originalIndex
                      return (
                        <tr key={oIndex} className="group hover:bg-slate-50/50 dark:hover:bg-neutral-900/50 transition-none">
                          <td className="px-3 py-1.5 border-b border-r border-slate-300 dark:border-neutral-700 text-slate-400 dark:text-neutral-500 font-mono text-[11px] sticky left-0 z-20 bg-slate-100 dark:bg-neutral-900 text-center shadow-[1px_0_0_rgba(203,213,225,1)] dark:shadow-[1px_0_0_rgba(64,64,64,1)]">
                            {(page - 1) * pageSize + rowIndex + 1}
                          </td>
                          {columns.map((col) => {
                            const val = row[col]
                            const isId = col === 'id'
                            const isObject = val !== null && typeof val === 'object'
                            const isNumber = typeof val === 'number'
                            const isFocused = focusedCell?.row === rowIndex && focusedCell?.col === col
                            const isEdited = editedCells.has(`${oIndex}-${col}`)

                            if (isId) {
                              return (
                                <td key={col} style={{ minWidth: getColMinWidth(col), maxWidth: '200px' }} className="px-4 py-1.5 border-b border-r border-slate-300 dark:border-neutral-700 text-slate-400 dark:text-neutral-500 font-mono text-[11px] sticky left-[55px] z-20 bg-slate-50 dark:bg-[#111] truncate shadow-[1px_0_0_rgba(203,213,225,1)] dark:shadow-[1px_0_0_rgba(64,64,64,1)]">
                                  {val}
                                </td>
                              )
                            }

                            return (
                              <td 
                                key={col} 
                                onClick={() => setFocusedCell({ row: rowIndex, col })}
                                style={{ minWidth: getColMinWidth(col), maxWidth: '350px' }}
                                className={`p-0 border-b border-r border-slate-300 dark:border-neutral-700 relative bg-white dark:bg-neutral-950 ${isFocused ? 'outline outline-2 outline-blue-500 outline-offset-[-2px] z-10' : ''}`}
                              >
                                {isEdited && !isFocused && (
                                  <div className="absolute top-0 right-0 h-0 w-0 border-t-[8px] border-r-[8px] border-l-[8px] border-b-0 border-t-amber-500 border-r-amber-500 border-l-transparent bg-transparent z-[5]" title="Unsaved change" />
                                )}
                                
                                {isObject ? (
                                  <div className="px-4 py-1.5 text-slate-400 dark:text-neutral-500 italic text-[11px]">
                                    [Object]
                                  </div>
                                ) : (
                                  <input
                                    ref={(el) => focusInputRef(el, isFocused)}
                                    type={isNumber ? "number" : "text"}
                                    value={val === null || val === undefined ? '' : val}
                                    onChange={(e) => {
                                      const newVal = e.target.value
                                      if (isNumber) {
                                        handleCellChange(oIndex, col, newVal === '' ? 0 : Number(newVal))
                                      } else {
                                        handleCellChange(oIndex, col, newVal)
                                      }
                                    }}
                                    onFocus={() => setFocusedCell({ row: rowIndex, col })}
                                    className={`w-full h-full min-h-[32px] px-4 py-1.5 bg-transparent outline-none text-slate-800 dark:text-neutral-200 font-normal whitespace-nowrap text-ellipsis ${isEdited ? 'text-amber-700 dark:text-amber-400 font-medium bg-amber-50/20 dark:bg-amber-900/10' : ''}`}
                                  />
                                )}
                              </td>
                            )
                          })}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* 4. Pagination Footer */}
              <div className="min-h-12 py-2 md:py-0 border-t border-slate-300 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex flex-col md:flex-row items-center justify-between px-4 md:px-6 shrink-0 z-40 gap-2 md:gap-0">
                <span className="text-[12px] md:text-[13px] text-slate-500 dark:text-neutral-400 text-center md:text-left">
                  Showing <strong className="text-slate-800 dark:text-neutral-200">{(page - 1) * pageSize + 1}</strong> to <strong className="text-slate-800 dark:text-neutral-200">{Math.min(page * pageSize, activeData.length)}</strong> of <strong className="text-slate-800 dark:text-neutral-200">{activeData.length}</strong> items
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-neutral-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-[13px] font-medium px-3 text-slate-600 dark:text-neutral-400">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-neutral-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
