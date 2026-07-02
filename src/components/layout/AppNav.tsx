'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, MessageCircle, Calendar, Heart, Settings } from 'lucide-react'

const navItems = [
  { href: '/dashboard', icon: Home, label: 'Home' },
  { href: '/checkin', icon: Heart, label: 'Check In' },
  { href: '/memories', icon: MessageCircle, label: 'Memories' },
  { href: '/dates', icon: Calendar, label: 'Dates' },
  { href: '/settings', icon: Settings, label: 'Settings' },
]

export default function AppNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-bg px-4 pb-5 pt-3">
      <div className="max-w-md mx-auto flex items-center justify-around bg-surface rounded-3xl shadow-raised px-1.5 py-2.5">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-neu-sm text-[9px] font-semibold transition-all ${
                active ? 'text-ink bg-bg-deep shadow-inset' : 'text-ink-soft'
              }`}
            >
              <Icon size={18} strokeWidth={active ? 2.2 : 1.6} />
              <span>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
