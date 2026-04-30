'use client'
import { Bell, Menu, Moon, Sun, User } from 'lucide-react'
import { useTheme } from '@/components/providers/ThemeProvider'

export default function TopBar({ onMenuClick }: { onMenuClick: () => void }) {
  const { theme, toggle } = useTheme()

  return (
    <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4 md:px-6 shrink-0">
      <div className="flex items-center gap-3">
        <button
          className="p-2 rounded-lg hover:bg-accent transition-colors md:hidden"
          onClick={onMenuClick}
          aria-label="開啟選單"
        >
          <Menu className="w-4 h-4 text-muted-foreground" />
        </button>
        <div>
          <p className="text-xs text-muted-foreground">歡迎回來</p>
          <h2 className="text-sm font-semibold text-foreground">Mario 的訓練總覽</h2>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          className="p-2 rounded-lg hover:bg-accent transition-colors"
          onClick={toggle}
          aria-label="切換主題"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-muted-foreground" />
          ) : (
            <Moon className="w-4 h-4 text-muted-foreground" />
          )}
        </button>
        <button className="p-2 rounded-lg hover:bg-accent transition-colors">
          <Bell className="w-4 h-4 text-muted-foreground" />
        </button>
        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
          <User className="w-4 h-4 text-white" />
        </div>
      </div>
    </header>
  )
}
