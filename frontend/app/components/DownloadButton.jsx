"use client"
import { useState } from "react"
import { saveAs } from "file-saver"

export default function DownloadButton({ data }) {
  const [downloading, setDownloading] = useState(false)

  if (!data) return null

  const handleDownload = async () => {
    setDownloading(true)

    try {
      // Build CSV content directly in browser
      const rows = []

      // Header row
      rows.push("date,type,value,lower_bound,upper_bound")

      // Historical rows
      data.historical.dates.forEach((date, i) => {
        rows.push(`${date},actual,${data.historical.values[i]},,`)
      })

      // Forecast rows
      data.forecast.dates.forEach((date, i) => {
        const lower = data.forecast.lower_bound[i] || ""
        const upper = data.forecast.upper_bound[i] || ""
        rows.push(
          `${date},predicted,${data.forecast.values[i]},${lower},${upper}`
        )
      })

      // Create blob and download
      const csvContent = rows.join("\n")
      const blob = new Blob([csvContent], {
        type: "text/csv;charset=utf-8"
      })
      saveAs(blob, "timesfm_forecast.csv")

    } catch (error) {
      console.error("Download error:", error)
    } finally {
      setDownloading(false)
    }
  }

  const handleDownloadForecastOnly = () => {
    try {
      const rows = []
      rows.push("date,predicted,lower_bound,upper_bound")

      data.forecast.dates.forEach((date, i) => {
        const lower = data.forecast.lower_bound[i] || ""
        const upper = data.forecast.upper_bound[i] || ""
        rows.push(
          `${date},${data.forecast.values[i]},${lower},${upper}`
        )
      })

      const csvContent = rows.join("\n")
      const blob = new Blob([csvContent], {
        type: "text/csv;charset=utf-8"
      })
      saveAs(blob, "timesfm_forecast_only.csv")

    } catch (error) {
      console.error("Download error:", error)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-2">
        Download Results
      </h2>
      <p className="text-sm text-gray-500 mb-4">
        Download the forecast data as CSV file
      </p>

      <div className="grid grid-cols-2 gap-4">

        {/* Full Download */}
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="flex items-center justify-center gap-2
                     bg-green-600 text-white py-3 px-4
                     rounded-lg font-medium hover:bg-green-700
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition-colors duration-200"
        >
          {downloading ? "Downloading..." : "Download Full Data (CSV)"}
        </button>

        {/* Forecast Only Download */}
        <button
          onClick={handleDownloadForecastOnly}
          className="flex items-center justify-center gap-2
                     bg-blue-600 text-white py-3 px-4
                     rounded-lg font-medium hover:bg-blue-700
                     transition-colors duration-200"
        >
          Download Forecast Only (CSV)
        </button>
      </div>

      {/* File Info */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-xs text-gray-500 font-medium mb-1">
          Full Data CSV contains:
        </p>
        <p className="text-xs text-gray-400">
          date, type (actual/predicted), value,
          lower_bound, upper_bound
        </p>
        <p className="text-xs text-gray-500 font-medium mt-2 mb-1">
          Forecast Only CSV contains:
        </p>
        <p className="text-xs text-gray-400">
          date, predicted, lower_bound, upper_bound
        </p>
        <p className="text-xs text-gray-400 mt-2">
          Total rows: {data.historical.dates.length +
                       data.forecast.dates.length} 
          ({data.historical.dates.length} historical +
           {data.forecast.dates.length} predicted)
        </p>
      </div>
    </div>
  )
}