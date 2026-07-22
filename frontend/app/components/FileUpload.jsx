"use client"
import { useState } from "react"

export default function FileUpload({ onForecast, loading }) {
  const [file, setFile]           = useState(null)
  const [dateColumn, setDateColumn] = useState("date")
  const [valueColumn, setValueColumn] = useState("value")
  const [frequency, setFrequency] = useState("daily")
  const [dragOver, setDragOver]   = useState(false)
  const [preview, setPreview]     = useState(null)
  const [error, setError]         = useState("")

  const handleFile = (uploadedFile) => {
    if (!uploadedFile.name.endsWith(".csv")) {
      setError("Please upload a CSV file only")
      return
    }
    setError("")
    setFile(uploadedFile)

    // Preview first 5 rows
    const reader = new FileReader()
    reader.onload = (e) => {
      const lines = e.target.result.split("\n")
      const headers = lines[0].split(",")
      const rows = lines.slice(1, 6).map(r => r.split(","))
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
    onForecast(file, dateColumn, valueColumn, frequency)
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">
        Upload Time Series Data
      </h2>

      {/* Drop Zone */}
      <div
        className={`upload-zone rounded-lg p-8 text-center cursor-pointer mb-4 ${dragOver ? "dragging" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => document.getElementById("fileInput").click()}
      >
        <p className="text-gray-500 text-sm">
          {file ? `Selected: ${file.name}` : "Drag & drop CSV file here or click to browse"}
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
        <p className="text-red-500 text-sm mb-4">{error}</p>
      )}

      {/* Column Config */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <label className="text-sm text-gray-600 block mb-1">
            Date Column
          </label>
          <input
            type="text"
            value={dateColumn}
            onChange={(e) => setDateColumn(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm"
            placeholder="date"
          />
        </div>
        <div>
          <label className="text-sm text-gray-600 block mb-1">
            Value Column
          </label>
          <input
            type="text"
            value={valueColumn}
            onChange={(e) => setValueColumn(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm"
            placeholder="value"
          />
        </div>
        <div>
          <label className="text-sm text-gray-600 block mb-1">
            Frequency
          </label>
          <select
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
      </div>

      {/* CSV Preview */}
      {preview && (
        <div className="mb-4 overflow-x-auto">
          <p className="text-sm text-gray-500 mb-2">Preview (first 5 rows):</p>
          <table className="text-xs border-collapse w-full">
            <thead>
              <tr>
                {preview.headers.map((h, i) => (
                  <th key={i} className="border px-2 py-1 bg-gray-100 text-left">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {preview.rows.map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td key={j} className="border px-2 py-1">{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={loading || !file}
        className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium
                   hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed
                   transition-colors duration-200"
      >
        {loading ? "Forecasting... Please wait" : "Generate 3 Year Forecast"}
      </button>
    </div>
  )
}