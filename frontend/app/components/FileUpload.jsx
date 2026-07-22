"use client"
import { useState, useEffect } from "react"

// Median gap (in days) between consecutive dates found in the date column
function detectFrequency(rawText, headers, dateColumn) {
  const colIndex = headers.findIndex(
    h => h.trim().toLowerCase() === dateColumn.trim().toLowerCase()
  )
  if (colIndex === -1) return null

  const lines = rawText.split("\n").slice(1)
  const dates = []
  for (const line of lines) {
    if (!line.trim()) continue
    const value = line.split(",")[colIndex]
    const parsed = new Date(value)
    if (!isNaN(parsed)) dates.push(parsed)
    if (dates.length >= 30) break
  }
  if (dates.length < 2) return null

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
  const [file, setFile]           = useState(null)
  const [rawText, setRawText]     = useState("")
  const [dateColumn, setDateColumn] = useState("date")
  const [valueColumn, setValueColumn] = useState("value")
  const [frequency, setFrequency] = useState(null)
  const [dragOver, setDragOver]   = useState(false)
  const [preview, setPreview]     = useState(null)
  const [error, setError]         = useState("")

  // Re-detect frequency whenever the date column name or file content changes
  useEffect(() => {
    if (!rawText || !preview) return
    setFrequency(detectFrequency(rawText, preview.headers, dateColumn))
  }, [rawText, dateColumn, preview])

  const handleFile = (uploadedFile) => {
    if (!uploadedFile.name.endsWith(".csv")) {
      setError("Please upload a CSV file only")
      return
    }
    setError("")
    setFile(uploadedFile)

    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target.result
      const lines = text.split("\n")
      const headers = lines[0].split(",")
      const rows = lines.slice(1, 6).map(r => r.split(","))
      setRawText(text)
      setPreview({ headers, rows })
    }
    reader.readAsText(uploadedFile)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    handleFile(e.dataTransfer.files[0])
  }

  const handleSubmit = () => {
    if (!file) {
      setError("Please upload a CSV file first")
      return
    }
    onForecast(file, dateColumn, valueColumn, frequency || "daily")
  }

  return (
    <div className="bg-white rounded-xl shadow-card border border-slate-200 p-6 mb-6">
      <h2 className="text-base font-semibold text-ink mb-4">
        Upload Time Series Data
      </h2>

      {/* Drop Zone */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload CSV file"
        className={`upload-zone rounded-lg p-8 text-center cursor-pointer mb-5 ${dragOver ? "dragging" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => document.getElementById("fileInput").click()}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") document.getElementById("fileInput").click() }}
      >
        <p className="text-sm font-medium text-ink mb-1">
          {file ? file.name : "Drag & drop CSV file here"}
        </p>
        <p className="text-xs text-ink-faint">
          {file ? "Click to choose a different file" : "or click to browse"}
        </p>
        <input
          id="fileInput"
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => handleFile(e.target.files[0])}
        />
      </div>

      {/* Error */}
      {error && (
        <p className="text-red-600 text-sm mb-4 -mt-2">{error}</p>
      )}

      {/* Column Config */}
      <div className="grid sm:grid-cols-3 gap-4 mb-5">
        <div>
          <label htmlFor="dateColumn" className="text-xs font-medium text-ink-muted block mb-1.5">
            Date Column
          </label>
          <input
            id="dateColumn"
            type="text"
            value={dateColumn}
            onChange={(e) => setDateColumn(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm
                       focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
            placeholder="date"
          />
        </div>
        <div>
          <label htmlFor="valueColumn" className="text-xs font-medium text-ink-muted block mb-1.5">
            Value Column
          </label>
          <input
            id="valueColumn"
            type="text"
            value={valueColumn}
            onChange={(e) => setValueColumn(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm
                       focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
            placeholder="value"
          />
        </div>
        <div>
          <span className="text-xs font-medium text-ink-muted block mb-1.5">
            Frequency
          </span>
          <div className="w-full border border-slate-200 bg-slate-50 rounded-lg px-3 py-2 text-sm flex items-center justify-between">
            <span className="capitalize text-ink">
              {frequency || "—"}
            </span>
            <span className="text-[10px] uppercase tracking-wide text-ink-faint">
              {frequency ? "auto-detected" : "upload a file"}
            </span>
          </div>
        </div>
      </div>

      {/* CSV Preview */}
      {preview && (
        <div className="mb-5">
          <p className="text-xs font-medium text-ink-muted mb-2">Preview (first 5 rows)</p>
          <div className="table-scroll overflow-x-auto border border-slate-200 rounded-lg">
            <table className="text-xs w-full border-collapse">
              <thead>
                <tr className="bg-slate-50">
                  {preview.headers.map((h, i) => (
                    <th key={i} className="px-3 py-2 text-left font-medium text-ink-muted border-b border-slate-200">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((row, i) => (
                  <tr key={i} className="border-b border-slate-100 last:border-0">
                    {row.map((cell, j) => (
                      <td key={j} className="px-3 py-2 text-ink-muted">{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={loading || !file}
        className="w-full bg-primary text-white py-3 rounded-lg font-medium text-sm
                   hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed
                   transition-colors duration-150"
      >
        {loading ? "Forecasting… Please wait" : "Generate 3 Year Forecast"}
      </button>
    </div>
  )
}
