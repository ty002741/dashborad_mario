"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { TodayWellness, ActivityRow } from "@/lib/transforms";
import { Zap, AlertTriangle, BedDouble, RefreshCw } from "lucide-react";

interface Summary {
  status: "green" | "yellow" | "red";
  headline: string;
  summary: string;
  recommendation: string;
}

const statusConfig = {
  green: {
    icon: Zap,
    label: "今日可以訓練",
    bg: "from-green-950/60 to-slate-900/80",
    border: "border-green-500/30",
    glow: "bg-green-500/10",
    iconColor: "text-green-400",
    badge: "bg-green-500/20 text-green-400 border-green-500/30",
    dot: "bg-green-400",
  },
  yellow: {
    icon: AlertTriangle,
    label: "建議輕鬆活動",
    bg: "from-yellow-950/60 to-slate-900/80",
    border: "border-yellow-500/30",
    glow: "bg-yellow-500/10",
    iconColor: "text-yellow-400",
    badge: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    dot: "bg-yellow-400",
  },
  red: {
    icon: BedDouble,
    label: "今日建議休息",
    bg: "from-red-950/60 to-slate-900/80",
    border: "border-red-500/30",
    glow: "bg-red-500/10",
    iconColor: "text-red-400",
    badge: "bg-red-500/20 text-red-400 border-red-500/30",
    dot: "bg-red-400",
  },
};

interface Props {
  wellness: TodayWellness;
  recentActivities: ActivityRow[];
}

export default function DailySummaryCard({ wellness, recentActivities }: Props) {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchSummary() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/daily-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wellness, recentActivities }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSummary(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "分析失敗");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchSummary(); }, []);

  const cfg = summary ? statusConfig[summary.status] : statusConfig.green;
  const Icon = cfg.icon;

  return (
    <div className={`relative rounded-xl overflow-hidden border ${summary ? cfg.border : "border-muted/30"} bg-gradient-to-br ${summary ? cfg.bg : "from-slate-900/80 to-slate-900/80"}`}>
      <div className={`absolute inset-0 rounded-xl ${summary ? cfg.glow : ""} pointer-events-none`} />

      <div className="relative p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {loading ? (
              <div className="w-5 h-5 rounded-full border-2 border-muted/40 border-t-blue-400 animate-spin" />
            ) : (
              <Icon className={`w-5 h-5 ${cfg.iconColor}`} />
            )}
            <span className="text-sm font-semibold text-foreground">今日訓練建議</span>
            {summary && (
              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${cfg.badge}`}>
                <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${cfg.dot}`} />
                {cfg.label}
              </span>
            )}
          </div>
          {!loading && (
            <button
              onClick={fetchSummary}
              className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
              title="重新分析"
            >
              <RefreshCw className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          )}
        </div>

        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-5 w-48 bg-white/5" />
            <Skeleton className="h-4 w-full bg-white/5" />
            <Skeleton className="h-4 w-4/5 bg-white/5" />
            <Skeleton className="h-4 w-2/3 bg-white/5" />
          </div>
        ) : error ? (
          <p className="text-sm text-red-400">{error}</p>
        ) : summary ? (
          <div className="space-y-2">
            <p className={`text-lg font-bold ${cfg.iconColor}`}>{summary.headline}</p>
            <p className="text-sm text-slate-300 leading-relaxed">{summary.summary}</p>
            <div className="flex items-start gap-2 mt-3 pt-3 border-t border-white/5">
              <span className="text-xs text-muted-foreground shrink-0 mt-0.5">建議</span>
              <p className="text-sm text-foreground font-medium">{summary.recommendation}</p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
