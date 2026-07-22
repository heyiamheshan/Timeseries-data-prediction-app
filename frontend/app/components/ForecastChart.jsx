"use client"
import {
  ComposedChart, Line, Area,
  XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ReferenceLine,
  ResponsiveContainer
} from "recharts"

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface border border-surface-border rounded-xl p-3 shadow-xl text-xs font-mono">
      <p className="text-muted mb-2">{label}</p>
      {payload.map((entry, i) => (
        entry.value !== null && (
          <div key={i} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ background: entry.color }}></span>
            <span className="text-muted">{entry.name}:</span>
            <span className="text-white font-500">{entry.value?.toLocaleString(undefined, { maximumFractionDigits: 1 })}</span>
          </div>
        )
      ))}
    </div>
  )
}

export default function ForecastChart({ data }) {
  if (!data) return null

  const chartData = [
    ...data.historical.dates.map((date, i) => ({
      date,
      actual   : data.historical.values[i],
      predicted: null,
      lower    : null,
      upper    : null,
    })),
    ...data.forecast.dates.map((date, i) => ({
      date,
      actual   : null,
      predicted: parseFloat(data.forecast.values[i]?.toFixed(1)),
      lower    : data.forecast.lower_bound[i] ? parseFloat(data.forecast.lower_bound[i]?.toFixed(1)) : null,
      upper    : data.forecast.upper_bound[i] ? parseFloat(data.forecast.upper_bound[i]?.toFixed(1)) : null,
    })),
  ]

  const forecastStart  = data.forecast.dates[0]
  const totalPoints    = chartData.length
  const labelInterval  = Math.floor(totalPoints / 10)
  const predMin        = Math.min(...data.forecast.values).toFixed(1)
  const predMax        = Math.max(...data.forecast.values).toFixed(1)
  const predMean       = (data.forecast.values.reduce((a, b) => a + b, 0) / data.forecast.values.length).toFixed(1)
  const histMean       = (data.historical.values.reduce((a, b) => a + b, 0) / data.historical.values.length).toFixed(1)
  const change         = (((predMean - histMean) / histMean) * 100).toFixed(1)

  const stats = [
    { label: "Historical points", value: data.historical.dates.length.toLocaleString(), badge: "actual" },
    { label: "Forecast points",   value: data.metadata.horizon.toLocaleString(),        badge: "predicted" },
    { label: "Predicted min",     value: parseFloat(predMin).toLocaleString(),           badge: "neutral" },
    { label: "Predicted max",     value: parseFloat(predMax).toLocaleString(),           badge: "neutral" },
    { label: "Predicted mean",    value: parseFloat(predMean).toLocaleString(),          badge: "neutral" },
    { label: "vs historical avg", value: `${change > 0 ? "+" : ""}${change}%`,          badge: change > 0 ? "up" : "down" },
  ]

  return (
    <div className="space-y-4">

      {/* Stats row */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {stats.map((s, i) => (
          <div key={i} className="stat-card">
            <p className="text-muted text-xs font-mono mb-1">{s.label}</p>
            <p className={`font-display font-600 text-sm ${
              s.badge === "up"        ? "text-emerald-400" :
              s.badge === "down"      ? "text-red-400" :
              s.badge === "actual"    ? "text-amber-400" :
              s.badge === "predicted" ? "text-indigo-400" :
              "text-white"
            }`}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-surface rounded-2xl border border-surface-border p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-display font-600 text-white text-sm">Forecast Overview</h3>
            <p className="text-muted text-xs mt-0.5">Historical context + {data.forecast.dates.length.toLocaleString()}-row TimesFM prediction</p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-0.5 bg-amber-400 rounded"></div>
              <span className="text-muted font-mono">Actual</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-0.5 bg-indigo-400 rounded" style={{ borderTop: "2px dashed #6366F1", background: "none" }}></div>
              <span className="text-muted font-mono">Predicted</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-3 rounded" style={{ background: "rgba(16,185,129,0.15)" }}></div>
              <span className="text-muted font-mono">Confidence</span>
            </div>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={360}>
          <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 20 }}>
            <defs>
              <linearGradient id="confidenceGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity={0.15}/>
                <stop offset="100%" stopColor="#10B981" stopOpacity={0.02}/>
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.04)"
              vertical={false}
            />

            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: "#6B7280", fontFamily: "JetBrains Mono" }}
              interval={labelInterval}
              angle={-30}
              textAnchor="end"
              height={44}
              axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
              tickLine={false}
            />

            <YAxis
              tick={{ fontSize: 10, fill: "#6B7280", fontFamily: "JetBrains Mono" }}
              tickFormatter={(v) => v?.toLocaleString()}
              width={70}
              axisLine={false}
              tickLine={false}
            />

            <Tooltip content={<CustomTooltip />} />

            {/* Confidence band */}
            <Area
              type="monotone"
              dataKey="upper"
              stroke="none"
              fill="url(#confidenceGrad)"
              name="upper"
              legendType="none"
            />
            <Area
              type="monotone"
              dataKey="lower"
              stroke="none"
              fill="var(--color-midnight)"
              name="lower"
              legendType="none"
            />

            {/* Actual */}
            <Line
              type="monotone"
              dataKey="actual"
              stroke="#F59E0B"
              strokeWidth={1.5}
              dot={false}
              name="Actual"
              connectNulls={false}
            />

            {/* Predicted */}
            <Line
              type="monotone"
              dataKey="predicted"
              stroke="#6366F1"
              strokeWidth={1.5}
              strokeDasharray="5 3"
              dot={false}
              name="Predicted"
              connectNulls={false}
            />

            {/* Forecast start line */}
            <ReferenceLine
              x={forecastStart}
              stroke="rgba(255,255,255,0.15)"
              strokeDasharray="4 3"
              label={{
                value: "Forecast start",
                position: "top",
                fontSize: 10,
                fill: "#6B7280",
                fontFamily: "JetBrains Mono"
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>

        {/* Model info footer */}
        <div className="mt-4 pt-4 border-t border-surface-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="badge badge-indigo">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
              {data.metadata.model}
            </span>
            <span className="badge badge-amber">{data.metadata.frequency}</span>
          </div>
          <p className="text-xs text-muted font-mono">
            Zero-shot · no fine-tuning
          </p>
        </div>
      </div>
    </div>
  )
}
