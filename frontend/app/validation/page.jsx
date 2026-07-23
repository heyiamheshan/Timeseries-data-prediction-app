"use client"
import { useState } from "react"
import axios from "axios"
import ValidationUpload from "../components/ValidationUpload"
import MetricsCards from "../components/MetricsCards"
import ValidationChart from "../components/ValidationChart"
import InterpretationPanel from "../components/InterpretationPanel"
import ValidationDownload from "../components/ValidationDownload"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export default function ValidationPage() {
  const [loading, setLoading]           = useState(false)
  const [validationData, setValidationData] = useState(null)
  const [error, setError]               = useState("")
  const [progress, setProgress]         = useState("")

  const handleValidate = async (file, dateColumn, valueColumn, splitRatio) => {
    setLoading(true)
    setError("")
    setValidationData(null)
    setProgress("Uploading CSV file...")

    try {
      const formData = new FormData()
      formData.append("file", file)

      setProgress("Running TimesFM inference on context data... this may take a few minutes")

      const response = await axios.post(
        `${API_URL}/validate?date_column=${dateColumn}&value_column=${valueColumn}&split_ratio=${splitRatio}`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          timeout: 600000,
        }
      )

      setProgress("Validation complete!")
      setValidationData(response.data)

    } catch (err) {
      if (err.response) {
        setError(`Error: ${err.response.data.detail}`)
      } else if (err.code === "ECONNABORTED") {
        setError("Request timed out. TimesFM is still running — please try again.")
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
          Model Validation
        </h1>
        <p className="text-ink-muted text-sm">
          Split your data into context and held-out sets to see exactly how accurate TimesFM
          is on your own data,before trusting it for real forecasts.
        </p>
      </div>

      <div className="grid lg:grid-cols-[320px_1fr] gap-6 items-start">
        {/* Left panel */}
        <div>
          <ValidationUpload onValidate={handleValidate} loading={loading} />
        </div>

        {/* Right panel */}
        <div>
          {/* Progress Message */}
          {progress && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-amber-600 border-t-transparent"></div>
              <p className="text-amber-800 text-sm font-medium">{progress}</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-danger-light border border-red-200 rounded-xl p-4 mb-6">
              <p className="text-red-700 text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Results */}
          {validationData && (
            <>
              <MetricsCards metrics={validationData.metrics} />
              <ValidationChart data={validationData} />
              <InterpretationPanel data={validationData} />
              <ValidationDownload data={validationData} />
            </>
          )}

          {/* Empty State */}
          {!validationData && !loading && !error && (
            <div className="bg-white rounded-xl p-12 text-center border-2 border-dashed border-slate-200">
              <p className="text-ink-muted text-base font-medium mb-1">
                No validation run yet
              </p>
              <p className="text-ink-faint text-sm">
                Upload a CSV and run validation to see how accurate TimesFM is on your data
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
