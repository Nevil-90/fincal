'use client'

import React from 'react'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from 'recharts'
import { MetricConfig, ChartMode } from './travel-chart-types'
import SingleChartTooltip from './TravelChartTooltip'

interface TravelLineChartCanvasProps {
  chartData: any[]
  chartMode: ChartMode
  activeConfig: MetricConfig
  yDomainMax: number
  selectedYear: number
  compareYear: number
}

export default function TravelLineChartCanvas({
  chartData,
  chartMode,
  activeConfig,
  yDomainMax,
  selectedYear,
  compareYear
}: TravelLineChartCanvasProps) {
  return (
    <div className="h-72 sm:h-80 w-full pt-2">
      <ResponsiveContainer width="100%" height="100%">
        {chartMode === 'difference' ? (
          <LineChart data={chartData} margin={{ top: 15, right: 10, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="4 4" stroke="currentColor" className="text-slate-200 dark:text-neutral-800" vertical={false} />
            <XAxis
              dataKey="monthName"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: '#737373', fontWeight: 600 }}
              dy={10}
            />
            <YAxis
              width={55}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: '#737373', fontFamily: 'monospace', fontWeight: 500 }}
              tickFormatter={value => {
                try {
                  return activeConfig.formatCompact(Number(value) || 0)
                } catch {
                  return String(value)
                }
              }}
              domain={[-yDomainMax, yDomainMax]}
              allowDecimals={false}
            />
            <Tooltip
              content={
                <SingleChartTooltip
                  selectedYear={selectedYear}
                  compareYear={compareYear}
                  metricConfig={activeConfig}
                  mode={chartMode}
                />
              }
            />
            <ReferenceLine y={0} stroke="#737373" strokeDasharray="4 4" opacity={0.5} />
            <Line
              type="linear"
              dataKey={activeConfig.diffKey}
              name="Net Difference"
              stroke={activeConfig.colorDiff}
              strokeWidth={2.5}
              dot={{ r: 4.5, fill: activeConfig.colorDiff, stroke: '#ffffff', strokeWidth: 2 }}
              activeDot={{ r: 6.5, fill: activeConfig.colorDiff, stroke: '#ffffff', strokeWidth: 2 }}
              isAnimationActive={false}
              connectNulls={true}
            />
          </LineChart>
        ) : (
          <LineChart data={chartData} margin={{ top: 15, right: 10, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="4 4" stroke="currentColor" className="text-slate-200 dark:text-neutral-800" vertical={false} />
            <XAxis
              dataKey="monthName"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: '#737373', fontWeight: 600 }}
              dy={10}
            />
            <YAxis
              width={55}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: '#737373', fontFamily: 'monospace', fontWeight: 500 }}
              tickFormatter={value => {
                try {
                  return activeConfig.formatCompact(Number(value) || 0)
                } catch {
                  return String(value)
                }
              }}
              domain={[0, yDomainMax]}
              allowDecimals={false}
            />
            <Tooltip
              content={
                <SingleChartTooltip
                  selectedYear={selectedYear}
                  compareYear={compareYear}
                  metricConfig={activeConfig}
                  mode={chartMode}
                />
              }
            />
            <Line
              type="linear"
              dataKey={activeConfig.currentKey}
              name={`${selectedYear}`}
              stroke={activeConfig.colorCurrent}
              strokeWidth={3}
              dot={{ r: 4.5, fill: activeConfig.colorCurrent, stroke: '#ffffff', strokeWidth: 2 }}
              activeDot={{ r: 6.5, fill: activeConfig.colorCurrent, stroke: '#ffffff', strokeWidth: 2 }}
              isAnimationActive={false}
              connectNulls={true}
            />
            <Line
              type="linear"
              dataKey={activeConfig.compareKey}
              name={`${compareYear}`}
              stroke={activeConfig.colorCompare}
              strokeWidth={2.5}
              strokeDasharray="5 5"
              dot={{ r: 4, fill: activeConfig.colorCompare, stroke: '#ffffff', strokeWidth: 1.5 }}
              activeDot={{ r: 6, fill: activeConfig.colorCompare, stroke: '#ffffff', strokeWidth: 2 }}
              isAnimationActive={false}
              connectNulls={true}
            />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  )
}
