"use client"
import { useState } from "react"
import { saveAs } from "file-saver"

export default function DownloadButton({ data }) {
  const [downloading, setDownloading] = useState(null)

  if (!data) return null

  const buildCSV = (includeHistorical) => {
    const rows = ["date,type,value,lower_bound,upper_bound"]
    if (includeHistorical) {
      data.historical.dates.forEach((date, i) => {
        rows.push(`${date},actual,${data.historical.values[i]},,`)
      })
    }
    data.forecast.dates.forEach((date, i) => {
      const lower = data.forecast.lower_bound[i] || ""
      const upper = data.forecast.upper_bound[i] || ""
      rows.push(`${date},predicted,${data.forecast.values[i]},${lower},${upper}`)
    })
    return rows.join("\n")
  }

  const handleDownload = async (type) => {
    setDownloading(type)
    try {
      const csv      = buildCSV(type === "full")
      const blob     = new Blob([csv], { type: "text/csv;charset=utf-8" })
      const filename = type === "full"
        ? "timesfm_full_data.csv"
        : "timesfm_forecast_only.csv"
      saveAs(blob, filename)
    } finally {
      setTimeout(() => setDownloading(null), 1000)
    }
  }

  const totalRows     = data.historical.dates.length + data.forecast.dates.length
  const forecastRows  = data.forecast.dates.length
  const forecastStart = data.forecast.dates[0]
  const forecastEnd   = data.forecast.dates[data.forecast.dates.length - 1]

  return (
    <div className="bg-surface rounded-2xl border border-surface-border p-5 space-y-4">

      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display font-600 text-white text-sm">Export results</h3>
          <p className="text-muted text-xs mt-0.5">
            {forecastStart} → {forecastEnd} · {forecastRows.toLocaleString()} predictions
          </p>
        </div>
        <span className="badge badge-emerald">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          Ready
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Full data */}
        <button
          onClick={() => handleDownload("full")}
          disabled={!!downloading}
          className="btn-secondary p-4 flex flex-col items-start gap-2 text-left disabled:opacity-50"
        >
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
            {downloading === "full" ? (
              <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#818CF8" strokeWidth="2">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/>
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#818CF8" strokeWidth="2" strokeLinecap="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
            )}
          </div>
          <div>
            <p className="text-white text-xs font-display font-500">Full dataset</p>
            <p className="text-muted text-xs font-mono mt-0.5">{totalRows.toLocaleString()} rows · actual + predicted</p>
          </div>
        </button>

        {/* Forecast only */}
        <button
          onClick={() => handleDownload("forecast")}
          disabled={!!downloading}
          className="btn-secondary p-4 flex flex-col items-start gap-2 text-left disabled:opacity-50"
        >
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            {downloading === "forecast" ? (
              <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/>
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2" strokeLinecap="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
            )}
          </div>
          <div>
            <p className="text-white text-xs font-display font-500">Forecast only</p>
            <p className="text-muted text-xs font-mono mt-0.5">{forecastRows.toLocaleString()} rows · predictions only</p>
          </div>
        </button>
      </div>

      {/* CSV schema */}
      <div className="rounded-xl bg-midnight border border-surface-border p-3">
        <p className="text-xs text-muted font-mono mb-2 uppercase tracking-wider">CSV schema</p>
        <code className="text-xs font-mono text-indigo-300">
          date, type, value, lower_bound, upper_bound
        </code>
      </div>
    </div>
  )
}
