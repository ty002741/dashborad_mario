import { Bell, User } from "lucide-react";

export default function TopBar() {
  return (
    <header className="h-14 border-b border-border bg-card flex items-center justify-between px-6 shrink-0">
      <div>
        <p className="text-xs text-muted-foreground">歡迎回來</p>
        <h2 className="text-sm font-semibold text-foreground">
          Mario 的訓練總覽
        </h2>
      </div>
      <div className="flex items-center gap-3">
        <button className="p-2 rounded-lg hover:bg-accent transition-colors">
          <Bell className="w-4 h-4 text-muted-foreground" />
        </button>
        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
          <User className="w-4 h-4 text-white" />
        </div>
      </div>
    </header>
  );
}
