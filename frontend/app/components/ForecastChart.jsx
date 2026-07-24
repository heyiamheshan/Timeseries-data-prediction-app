"use client"
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer
} from "recharts"

export default function ForecastChart({ data }) {
  if (!data) return null

  // Combine historical and forecast into one array
  const chartData = [
    // Historical points
    ...data.historical.dates.map((date, i) => ({
      date,
      actual: data.historical.values[i],
      predicted: null,
      lower: null,
      upper: null,
    })),
    // Forecast points
    ...data.forecast.dates.map((date, i) => ({
      date,
      actual: null,
      predicted: parseFloat(data.forecast.values[i]?.toFixed(2)),
      lower: data.forecast.lower_bound[i]
        ? parseFloat(data.forecast.lower_bound[i]?.toFixed(2))
        : null,
      upper: data.forecast.upper_bound[i]
        ? parseFloat(data.forecast.upper_bound[i]?.toFixed(2))
        : null,
    })),
  ]

  // Forecast start date for reference line
  const forecastStartDate = data.forecast.dates[0]

  // Show every Nth label to avoid crowding
  const totalPoints = chartData.length
  const labelInterval = Math.floor(totalPoints / 12)

  const formatTooltip = (value, name) => {
    if (value === null) return null
    const labels = {
      actual   : "Actual",
      predicted: "Predicted",
      lower    : "Lower Bound",
      upper    : "Upper Bound",
    }
    return [value?.toLocaleString(), labels[name] || name]
  }

  return (
    <div className="bg-white rounded-xl shadow-card border border-slate-200 p-6 mb-6">
      <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
        <div>
          <h2 className="text-base font-semibold text-ink">
            Forecast Visualization
          </h2>
          <p className="text-sm text-ink-muted">
            Historical data + {data.forecast.dates.length.toLocaleString()}-row TimesFM prediction
          </p>
        </div>
        <div className="text-right text-xs text-ink-muted space-y-0.5">
          <p>Historical&nbsp;&nbsp;{data.historical.dates.length} points</p>
          <p>Forecast&nbsp;&nbsp;&nbsp;&nbsp;{data.forecast.dates.length} points</p>
          <p>Model&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{data.metadata.model}</p>
        </div>
      </div>

      {/* Main Chart */}
      <ResponsiveContainer width="100%" height={420}>
        <ComposedChart
          data={chartData}
          margin={{ top: 10, right: 20, left: 20, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />

          <XAxis
            dataKey="date"
            tick={{ fontSize: 11 }}
            interval={labelInterval}
            angle={-30}
            textAnchor="end"
            height={50}
          />

          <YAxis
            tick={{ fontSize: 11 }}
            tickFormatter={(v) => v?.toLocaleString()}
            width={80}
          />

          <Tooltip
            formatter={formatTooltip}
            labelStyle={{ fontWeight: "bold" }}
          />

          <Legend verticalAlign="top" height={36} />

          {/* Confidence interval shading */}
          <Area
            type="monotone"
            dataKey="upper"
            stroke="none"
            fill="#bbf7d0"
            fillOpacity={0.4}
            name="upper"
            legendType="none"
          />
          <Area
            type="monotone"
            dataKey="lower"
            stroke="none"
            fill="#ffffff"
            fillOpacity={1}
            name="lower"
            legendType="none"
          />

          {/* Actual historical line */}
          <Line
            type="monotone"
            dataKey="actual"
            stroke="#2563eb"
            strokeWidth={2}
            dot={false}
            name="actual"
            connectNulls={false}
          />

          {/* Predicted line */}
          <Line
            type="monotone"
            dataKey="predicted"
            stroke="#16a34a"
            strokeWidth={2}
            strokeDasharray="6 3"
            dot={false}
            name="predicted"
            connectNulls={false}
          />

          {/* Forecast start vertical line */}
          <ReferenceLine
            x={forecastStartDate}
            stroke="#dc2626"
            strokeDasharray="4 2"
            label={{
              value: "Forecast Start",
              position: "top",
              fontSize: 11,
              fill: "#dc2626"
            }}
          />
        </ComposedChart>
      </ResponsiveContainer>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-5 border-t border-slate-200">
        <div className="text-center">
          <p className="text-xs text-ink-muted mb-1">Frequency</p>
          <p className="font-semibold text-ink capitalize">
            {data.metadata.frequency}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-ink-muted mb-1">Forecast Points</p>
          <p className="font-semibold text-ink">
            {data.metadata.horizon}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-ink-muted mb-1">Predicted Min</p>
          <p className="font-semibold text-ink">
            {Math.min(...data.forecast.values).toFixed(2)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-ink-muted mb-1">Predicted Max</p>
          <p className="font-semibold text-ink">
            {Math.max(...data.forecast.values).toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  )
}