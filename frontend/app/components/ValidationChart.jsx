"use client"
import {
  ComposedChart,
  BarChart,
  Bar,
  Line,
  Area,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts"

export default function ValidationChart({ data }) {
  if (!data) return null

  const { context, held_out, predicted } = data

  const chartData = [
    ...context.dates.map((date, i) => ({
      date,
      context: context.values[i],
      actual: null,
      predicted: null,
      lower: null,
      upper: null,
    })),
    ...held_out.dates.map((date, i) => ({
      date,
      context: null,
      actual: held_out.values[i],
      predicted: parseFloat(predicted.values[i]?.toFixed(2)),
      lower: predicted.lower_bound[i] ? parseFloat(predicted.lower_bound[i]?.toFixed(2)) : null,
      upper: predicted.upper_bound[i] ? parseFloat(predicted.upper_bound[i]?.toFixed(2)) : null,
    })),
  ]

  const splitDate = held_out.dates[0]
  const totalPoints = chartData.length
  const labelInterval = Math.max(Math.floor(totalPoints / 12), 0)

  const residualData = held_out.dates.map((date, i) => ({
    date,
    residual: parseFloat((held_out.values[i] - predicted.values[i]).toFixed(2)),
  }))

  const formatTooltip = (value, name) => {
    if (value === null || value === undefined) return null
    const labels = {
      context: "Context",
      actual: "Actual (held-out)",
      predicted: "Predicted",
      lower: "Lower Bound",
      upper: "Upper Bound",
    }
    return [value?.toLocaleString(), labels[name] || name]
  }

  return (
    <div className="space-y-6">
      {/* Main comparison chart */}
      <div className="bg-white rounded-xl shadow-card border border-slate-200 p-6">
        <h2 className="text-base font-semibold text-ink mb-1">
          Validation Chart
        </h2>
        <p className="text-sm text-ink-muted mb-4">
          Context fed to TimesFM, actual held-out values, and predictions
        </p>

        <ResponsiveContainer width="100%" height={420}>
          <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 20, bottom: 20 }}>
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

            <Tooltip formatter={formatTooltip} labelStyle={{ fontWeight: "bold" }} />
            <Legend verticalAlign="top" height={36} />

            {/* Confidence band */}
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

            {/* Context line */}
            <Line
              type="monotone"
              dataKey="context"
              stroke="#94a3b8"
              strokeWidth={2}
              dot={false}
              name="context"
              connectNulls={false}
            />

            {/* Actual held-out line */}
            <Line
              type="monotone"
              dataKey="actual"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={false}
              name="actual"
              connectNulls={false}
            />

            {/* Predicted line */}
            <Line
              type="monotone"
              dataKey="predicted"
              stroke="#2563eb"
              strokeWidth={2}
              strokeDasharray="6 3"
              dot={false}
              name="predicted"
              connectNulls={false}
            />

            <ReferenceLine
              x={splitDate}
              stroke="#dc2626"
              strokeDasharray="4 2"
              label={{ value: "Validation split", position: "top", fontSize: 11, fill: "#dc2626" }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Residual chart */}
      <div className="bg-white rounded-xl shadow-card border border-slate-200 p-6">
        <h2 className="text-base font-semibold text-ink mb-1">
          Residuals — actual minus predicted
        </h2>
        <p className="text-sm text-ink-muted mb-4">
          Green bars mean the model under-predicted, red bars mean it over-predicted
        </p>

        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={residualData} margin={{ top: 10, right: 20, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11 }}
              interval={Math.max(Math.floor(residualData.length / 12), 0)}
              angle={-30}
              textAnchor="end"
              height={50}
            />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => v?.toLocaleString()} width={80} />
            <Tooltip formatter={(v) => [v?.toLocaleString(), "Residual"]} />
            <ReferenceLine y={0} stroke="#94a3b8" />
            <Bar dataKey="residual" name="residual">
              {residualData.map((entry, i) => (
                <Cell key={i} fill={entry.residual >= 0 ? "#16a34a" : "#dc2626"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
