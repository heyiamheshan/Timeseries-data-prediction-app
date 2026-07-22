import "./globals.css"

export const metadata = {
  title: "TimesFM Forecasting App",
  description: "Upload time series data and predict next 3 years using Google TimesFM",
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen">
        <nav className="bg-blue-700 text-white px-6 py-4 shadow-md">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">TimesFM Forecasting</h1>
              <p className="text-blue-200 text-sm">
                Powered by Google TimesFM 2.5
              </p>
            </div>
            <span className="text-blue-200 text-sm">
              Upload — Predict — Download
            </span>
          </div>
        </nav>
        <main className="max-w-6xl mx-auto px-6 py-8">
          {children}
        </main>
        <footer className="text-center text-gray-400 text-sm py-6">
          TimesFM 2.5 — Google Research — Apache 2.0
        </footer>
      </body>
    </html>
  )
}