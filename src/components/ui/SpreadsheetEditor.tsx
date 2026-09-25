'use client'

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
    if (col === 'id') return '150px'
    if (col.toLowerCase().includes('date')) return '130px'
    if (col.toLowerCase().includes('amount') || col === 'price') return '120px'
    return '160px'
  }

  return (
    <div className="fixed inset-0 z-[200] bg-slate-50 dark:bg-[#09090b] flex flex-col font-sans overflow-hidden">
      
      {/* 1. Top Navbar */}
      <div className="min-h-14 py-2 md:py-0 border-b border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#121215] flex flex-col md:flex-row items-start md:items-center justify-between px-4 md:px-6 shrink-0 shadow-xs z-50 gap-3 md:gap-0">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
            <Database className="h-4 w-4 text-blue-500 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="font-semibold text-sm leading-tight text-slate-900 dark:text-white">Import Configuration Editor</h1>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 hidden sm:block">Review and modify records before committing</p>
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-3 w-full md:w-auto justify-end">
          <button 
            type="button"
            onClick={onCancel} 
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] rounded-xl transition-colors flex-1 md:flex-none text-center cursor-pointer"
          >
            Cancel
          </button>
          <button 
            type="button"
            onClick={() => onApply(localData)} 
            className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-sm transition-colors flex-1 md:flex-none text-center cursor-pointer"
          >
            Confirm & Apply Data
          </button>
        </div>
      </div>

      {/* Main Body */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 bg-slate-50 dark:bg-[#09090b]">
        
        {/* 2. Left Sidebar */}
        <div className="w-full md:w-60 border-b md:border-b-0 md:border-r border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0d0d10] shrink-0 overflow-x-auto md:overflow-y-auto custom-scrollbar flex flex-row md:flex-col p-2 md:p-3 gap-1 z-40 items-center md:items-stretch">
          <h3 className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500 md:mb-1.5 px-2.5 hidden md:block">Data Tables</h3>
          {tables.map((table) => (
            <button
              key={table}
              type="button"
              onClick={() => handleTabChange(table)}
              className={`flex items-center justify-between px-3 py-2 text-xs font-medium rounded-xl transition-all text-left w-full cursor-pointer ${
                activeTab === table
                  ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.04] border border-transparent'
              }`}
            >
              <span className="capitalize whitespace-nowrap md:truncate pr-2">{table.replace(/([A-Z])/g, ' $1').trim()}</span>
              <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium tabular-nums ${activeTab === table ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300' : 'bg-slate-100 text-slate-600 dark:bg-white/[0.06] dark:text-zinc-400'}`}>
                {localData[table].length}
              </span>
            </button>
          ))}
        </div>

        {/* 3. Main Canvas */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0 relative bg-slate-50 dark:bg-[#09090b]" onKeyDown={handleKeyDown}>
          {activeData.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-zinc-500 p-6 text-center">
              <Database className="h-10 w-10 mb-3 opacity-30" />
              <p className="text-xs font-medium">No records found in this table</p>
            </div>
          ) : (
            <>
              {/* Table Container */}
              <div className="flex-1 overflow-auto custom-scrollbar relative">
                <table className="w-max min-w-full text-left border-collapse text-xs leading-tight select-none">
                  <thead className="sticky top-0 z-30 bg-slate-100 dark:bg-[#16161a] border-b border-slate-200/80 dark:border-white/[0.08]">
                    <tr>
                      <th className="px-3 py-2 font-medium text-slate-600 dark:text-zinc-400 border-r border-slate-200/80 dark:border-white/[0.06] whitespace-nowrap sticky left-0 z-40 bg-slate-100 dark:bg-[#16161a] w-12 text-center">
                        #
                      </th>
                      {columns.map((col) => {
                        const isId = col === 'id'
                        return (
                          <th 
                            key={col} 
                            onClick={() => handleSort(col)}
                            style={{ minWidth: getColMinWidth(col) }}
                            className={`px-3.5 py-2 font-medium text-slate-600 dark:text-zinc-400 border-r border-slate-200/80 dark:border-white/[0.06] whitespace-nowrap cursor-pointer hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/[0.04] transition-colors group ${isId ? 'sticky left-[48px] z-40 bg-slate-100 dark:bg-[#16161a]' : ''}`}
                          >
                            <div className="flex items-center gap-1.5">
                              <span>{col}</span>
                              {sortConfig?.key === col && (
                                sortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3 text-blue-500 dark:text-blue-400" /> : <ArrowDown className="h-3 w-3 text-blue-500 dark:text-blue-400" />
                              )}
                            </div>
                          </th>
                        )
                      })}
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-[#09090b]">
                    {paginatedData.map((rowWrapper, rowIndex) => {
                      const row = rowWrapper.item
                      const oIndex = rowWrapper.originalIndex
                      return (
                        <tr key={oIndex} className="group hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-none">
                          <td className="px-3 py-1.5 border-b border-r border-slate-200/80 dark:border-white/[0.06] text-slate-500 dark:text-zinc-500 tabular-nums text-[11px] sticky left-0 z-20 bg-slate-50 dark:bg-[#121215] text-center">
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
                                <td key={col} style={{ minWidth: getColMinWidth(col), maxWidth: '180px' }} className="px-3.5 py-1.5 border-b border-r border-slate-200/80 dark:border-white/[0.06] text-slate-500 dark:text-zinc-500 tabular-nums text-[11px] sticky left-[48px] z-20 bg-slate-50 dark:bg-[#121215] truncate">
                                  {val}
                                </td>
                              )
                            }

                            return (
                              <td 
                                key={col} 
                                onClick={() => setFocusedCell({ row: rowIndex, col })}
                                style={{ minWidth: getColMinWidth(col), maxWidth: '320px' }}
                                className={`p-0 border-b border-r border-slate-200/80 dark:border-white/[0.06] relative bg-white dark:bg-[#09090b] ${isFocused ? 'outline outline-2 outline-blue-500 outline-offset-[-2px] z-10' : ''}`}
                              >
                                {isEdited && !isFocused && (
                                  <div className="absolute top-0 right-0 h-0 w-0 border-t-[7px] border-r-[7px] border-l-[7px] border-b-0 border-t-amber-500 border-r-amber-500 border-l-transparent bg-transparent z-[5]" title="Unsaved change" />
                                )}
                                
                                {isObject ? (
                                  <div className="px-3.5 py-1.5 text-slate-400 dark:text-zinc-500 italic text-[11px]">
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
                                    className={`w-full h-full min-h-[30px] px-3.5 py-1.5 bg-transparent outline-none text-slate-800 dark:text-zinc-200 tabular-nums font-normal whitespace-nowrap text-ellipsis ${isEdited ? 'text-amber-800 dark:text-amber-300 font-medium bg-amber-50 dark:bg-amber-500/10' : ''}`}
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
              <div className="min-h-12 py-2 md:py-0 border-t border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#121215] flex flex-col md:flex-row items-center justify-between px-4 md:px-6 shrink-0 z-40 gap-2 md:gap-0">
                <span className="text-xs text-slate-600 dark:text-zinc-400 text-center md:text-left">
                  Showing <strong className="text-slate-900 dark:text-white tabular-nums">{(page - 1) * pageSize + 1}</strong> to <strong className="text-slate-900 dark:text-white tabular-nums">{Math.min(page * pageSize, activeData.length)}</strong> of <strong className="text-slate-900 dark:text-white tabular-nums">{activeData.length}</strong> items
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-1.5 rounded-lg border border-slate-200/80 dark:border-white/[0.08] text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                  <span className="text-xs font-medium px-2 text-slate-600 dark:text-zinc-400 tabular-nums">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-1.5 rounded-lg border border-slate-200/80 dark:border-white/[0.08] text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
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
