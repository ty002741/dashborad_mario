"use client";

import { useState } from "react";

interface HeatmapData {
  date: string;
  minutes: number;
  activities: string[];
}

function getColor(minutes: number): string {
  if (minutes === 0) return "bg-muted/30";
  if (minutes < 30) return "bg-blue-900/60";
  if (minutes < 60) return "bg-blue-700/70";
  if (minutes < 90) return "bg-blue-500/80";
  return "bg-blue-400";
}

function buildGrid(data: HeatmapData[]): (HeatmapData | null)[][] {
  const map: Record<string, HeatmapData> = {};
  data.forEach((d) => { map[d.date] = d; });

  const today = new Date();
  const endDate = new Date(today);
  // 從本週日開始往回推 52 週
  const startDate = new Date(endDate);
  startDate.setDate(endDate.getDate() - 364);

  // 對齊到週日
  const startDay = startDate.getDay();
  startDate.setDate(startDate.getDate() - startDay);

  const weeks: (HeatmapData | null)[][] = [];
  const cur = new Date(startDate);

  while (cur <= endDate) {
    const week: (HeatmapData | null)[] = [];
    for (let d = 0; d < 7; d++) {
      const dateStr = cur.toISOString().split("T")[0];
      week.push(map[dateStr] ?? { date: dateStr, minutes: 0, activities: [] });
      cur.setDate(cur.getDate() + 1);
    }
    weeks.push(week);
  }

  return weeks;
}

function getMonthLabels(weeks: (HeatmapData | null)[][]): { label: string; col: number }[] {
  const labels: { label: string; col: number }[] = [];
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  let lastMonth = -1;
  weeks.forEach((week, i) => {
    const first = week.find((d) => d !== null);
    if (!first) return;
    const m = new Date(first.date).getMonth();
    if (m !== lastMonth) {
      labels.push({ label: months[m], col: i });
      lastMonth = m;
    }
  });
  return labels;
}

export default function ActivityHeatmap({ data }: { data: HeatmapData[] }) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; cell: HeatmapData } | null>(null);
  const weeks = buildGrid(data);
  const monthLabels = getMonthLabels(weeks);

  return (
    <div className="relative select-none">
      {/* 月份標籤 */}
      <div className="flex mb-1" style={{ paddingLeft: "24px" }}>
        {monthLabels.map(({ label, col }) => (
          <span
            key={`${label}-${col}`}
            className="text-xs text-muted-foreground absolute"
            style={{ left: `${24 + col * 14}px` }}
          >
            {label}
          </span>
        ))}
      </div>

      <div className="flex gap-0 mt-5">
        {/* 星期標籤 */}
        <div className="flex flex-col gap-0.5 mr-1">
          {["日","一","二","三","四","五","六"].map((d, i) => (
            <span key={d} className={`text-xs text-muted-foreground h-3 leading-3 ${i % 2 === 0 ? "opacity-0" : ""}`}>
              {d}
            </span>
          ))}
        </div>

        {/* 格子 */}
        <div className="flex gap-0.5 overflow-x-auto">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-0.5">
              {week.map((cell, di) => {
                if (!cell) return <div key={di} className="w-3 h-3" />;
                return (
                  <div
                    key={di}
                    className={`w-3 h-3 rounded-sm cursor-pointer transition-opacity hover:opacity-80 ${getColor(cell.minutes)}`}
                    onMouseEnter={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setTooltip({ x: rect.left, y: rect.top, cell });
                    }}
                    onMouseLeave={() => setTooltip(null)}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* 圖例 */}
      <div className="flex items-center gap-1.5 mt-2 justify-end">
        <span className="text-xs text-muted-foreground">少</span>
        {["bg-muted/30","bg-blue-900/60","bg-blue-700/70","bg-blue-500/80","bg-blue-400"].map((c) => (
          <div key={c} className={`w-3 h-3 rounded-sm ${c}`} />
        ))}
        <span className="text-xs text-muted-foreground">多</span>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs shadow-xl"
          style={{ left: tooltip.x + 16, top: tooltip.y - 10 }}
        >
          <p className="text-muted-foreground">{tooltip.cell.date}</p>
          {tooltip.cell.minutes > 0 ? (
            <>
              <p className="text-white font-medium">{tooltip.cell.minutes} 分鐘</p>
              {tooltip.cell.activities.map((a, i) => (
                <p key={i} className="text-muted-foreground">{a}</p>
              ))}
            </>
          ) : (
            <p className="text-muted-foreground">休息日</p>
          )}
        </div>
      )}
    </div>
  );
}
