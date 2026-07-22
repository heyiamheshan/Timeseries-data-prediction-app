"use client"
import { useState } from "react"
import axios from "axios"
import FileUpload from "./components/FileUpload"
import ForecastChart from "./components/ForecastChart"
import DownloadButton from "./components/DownloadButton"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export default function Home() {
  const [loading, setLoading]     = useState(false)
  const [forecastData, setForecastData] = useState(null)
  const [error, setError]         = useState("")
  const [progress, setProgress]   = useState("")

  const handleForecast = async (
    file,
    dateColumn,
    valueColumn,
    frequency
  ) => {
    setLoading(true)
    setError("")
    setForecastData(null)
    setProgress("Uploading CSV file...")

    try {
      // Build form data
      const formData = new FormData()
      formData.append("file", file)

      setProgress("Running TimesFM inference... this may take a few minutes")

      // Call FastAPI backend
      const response = await axios.post(
        `${API_URL}/forecast?date_column=${dateColumn}&value_column=${valueColumn}&frequency=${frequency}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data"
          },
          timeout: 600000, // 10 minutes timeout for TimesFM
        }
      )

      setProgress("Forecast complete!")
      setForecastData(response.data)

    } catch (err) {
      if (err.response) {
        setError(`Error: ${err.response.data.detail}`)
      } else if (err.code === "ECONNABORTED") {
        setError("Request timed out. TimesFM is still loading — please try again.")
      } else {
        setError("Cannot connect to backend. Make sure FastAPI is running.")
      }
    } finally {
      setLoading(false)
      setProgress("")
    }
  }

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Time Series Forecasting
        </h1>
        <p className="text-gray-500">
          Upload your time series CSV data and get a
          3 year forecast powered by Google TimesFM 2.5
        </p>
      </div>

      {/* How to use */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
        <h3 className="text-sm font-semibold text-blue-800 mb-2">
          How to use
        </h3>
        <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
          <li>Prepare a CSV file with a date column and a value column</li>
          <li>Upload the CSV and set the correct column names</li>
          <li>Select the data frequency (daily / weekly / monthly)</li>
          <li>Click Generate Forecast and wait for TimesFM to predict</li>
          <li>View the chart and download results as CSV</li>
        </ol>
      </div>

      {/* Sample CSV Format */}
      <div className="bg-gray-50 border rounded-xl p-4 mb-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">
          Expected CSV format
        </h3>
        <pre className="text-xs text-gray-600 font-mono">
{`date,value
2020-01-01,1250
2020-01-02,1380
2020-01-03,1290
2020-01-04,1450
...`}
        </pre>
      </div>

      {/* File Upload Component */}
      <FileUpload
        onForecast={handleForecast}
        loading={loading}
      />

      {/* Progress Message */}
      {progress && (
        <div className="bg-yellow-50 border border-yellow-200
                        rounded-xl p-4 mb-6 flex items-center gap-3">
          <div className="animate-spin rounded-full h-5 w-5
                          border-b-2 border-yellow-600"></div>
          <p className="text-yellow-700 text-sm font-medium">
            {progress}
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200
                        rounded-xl p-4 mb-6">
          <p className="text-red-700 text-sm font-medium">
            {error}
          </p>
        </div>
      )}

      {/* Forecast Chart */}
      {forecastData && (
        <>
          <ForecastChart data={forecastData} />
          <DownloadButton data={forecastData} />
        </>
      )}

      {/* Empty State */}
      {!forecastData && !loading && (
        <div className="bg-white rounded-xl shadow-md p-12
                        text-center border-2 border-dashed border-gray-200">
          <p className="text-gray-400 text-lg mb-2">
            No forecast yet
          </p>
          <p className="text-gray-300 text-sm">
            Upload a CSV file above to generate your forecast
          </p>
        </div>
      )}
    </div>
  )
}