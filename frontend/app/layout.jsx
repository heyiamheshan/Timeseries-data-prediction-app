import "./globals.css"

export const metadata = {
  title: "TimesFM Forecasting App",
  description: "Upload time series data and predict any number of future rows using Google TimesFM",
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-slate-50 min-h-screen text-ink flex flex-col">
        <header className="sticky top-0 z-10 bg-white border-b border-slate-200">
          <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              
              <div>
               
              </div>
            </div>
            
          </div>
        </header>

        <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-8">
          {children}
        </main>

        <footer className="border-t border-slate-200 bg-white">
          
        </footer>
      </body>
    </html>
  )
}