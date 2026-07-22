"use client"
import { useState } from "react"
import axios from "axios"
import FileUpload    from "./components/FileUpload"
import ForecastChart from "./components/ForecastChart"
import DownloadButton from "./components/DownloadButton"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

const STEPS = [
  { id: 1, label: "Parsing CSV",         duration: 3 },
  { id: 2, label: "Loading TimesFM",     duration: 10 },
  { id: 3, label: "Running inference",   duration: 420 },
  { id: 4, label: "Building forecast",   duration: 5 },
]

export default function Home() {
  const [loading, setLoading]         = useState(false)
  const [forecastData, setForecastData] = useState(null)
  const [error, setError]             = useState("")
  const [step, setStep]               = useState(0)
  const [elapsed, setElapsed]         = useState(0)

  const handleForecast = async (file, dateColumn, valueColumn, frequency, horizon) => {
    setLoading(true)
    setError("")
    setForecastData(null)
    setStep(1)

    // Elapsed timer
    const start = Date.now()
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000))
    }, 1000)

    // Step progression simulation
    let stepIdx = 1
    const stepTimer = setInterval(() => {
      stepIdx = Math.min(stepIdx + 1, STEPS.length)
      setStep(stepIdx)
    }, 8000)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await axios.post(
        `${API_URL}/forecast?date_column=${encodeURIComponent(dateColumn)}&value_column=${encodeURIComponent(valueColumn)}&frequency=${encodeURIComponent(frequency)}&horizon=${horizon}`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          timeout: 600000,
        }
      )

      setStep(STEPS.length)
      setForecastData(response.data)

    } catch (err) {
      if (err.response) {
        setError(`API error: ${err.response.data?.detail || err.response.statusText}`)
      } else if (err.code === "ECONNABORTED") {
        setError("Request timed out. TimesFM is still running — please try again.")
      } else {
        setError("Cannot connect to backend. Make sure the app is running.")
      }
    } finally {
      clearInterval(timer)
      clearInterval(stepTimer)
      setLoading(false)
      setElapsed(0)
      setStep(0)
    }
  }

  const formatTime = (s) => s < 60 ? `${s}s` : `${Math.floor(s/60)}m ${s%60}s`

  return (
    <div className="space-y-8">

      {/* Hero */}
      <div className="pt-4 pb-2">
        <div className="flex items-center gap-2 mb-3">
          <span className="badge badge-indigo">Zero-shot forecasting</span>
          <span className="badge badge-emerald">No training required</span>
        </div>
        <h1 className="font-display font-700 text-3xl md:text-4xl text-white tracking-tight leading-tight">
          Predict the next<br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">
            chapter of your data
          </span>
        </h1>
        <p className="text-muted text-sm mt-3 max-w-lg">
          Upload any time series CSV, choose how many rows to predict, and get instant
          forecasts powered by Google TimesFM 2.5 — a 231M parameter foundation model
          trained on trillions of data points.
        </p>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left panel — Upload */}
        <div className="lg:col-span-1 space-y-4">

          {/* Upload card */}
          <div className="bg-surface rounded-2xl border border-surface-border p-5 card-glow">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-md bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                <span className="text-indigo-400 text-xs font-mono">1</span>
              </div>
              <h2 className="font-display font-600 text-white text-sm">Upload data</h2>
            </div>
            <FileUpload onForecast={handleForecast} loading={loading} />
          </div>

          {/* How it works */}
          {!forecastData && !loading && (
            <div className="bg-surface rounded-2xl border border-surface-border p-5">
              <p className="text-xs text-muted font-mono uppercase tracking-wider mb-3">How it works</p>
              <div className="space-y-3">
                {[
                  { icon: "📁", text: "Upload a CSV with date and value columns" },
                  { icon: "🤖", text: "TimesFM reads your historical pattern" },
                  { icon: "📈", text: "Model predicts as many rows as you request" },
                  { icon: "💾", text: "Download predictions as CSV" },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="text-base">{item.icon}</span>
                    <p className="text-xs text-muted leading-relaxed">{item.text}</p>
                  </div>
                ))}
              </div>

              {/* Sample format */}
              <div className="mt-4 pt-4 border-t border-surface-border">
                <p className="text-xs text-muted font-mono uppercase tracking-wider mb-2">Expected format</p>
                <div className="rounded-lg bg-midnight border border-surface-border p-3 overflow-x-auto">
                  <pre className="text-xs font-mono text-indigo-300">
{`date,value
2020-01-01,1250
2020-01-02,1380
2020-01-03,1290
...`}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* Download card */}
          {forecastData && <DownloadButton data={forecastData} />}
        </div>

        {/* Right panel — Results */}
        <div className="lg:col-span-2">

          {/* Loading state */}
          {loading && (
            <div className="bg-surface rounded-2xl border border-surface-border p-8 h-full flex flex-col items-center justify-center gap-6">

              {/* Animated progress bar */}
              <div className="w-full max-w-sm space-y-4">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-white">Running TimesFM inference</span>
                  <span className="text-muted">{formatTime(elapsed)}</span>
                </div>
                <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden">
                  <div className="h-full progress-shimmer rounded-full w-full"></div>
                </div>
              </div>

              {/* Steps */}
              <div className="w-full max-w-sm space-y-2">
                {STEPS.map((s) => (
                  <div key={s.id} className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-300 ${
                    step === s.id
                      ? "bg-indigo-500/10 border border-indigo-500/20"
                      : step > s.id
                      ? "opacity-40"
                      : "opacity-20"
                  }`}>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                      step > s.id
                        ? "bg-emerald-500/20 border border-emerald-500/30"
                        : step === s.id
                        ? "bg-indigo-500/20 border border-indigo-500/30"
                        : "bg-surface-2 border border-surface-border"
                    }`}>
                      {step > s.id ? (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      ) : step === s.id ? (
                        <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></div>
                      ) : (
                        <span className="text-muted text-xs font-mono">{s.id}</span>
                      )}
                    </div>
                    <span className={`text-xs font-mono ${step === s.id ? "text-white" : "text-muted"}`}>
                      {s.label}
                    </span>
                    {step === s.id && (
                      <span className="ml-auto text-xs text-indigo-400 font-mono animate-pulse">running</span>
                    )}
                  </div>
                ))}
              </div>

              <p className="text-xs text-muted font-mono text-center max-w-xs">
                TimesFM processes your full history as context.
                Typical inference takes 5–10 minutes.
              </p>
            </div>
          )}

          {/* Error state */}
          {error && !loading && (
            <div className="bg-surface rounded-2xl border border-red-500/20 p-8 flex flex-col items-center justify-center gap-4 text-center">
              <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F87171" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
              </div>
              <div>
                <p className="text-white font-display font-500 text-sm mb-1">Something went wrong</p>
                <p className="text-red-400 text-xs font-mono">{error}</p>
              </div>
              <button
                onClick={() => setError("")}
                className="btn-secondary px-4 py-2 text-xs"
              >
                Try again
              </button>
            </div>
          )}

          {/* Chart */}
          {forecastData && !loading && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <span className="text-emerald-400 text-xs font-mono">2</span>
                </div>
                <h2 className="font-display font-600 text-white text-sm">Forecast results</h2>
                <span className="badge badge-emerald ml-auto">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Complete
                </span>
              </div>
              <ForecastChart data={forecastData} />
            </div>
          )}

          {/* Empty state */}
          {!forecastData && !loading && !error && (
            <div className="bg-surface rounded-2xl border border-surface-border border-dashed p-12 flex flex-col items-center justify-center gap-4 text-center h-full min-h-80">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 flex items-center justify-center">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(99,102,241,0.4)" strokeWidth="1">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                </svg>
              </div>
              <div>
                <p className="text-white font-display font-500 text-sm">No forecast yet</p>
                <p className="text-muted text-xs mt-1 max-w-xs">
                  Upload a CSV file on the left to generate your prediction
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
