'use client'
import Link from 'next/link'
import { Activity, BarChart2, Calendar, Settings, X, Zap } from 'lucide-react'

const navItems = [
  { href: '/dashboard', icon: BarChart2, label: '訓練總覽' },
  { href: '/dashboard/activities', icon: Activity, label: '活動紀錄' },
  { href: '/dashboard/calendar', icon: Calendar, label: '訓練日曆' },
]

interface SidebarProps {
  mobileOpen: boolean
  onClose: () => void
}

function NavContent({ onNavClick }: { onNavClick?: () => void }) {
  return (
    <>
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            onClick={onNavClick}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <Icon className="w-4 h-4" />
            {label}
          </Link>
        ))}
      </nav>
      <div className="p-3 border-t border-border">
        <Link
          href="/dashboard/settings"
          onClick={onNavClick}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          <Settings className="w-4 h-4" />
          設定
        </Link>
      </div>
    </>
  )
}

export default function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  return (
    <>
      {/* 桌面版 Sidebar */}
      <aside className="hidden md:flex w-56 bg-card border-r border-border flex-col shrink-0">
        <div className="p-4 border-b border-border flex items-center gap-2">
          <Zap className="text-blue-400 w-5 h-5" />
          <span className="font-bold text-sm tracking-widest text-foreground">SPORTS HQ</span>
        </div>
        <NavContent />
      </aside>

      {/* 手機版抽屜 Drawer */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 z-50 bg-card border-r border-border flex flex-col transform transition-transform duration-300 ease-in-out md:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Zap className="text-blue-400 w-5 h-5" />
            <span className="font-bold text-sm tracking-widest text-foreground">SPORTS HQ</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-accent transition-colors"
            aria-label="關閉選單"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
        <NavContent onNavClick={onClose} />
      </aside>
    </>
  )
}
