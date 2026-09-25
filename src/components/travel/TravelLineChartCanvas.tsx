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
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" vertical={false} />
            <XAxis
              dataKey="monthName"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: '#71717a', fontWeight: 500 }}
              dy={10}
            />
            <YAxis
              width={55}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: '#71717a', fontFamily: 'var(--font-sans), sans-serif', fontWeight: 500 }}
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
            <ReferenceLine y={0} stroke="#71717a" strokeDasharray="3 3" opacity={0.3} />
            <Line
              type="linear"
              dataKey={activeConfig.diffKey}
              name="Net Difference"
              stroke={activeConfig.colorDiff}
              strokeWidth={2.5}
              dot={{ r: 4, fill: activeConfig.colorDiff, stroke: '#94a3b8', strokeWidth: 1.5 }}
              activeDot={{ r: 6, fill: activeConfig.colorDiff, stroke: '#94a3b8', strokeWidth: 2 }}
              isAnimationActive={false}
              connectNulls={true}
            />
          </LineChart>
        ) : (
          <LineChart data={chartData} margin={{ top: 15, right: 10, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" vertical={false} />
            <XAxis
              dataKey="monthName"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: '#71717a', fontWeight: 500 }}
              dy={10}
            />
            <YAxis
              width={55}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: '#71717a', fontFamily: 'var(--font-sans), sans-serif', fontWeight: 500 }}
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
              dot={{ r: 4, fill: activeConfig.colorCurrent, stroke: '#94a3b8', strokeWidth: 1.5 }}
              activeDot={{ r: 6, fill: activeConfig.colorCurrent, stroke: '#94a3b8', strokeWidth: 2 }}
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
              dot={{ r: 4, fill: activeConfig.colorCompare, stroke: '#94a3b8', strokeWidth: 1.5 }}
              activeDot={{ r: 6, fill: activeConfig.colorCompare, stroke: '#94a3b8', strokeWidth: 2 }}
              isAnimationActive={false}
              connectNulls={true}
            />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  )
}
