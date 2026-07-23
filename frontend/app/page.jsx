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
    frequency,
    horizon
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
        `${API_URL}/forecast?date_column=${dateColumn}&value_column=${valueColumn}&frequency=${frequency}&horizon=${horizon}`,
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
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-ink mb-1">
          Time Series Forecasting
        </h1>
        <p className="text-ink-muted text-sm">
          Upload your time series CSV data and get a custom-length forecast powered by Google TimesFM 2.5
        </p>
      </div>

      {/* How to use + Sample format */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card">
          <h3 className="text-sm font-semibold text-ink mb-3">
            How to use
          </h3>
          <ol className="text-sm text-ink-muted space-y-2">
            {[
              "Prepare a CSV file with a date column and a value column",
              "Upload the CSV and set the correct column names",
              "Enter how many rows you want predicted",
              "Click Generate and wait for TimesFM to predict",
              "View the chart and download results as CSV",
            ].map((step, i) => (
              <li key={i} className="flex gap-2.5">
                <span className="flex-none h-5 w-5 rounded-full bg-primary-light text-primary text-xs font-semibold flex items-center justify-center">
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card">
          <h3 className="text-sm font-semibold text-ink mb-3">
            Expected CSV format
          </h3>
          <pre className="text-xs text-ink-muted font-mono bg-slate-50 border border-slate-200 rounded-lg p-3 overflow-x-auto">
{`date,value
2020-01-01,1250
2020-01-02,1380
2020-01-03,1290
2020-01-04,1450
...`}
          </pre>
        </div>
      </div>

      {/* File Upload Component */}
      <FileUpload
        onForecast={handleForecast}
        loading={loading}
      />

      {/* Progress Message */}
      {progress && (
        <div className="bg-amber-50 border border-amber-200
                        rounded-xl p-4 mb-6 flex items-center gap-3">
          <div className="animate-spin rounded-full h-5 w-5
                          border-2 border-amber-600 border-t-transparent"></div>
          <p className="text-amber-800 text-sm font-medium">
            {progress}
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-danger-light border border-red-200
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
        <div className="bg-white rounded-xl p-12
                        text-center border-2 border-dashed border-slate-200">
          <p className="text-ink-muted text-base font-medium mb-1">
            No forecast yet
          </p>
          <p className="text-ink-faint text-sm">
            Upload a CSV file above to generate your forecast
          </p>
        </div>
      )}
    </div>
  )
}