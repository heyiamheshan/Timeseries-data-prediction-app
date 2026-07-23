"use client"
import { useState, useMemo } from "react"

function parseAllDates(rawText, headers, dateColumn) {
  const colIndex = headers.findIndex(
    h => h.trim().toLowerCase() === dateColumn.trim().toLowerCase()
  )
  if (colIndex === -1) return []

  const lines = rawText.split("\n").slice(1)
  const dates = []
  for (const line of lines) {
    if (!line.trim()) continue
    const value = line.split(",")[colIndex]
    const parsed = new Date(value)
    if (!isNaN(parsed)) dates.push(parsed)
  }
  return dates
}

function formatMonthYear(date) {
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" })
}

export default function ValidationUpload({ onValidate, loading }) {
  const [file, setFile]               = useState(null)
  const [rawText, setRawText]         = useState("")
  const [dateColumn, setDateColumn]   = useState("date")
  const [valueColumn, setValueColumn] = useState("value")
  const [splitRatio, setSplitRatio]   = useState(0.7)
  const [dragOver, setDragOver]       = useState(false)
  const [preview, setPreview]         = useState(null)
  const [modelName, setModelName]     = useState("timesfm-2.5-200m-transformers")
  const [error, setError]             = useState("")

  const allDates = useMemo(() => {
    if (!rawText || !preview) return []
    return parseAllDates(rawText, preview.headers, dateColumn)
  }, [rawText, preview, dateColumn])

  const splitIdx = Math.floor(allDates.length * splitRatio)
  const contextDates = allDates.slice(0, splitIdx)
  const heldOutDates = allDates.slice(splitIdx)

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
      const lines = text.split("\n").filter(Boolean)
      const headers = lines[0].split(",")
      const rows = lines.slice(1, 6).map(r => r.split(","))
      setRawText(text)
      setPreview({ headers, rows, total: lines.length - 1 })
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
    if (contextDates.length < 1 || heldOutDates.length < 1) {
      setError("Not enough rows for this split — adjust the ratio or upload more data")
      return
    }
    onValidate(file, dateColumn, valueColumn, splitRatio, modelName)
  }

  return (
    <div className="bg-white rounded-xl shadow-card border border-slate-200 p-6 mb-6">
      <h2 className="text-base font-semibold text-ink mb-4">
        Upload Dataset
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
        onClick={() => document.getElementById("validationFileInput").click()}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") document.getElementById("validationFileInput").click() }}
      >
        <p className="text-sm font-medium text-ink mb-1">
          {file ? file.name : "Drag & drop CSV file here"}
        </p>
        <p className="text-xs text-ink-faint">
          {file ? "Click to choose a different file" : "or click to browse"}
        </p>
        {preview && (
          <p className="text-xs text-ink-muted mt-2">
            {preview.total.toLocaleString()} rows
            {allDates.length > 1 && ` · ${formatMonthYear(allDates[0])} – ${formatMonthYear(allDates[allDates.length - 1])}`}
          </p>
        )}
        <input
          id="validationFileInput"
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
      <div className="grid grid-cols-2 gap-4 mb-5">
        <div className="text-center">
          <label htmlFor="valDateColumn" className="text-xs font-medium text-ink-muted block mb-1.5">
            X
          </label>
          <input
            id="valDateColumn"
            type="text"
            value={dateColumn}
            onChange={(e) => setDateColumn(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-center
                       focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
            placeholder="date"
          />
        </div>
        <div className="text-center">
          <label htmlFor="valValueColumn" className="text-xs font-medium text-ink-muted block mb-1.5">
            Y
          </label>
          <input
            id="valValueColumn"
            type="text"
            value={valueColumn}
            onChange={(e) => setValueColumn(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-center
                       focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
            placeholder="value"
          />
        </div>
      </div>

      {/* Preview Table */}
      {preview && (
        <div className="mb-5">
          <p className="text-xs font-medium text-ink-muted mb-2">Preview (first 5 rows)</p>
          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs text-ink-muted">
                <tr>
                  {preview.headers.map((h, i) => (
                    <th key={i} className="px-3 py-2">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((row, rIdx) => (
                  <tr key={rIdx} className={rIdx % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="px-3 py-2 align-top break-words">{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Split Config */}
      {file && (
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="splitRatio" className="text-xs font-medium text-ink-muted">
              Train / test split
            </label>
            <span className="text-xs font-semibold text-primary">
              {Math.round(splitRatio * 100)}% / {Math.round((1 - splitRatio) * 100)}%
            </span>
          </div>
          <input
            id="splitRatio"
            type="range"
            min={0.1}
            max={0.9}
            step={0.05}
            value={splitRatio}
            onChange={(e) => setSplitRatio(parseFloat(e.target.value))}
            className="w-full accent-primary mb-3"
          />

          {/* Visual split bar */}
          <div className="flex h-3 rounded-full overflow-hidden border border-slate-200 mb-3">
            <div
              className="bg-primary"
              style={{ width: `${splitRatio * 100}%` }}
            />
            <div
              className="bg-amber-400"
              style={{ width: `${(1 - splitRatio) * 100}%` }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-primary-light rounded-lg p-2.5">
              <p className="font-semibold text-primary mb-0.5">Context</p>
              <p className="text-ink-muted">
                {contextDates.length.toLocaleString()} rows
                {contextDates.length > 1 && (
                  <> ({formatMonthYear(contextDates[0])} – {formatMonthYear(contextDates[contextDates.length - 1])})</>
                )}
              </p>
            </div>
            <div className="bg-amber-50 rounded-lg p-2.5">
              <p className="font-semibold text-amber-700 mb-0.5">Held-out</p>
              <p className="text-ink-muted">
                {heldOutDates.length.toLocaleString()} rows
                {heldOutDates.length > 1 && (
                  <> ({formatMonthYear(heldOutDates[0])} – {formatMonthYear(heldOutDates[heldOutDates.length - 1])})</>
                )}
              </p>
            </div>
          </div>

          <p className="text-xs text-ink-faint mt-3">
            TimesFM never sees the held-out rows — they're used only to check its predictions.
          </p>
        </div>
      )}

      {/* Model selection (validation) */}
      <div className="mb-5">
        <label htmlFor="modelSelect" className="text-xs font-medium text-ink-muted block mb-1.5">Model</label>
        <select
          id="modelSelect"
          value={modelName}
          onChange={(e) => setModelName(e.target.value)}
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none"
          disabled={!file}
        >
          <option value="timesfm-2.5-200m-transformers">timesfm-2.5-200m-transformers</option>
          <option value="timesfm-2.5-200m-transformers--fast">timesfm-2.5-200m-transformers (fast)</option>
        </select>
        <p className="text-xs text-ink-faint mt-2">Choose which model to use for validation.</p>
      </div>

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={loading || !file}
        className="w-full bg-primary text-white py-3 rounded-lg font-medium text-sm
                   hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed
                   transition-colors duration-150"
      >
        {loading ? "Running validation…" : "Run validation"}
      </button>
    </div>
  )
}
