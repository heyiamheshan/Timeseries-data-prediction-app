"use client"

function tierFromPercent(pct) {
  if (pct < 5) return { label: "Excellent", color: "text-secondary", bg: "bg-secondary-light" }
  if (pct < 15) return { label: "Good", color: "text-amber-700", bg: "bg-amber-50" }
  return { label: "Poor", color: "text-danger", bg: "bg-danger-light" }
}

function tierFromR2(r2) {
  if (r2 > 0.9) return { label: "Excellent", color: "text-secondary", bg: "bg-secondary-light" }
  if (r2 > 0.7) return { label: "Good", color: "text-amber-700", bg: "bg-amber-50" }
  return { label: "Poor", color: "text-danger", bg: "bg-danger-light" }
}

export default function MetricsCards({ metrics }) {
  const mapeTier  = tierFromPercent(metrics.mape)
  const smapeTier = tierFromPercent(metrics.smape)
  const r2Tier    = tierFromR2(metrics.r2)

  const cards = [
    {
      label: "MAE",
      value: metrics.mae.toLocaleString(undefined, { maximumFractionDigits: 2 }),
      desc: "Mean Absolute Error",
      tier: mapeTier,
    },
    {
      label: "RMSE",
      value: metrics.rmse.toLocaleString(undefined, { maximumFractionDigits: 2 }),
      desc: "Root Mean Squared Error",
      tier: mapeTier,
    },
    {
      label: "MAPE",
      value: `${metrics.mape.toFixed(1)}%`,
      desc: "Mean Absolute % Error",
      tier: mapeTier,
    },
    {
      label: "sMAPE",
      value: `${metrics.smape.toFixed(1)}%`,
      desc: "Symmetric MAPE",
      tier: smapeTier,
    },
    {
      label: "R²",
      value: metrics.r2.toFixed(3),
      desc: "R-squared",
      tier: r2Tier,
    },
    {
      label: "Points",
      value: metrics.n_points.toLocaleString(),
      desc: "Comparison points",
      tier: null,
    },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
      {cards.map((c) => (
        <div key={c.label} className="bg-white rounded-xl border border-slate-200 shadow-card p-4">
          <p className="text-xs text-ink-muted mb-1">{c.label}</p>
          <p className={`text-xl font-semibold mb-1 ${c.tier ? c.tier.color : "text-ink"}`}>
            {c.value}
          </p>
          <p className="text-xs text-ink-faint mb-2">{c.desc}</p>
          {c.tier && (
            <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${c.tier.bg} ${c.tier.color}`}>
              {c.tier.label}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}
