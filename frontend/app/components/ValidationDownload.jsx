"use client"
import { saveAs } from "file-saver"

export default function ValidationDownload({ data }) {
  if (!data) return null

  const { context, held_out, predicted } = data

  const downloadValidationReport = () => {
    const rows = ["date,actual,predicted,residual,pct_error"]
    held_out.dates.forEach((date, i) => {
      const actual = held_out.values[i]
      const pred = predicted.values[i]
      const residual = actual - pred
      const pctError = actual !== 0 ? ((residual / actual) * 100).toFixed(2) : ""
      rows.push(`${date},${actual},${pred},${residual.toFixed(4)},${pctError}`)
    })
    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8" })
    saveAs(blob, "timesfm_validation_report.csv")
  }

  const downloadFullComparison = () => {
    const rows = ["date,split,actual,predicted,residual"]
    context.dates.forEach((date, i) => {
      rows.push(`${date},context,${context.values[i]},,`)
    })
    held_out.dates.forEach((date, i) => {
      const actual = held_out.values[i]
      const pred = predicted.values[i]
      const residual = (actual - pred).toFixed(4)
      rows.push(`${date},held_out,${actual},${pred},${residual}`)
    })
    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8" })
    saveAs(blob, "timesfm_validation_full_comparison.csv")
  }

  return (
    <div className="bg-white rounded-xl shadow-card border border-slate-200 p-6 mt-6">
      <h2 className="text-base font-semibold text-ink mb-4">
        Download Results
      </h2>
      <div className="grid sm:grid-cols-2 gap-3">
        <button
          onClick={downloadValidationReport}
          className="flex items-center justify-center gap-2
                     bg-secondary text-white py-3 px-4 text-sm
                     rounded-lg font-medium hover:bg-green-700
                     transition-colors duration-150"
        >
          Download validation report (CSV)
        </button>
        <button
          onClick={downloadFullComparison}
          className="flex items-center justify-center gap-2
                     bg-primary text-white py-3 px-4 text-sm
                     rounded-lg font-medium hover:bg-primary-dark
                     transition-colors duration-150"
        >
          Download full comparison (CSV)
        </button>
      </div>
    </div>
  )
}
