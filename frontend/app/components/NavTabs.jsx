"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"

const TABS = [
  { href: "/", label: "Forecasting" },
  { href: "/validation", label: "Model Validation" },
]

export default function NavTabs() {
  const pathname = usePathname()

  return (
    <div className="border-b border-slate-200 bg-white">
      <nav className="max-w-5xl mx-auto px-6 flex gap-6">
        {TABS.map((tab) => {
          const active = pathname === tab.href
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`py-3 text-sm font-medium border-b-2 transition-colors ${
                active
                  ? "text-primary border-primary"
                  : "text-ink-muted border-transparent hover:text-ink"
              }`}
            >
              {tab.label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
