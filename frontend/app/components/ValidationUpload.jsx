"use client"
import { useState, useMemo, useRef } from "react"

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
  const abortControllerRef = useRef(null)

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

    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    const controller = new AbortController()
    abortControllerRef.current = controller
    onValidate(file, dateColumn, valueColumn, splitRatio, modelName, controller.signal)
  }

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
  }

  return (
    <>
      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <p className="text-red-700 text-sm font-medium">{error}</p>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Left: Upload & Config */}
        <div className="bg-white rounded-xl shadow-card border border-slate-200 p-6">
          <h2 className="text-base font-semibold text-ink mb-4">Upload Dataset</h2>

          {/* Drop Zone */}
          <div
            role="button"
            tabIndex={0}
            aria-label="Upload CSV file"
            className={`upload-zone rounded-lg p-6 text-center cursor-pointer mb-4 ${dragOver ? "dragging" : ""}`}
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

          {/* Column Config */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label htmlFor="valDateColumn" className="text-xs font-medium text-ink-muted block mb-1">
                X
              </label>
              <input
                id="valDateColumn"
                type="text"
                value={dateColumn}
                onChange={(e) => setDateColumn(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm
                           focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                placeholder="date"
              />
            </div>
            <div>
              <label htmlFor="valValueColumn" className="text-xs font-medium text-ink-muted block mb-1">
                Y
              </label>
              <input
                id="valValueColumn"
                type="text"
                value={valueColumn}
                onChange={(e) => setValueColumn(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm
                           focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                placeholder="value"
              />
            </div>
          </div>

          {/* Preview Table */}
          {preview && (
            <div>
              <p className="text-xs font-medium text-ink-muted mb-2">Preview (first 5 rows)</p>
              <div className="overflow-x-auto border rounded-lg max-h-48">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 text-left text-xs text-ink-muted sticky top-0">
                    <tr>
                      {preview.headers.map((h, i) => (
                        <th key={i} className="px-2 py-1.5 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.rows.map((row, rIdx) => (
                      <tr key={rIdx} className={rIdx % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} className="px-2 py-1.5">{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Right: Model Config & Split */}
        <div className="bg-white rounded-xl shadow-card border border-slate-200 p-6">
          <h2 className="text-base font-semibold text-ink mb-4">Model Validation</h2>

          

          {/* Split Config */}
          {file && (
            <div className="mb-4">
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
              <div className="flex h-2.5 rounded-full overflow-hidden border border-slate-200 mb-3">
                <div
                  className="bg-primary"
                  style={{ width: `${splitRatio * 100}%` }}
                />
                <div
                  className="bg-amber-400"
                  style={{ width: `${(1 - splitRatio) * 100}%` }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-primary-light rounded-lg p-2.5">
                  <p className="font-semibold text-primary mb-0.5 text-xs">Context</p>
                  <p className="text-ink-muted text-xs">
                    {contextDates.length.toLocaleString()} rows
                    {contextDates.length > 1 && (
                      <> ({formatMonthYear(contextDates[0])} – {formatMonthYear(contextDates[contextDates.length - 1])})</>
                    )}
                  </p>
                </div>
                <div className="bg-amber-50 rounded-lg p-2.5">
                  <p className="font-semibold text-amber-700 mb-0.5 text-xs">Held-out</p>
                  <p className="text-ink-muted text-xs">
                    {heldOutDates.length.toLocaleString()} rows
                    {heldOutDates.length > 1 && (
                      <> ({formatMonthYear(heldOutDates[0])} – {formatMonthYear(heldOutDates[heldOutDates.length - 1])})</>
                    )}
                  </p>
                </div>
              </div>

              <p className="text-xs text-ink-faint mb-4">
                TimesFM never sees the held-out rows — they're used only to check its predictions.
              </p>
            </div>
          )}

          {/* Submit / Cancel Buttons */}
          {loading ? (
            <div className="flex gap-3">
              <button
                disabled
                className="flex-1 bg-primary/70 text-white py-2.5 rounded-lg font-medium text-sm cursor-not-allowed"
              >
                Running validation…
              </button>
              <button
                onClick={handleCancel}
                className="px-4 py-2.5 rounded-lg font-medium text-sm border border-slate-300 text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!file}
              className="w-full bg-primary text-white py-2.5 rounded-lg font-medium text-sm
                         hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed
                         transition-colors duration-150"
            >
              Run validation
            </button>
          )}
        </div>
      </div>
    </>
  )
}
