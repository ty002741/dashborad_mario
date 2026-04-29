"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Bot, Sparkles } from "lucide-react";

interface Props {
  analysis: string | null;
  loading: boolean;
  activityName?: string;
}

export default function AICoachCard({ analysis, loading, activityName }: Props) {
  if (!loading && !analysis) return null;

  return (
    <div className="relative rounded-xl overflow-hidden border border-blue-500/30 bg-gradient-to-br from-blue-950/60 via-purple-950/40 to-slate-900/80">
      {/* 發光邊框效果 */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-transparent pointer-events-none" />

      <div className="relative p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-500/20 border border-blue-500/40">
            <Bot className="w-4 h-4 text-blue-400" />
          </div>
          <span className="text-sm font-semibold text-blue-300 tracking-wide flex items-center gap-1">
            AI 教練分析
            <Sparkles className="w-3 h-3 text-purple-400" />
          </span>
          {activityName && (
            <span className="ml-auto text-xs text-muted-foreground truncate max-w-48">
              {activityName}
            </span>
          )}
        </div>

        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full bg-blue-900/40" />
            <Skeleton className="h-4 w-4/5 bg-blue-900/40" />
            <Skeleton className="h-4 w-3/5 bg-blue-900/40" />
          </div>
        ) : (
          <p className="text-sm text-slate-200 leading-relaxed">{analysis}</p>
        )}
      </div>
    </div>
  );
}
