import Link from "next/link";
import { Activity, BarChart2, Calendar, Settings, Zap } from "lucide-react";

const navItems = [
  { href: "/dashboard", icon: BarChart2, label: "訓練總覽" },
  { href: "/dashboard/activities", icon: Activity, label: "活動紀錄" },
  { href: "/dashboard/calendar", icon: Calendar, label: "訓練日曆" },
];

export default function Sidebar() {
  return (
    <aside className="hidden md:flex w-56 bg-card border-r border-border flex-col shrink-0">
      <div className="p-4 border-b border-border flex items-center gap-2">
        <Zap className="text-blue-400 w-5 h-5" />
        <span className="font-bold text-sm tracking-widest text-foreground">
          SPORTS HQ
        </span>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
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
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          <Settings className="w-4 h-4" />
          設定
        </Link>
      </div>
    </aside>
  );
}
