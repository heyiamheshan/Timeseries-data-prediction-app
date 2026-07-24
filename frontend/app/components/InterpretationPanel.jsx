"use client"

function accuracyInsight(mape) {
  if (mape < 5) {
    return {
      color: "bg-secondary",
      title: "Excellent accuracy",
      text: "Model predictions are within 5% of actual values. Reliable for production use.",
    }
  }
  if (mape < 15) {
    return {
      color: "bg-amber-500",
      title: "Good accuracy",
      text: "Model captures the overall trend well. Suitable for planning and forecasting.",
    }
  }
  return {
    color: "bg-danger",
    title: "Moderate accuracy",
    text: "Consider providing more historical context or check for unusual patterns in your data.",
  }
}

function patternInsight(r2) {
  if (r2 > 0.9) {
    return {
      color: "bg-secondary",
      title: "Strong pattern recognition",
      text: "Model captured 90%+ of the variance in your data.",
    }
  }
  if (r2 > 0.7) {
    return {
      color: "bg-amber-500",
      title: "Good pattern recognition",
      text: "Model captured most variance. Weekly and seasonal patterns are being learned.",
    }
  }
  return {
    color: "bg-danger",
    title: "Weak pattern recognition",
    text: "Model struggled to capture variance. Your data may have patterns not well represented in the context.",
  }
}

function residualInsight(heldOutValues, predictedValues) {
  const residuals = heldOutValues.map((v, i) => v - predictedValues[i])
  const mean = residuals.reduce((a, b) => a + b, 0) / residuals.length
  const variance = residuals.reduce((a, b) => a + (b - mean) ** 2, 0) / residuals.length
  const std = Math.sqrt(variance)
  const meanAbs = residuals.reduce((a, b) => a + Math.abs(b), 0) / residuals.length

  if (std < meanAbs * 1.5) {
    return {
      color: "bg-secondary",
      title: "Random errors",
      text: "Errors appear random — no systematic bias detected.",
    }
  }
  return {
    color: "bg-amber-500",
    title: "Patterned errors",
    text: "Errors show some pattern. Model may be consistently over- or under-predicting in certain periods.",
  }
}

export default function InterpretationPanel({ data }) {
  if (!data) return null

  const { metrics, held_out, predicted } = data
  const rows = [
    accuracyInsight(metrics.mape),
    patternInsight(metrics.r2),
    residualInsight(held_out.values, predicted.values),
  ]

  return (
    <div className="bg-white rounded-xl shadow-card border border-slate-200 p-6 mt-6">
      <h2 className="text-base font-semibold text-ink mb-4">
        What these results mean
      </h2>
      <div className="space-y-4">
        {rows.map((row, i) => (
          <div key={i} className="flex gap-3">
            <span className={`flex-none h-2.5 w-2.5 rounded-full mt-1.5 ${row.color}`} />
            <div>
              <p className="text-sm font-semibold text-ink">{row.title}</p>
              <p className="text-sm text-ink-muted">{row.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
