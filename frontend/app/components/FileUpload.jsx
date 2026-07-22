"use client"
import { useState, useCallback } from "react"

// Median gap (in days) between consecutive dates found in the date column
function detectFrequency(rawText, headers, dateColumn) {
  const colIndex = headers.findIndex(
    h => h.trim().toLowerCase() === dateColumn.trim().toLowerCase()
  )
  if (colIndex === -1) return "daily"

  const lines = rawText.split("\n").slice(1)
  const dates = []
  for (const line of lines) {
    if (!line.trim()) continue
    const value = line.split(",")[colIndex]
    const parsed = new Date(value)
    if (!isNaN(parsed)) dates.push(parsed)
    if (dates.length >= 30) break
  }
  if (dates.length < 2) return "daily"

  const gapsInDays = []
  for (let i = 1; i < dates.length; i++) {
    gapsInDays.push((dates[i] - dates[i - 1]) / (1000 * 60 * 60 * 24))
  }
  gapsInDays.sort((a, b) => a - b)
  const median = gapsInDays[Math.floor(gapsInDays.length / 2)]

  if (median <= 3) return "daily"
  if (median <= 10) return "weekly"
  return "monthly"
}

export default function FileUpload({ onForecast, loading }) {
  const [file, setFile]               = useState(null)
  const [rawText, setRawText]         = useState("")
  const [dateColumn, setDateColumn]   = useState("date")
  const [valueColumn, setValueColumn] = useState("value")
  const [frequency, setFrequency]     = useState("daily")
  const [horizon, setHorizon]         = useState(1095)
  const [dragOver, setDragOver]       = useState(false)
  const [preview, setPreview]         = useState(null)
  const [error, setError]             = useState("")

  const recomputeFrequency = (text, headers, dateCol) => {
    setFrequency(detectFrequency(text, headers, dateCol))
  }

  const handleFile = useCallback((uploadedFile) => {
    if (!uploadedFile?.name.endsWith(".csv")) {
      setError("Only CSV files are supported")
      return
    }
    setError("")
    setFile(uploadedFile)

    const reader = new FileReader()
    reader.onload = (e) => {
      const text    = e.target.result
      const lines   = text.split("\n").filter(Boolean)
      const headers = lines[0].split(",").map(h => h.trim())
      const rows    = lines.slice(1, 6).map(r => r.split(",").map(c => c.trim()))

      // Auto-detect columns
      const dateGuess  = headers.find(h => /date|time|day|month|year|period/i.test(h)) || headers[0]
      const valueGuess = headers.find(h => /value|sales|consumption|price|amount|quantity|revenue/i.test(h)) || headers[1]
      if (dateGuess)  setDateColumn(dateGuess)
      if (valueGuess) setValueColumn(valueGuess)

      setRawText(text)
      setPreview({ headers, rows, total: lines.length - 1 })
      recomputeFrequency(text, headers, dateGuess || "date")
    }
    reader.readAsText(uploadedFile)
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragOver(false)
    handleFile(e.dataTransfer.files[0])
  }, [handleFile])

  const handleDateColumnChange = (value) => {
    setDateColumn(value)
    if (rawText && preview) recomputeFrequency(rawText, preview.headers, value)
  }

  const handleSubmit = () => {
    if (!file) { setError("Please upload a CSV file first"); return }
    if (!horizon || horizon < 1) { setError("Please enter a valid number of rows to predict"); return }
    onForecast(file, dateColumn, valueColumn, frequency, horizon)
  }

  return (
    <div className="space-y-4">

      {/* Drop Zone */}
      <div
        className={`upload-zone rounded-2xl p-10 text-center cursor-pointer select-none ${dragOver ? "dragging" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => document.getElementById("csvInput").click()}
      >
        <input
          id="csvInput"
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => handleFile(e.target.files[0])}
        />

        {file ? (
          <div className="space-y-2">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <p className="text-white font-display font-500 text-sm">{file.name}</p>
            {preview && (
              <p className="text-muted text-xs font-mono">{preview.total.toLocaleString()} rows detected</p>
            )}
            <p className="text-indigo-400 text-xs">Click to change file</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="1.5" strokeLinecap="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
            </div>
            <div>
              <p className="text-white font-display font-500 text-sm">Drop your CSV file here</p>
              <p className="text-muted text-xs mt-1">or click to browse · max 50 MB</p>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs text-muted">
              <span className="badge badge-indigo">date column</span>
              <span className="text-surface-border">+</span>
              <span className="badge badge-emerald">value column</span>
              <span className="text-muted">required</span>
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F87171" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <p className="text-red-400 text-xs font-mono">{error}</p>
        </div>
      )}

      {/* Column Config */}
      {file && (
        <div className="bg-surface rounded-2xl border border-surface-border p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-white font-display font-500 text-sm">Column mapping</p>
            <span className="badge badge-indigo">auto-detected</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs text-muted font-mono uppercase tracking-wider">
                Date column
              </label>
              <input
                type="text"
                value={dateColumn}
                onChange={(e) => handleDateColumnChange(e.target.value)}
                className="input-field"
                placeholder="date"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted font-mono uppercase tracking-wider">
                Value column
              </label>
              <input
                type="text"
                value={valueColumn}
                onChange={(e) => setValueColumn(e.target.value)}
                className="input-field"
                placeholder="value"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs text-muted font-mono uppercase tracking-wider">
                Frequency
              </label>
              <div className="input-field flex items-center justify-between !cursor-default">
                <span className="capitalize text-white">{frequency}</span>
                <span className="text-[10px] uppercase tracking-wide text-muted">auto</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted font-mono uppercase tracking-wider">
                Rows to predict
              </label>
              <input
                type="number"
                min={1}
                value={horizon}
                onChange={(e) => setHorizon(parseInt(e.target.value, 10) || "")}
                className="input-field"
                placeholder="1095"
              />
            </div>
          </div>

          <div className="flex items-start gap-2 p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/10">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#818CF8" strokeWidth="2" className="mt-0.5 shrink-0">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
            <p className="text-xs text-indigo-300/70">
              Frequency is auto-detected from your date column.
              Extra columns are ignored automatically.
            </p>
          </div>
        </div>
      )}

      {/* CSV Preview */}
      {preview && (
        <div className="bg-surface rounded-2xl border border-surface-border overflow-hidden">
          <div className="px-5 py-3 border-b border-surface-border flex items-center justify-between">
            <p className="text-xs text-muted font-mono uppercase tracking-wider">
              Data preview
            </p>
            <span className="text-xs text-muted font-mono">
              showing 5 of {preview.total.toLocaleString()} rows
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="preview-table">
              <thead>
                <tr>
                  {preview.headers.map((h, i) => (
                    <th key={i}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((row, i) => (
                  <tr key={i}>
                    {row.map((cell, j) => (
                      <td key={j}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={loading || !file}
        className="btn-primary w-full py-3.5 px-6 text-sm flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
            </svg>
            Running TimesFM inference…
          </>
        ) : (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
            Generate Forecast
          </>
        )}
      </button>
    </div>
  )
}
