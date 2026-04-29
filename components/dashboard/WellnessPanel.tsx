import { Heart, Brain, Moon, Scale, Footprints } from "lucide-react";
import { TodayWellness } from "@/lib/transforms";

function tsbLabel(tsb: number | null): { text: string; color: string } {
  if (tsb === null) return { text: "--", color: "text-muted-foreground" };
  if (tsb > 10) return { text: "狀態絕佳 🔥", color: "text-green-400" };
  if (tsb > 0) return { text: "狀態良好", color: "text-blue-400" };
  if (tsb > -10) return { text: "輕度疲勞", color: "text-yellow-400" };
  return { text: "需要休息", color: "text-red-400" };
}

function hrvLabel(hrv: number | null): string {
  if (hrv === null) return "--";
  if (hrv >= 70) return `${hrv} ms ↑`;
  if (hrv >= 55) return `${hrv} ms`;
  return `${hrv} ms ↓`;
}

export default function WellnessPanel({ w }: { w: TodayWellness }) {
  const tsb = tsbLabel(w.tsb);

  const metrics = [
    {
      icon: Brain,
      label: "體能狀態 TSB",
      value: w.tsb !== null ? (w.tsb > 0 ? `+${w.tsb}` : `${w.tsb}`) : "--",
      sub: tsb.text,
      color: tsb.color,
      accent: "bg-green-500/10 border-green-500/20",
    },
    {
      icon: Heart,
      label: "靜止心率",
      value: w.restingHR ? `${w.restingHR} bpm` : "--",
      sub: w.restingHR && w.restingHR <= 55 ? "訓練有素 ✓" : "正常範圍",
      color: "text-red-400",
      accent: "bg-red-500/10 border-red-500/20",
    },
    {
      icon: Brain,
      label: "HRV 心率變異",
      value: hrvLabel(w.hrv),
      sub: w.hrv && w.hrv >= 60 ? "自律神經良好" : w.hrv ? "監控中" : "無資料",
      color: "text-purple-400",
      accent: "bg-purple-500/10 border-purple-500/20",
    },
    {
      icon: Moon,
      label: "睡眠",
      value: w.sleepHrs ? `${w.sleepHrs} h` : "--",
      sub: w.sleepScore ? `品質分數 ${w.sleepScore}` : "無資料",
      color: "text-blue-400",
      accent: "bg-blue-500/10 border-blue-500/20",
    },
    {
      icon: Scale,
      label: "體重",
      value: w.weight ? `${w.weight} kg` : "--",
      sub: "最新紀錄",
      color: "text-orange-400",
      accent: "bg-orange-500/10 border-orange-500/20",
    },
    {
      icon: Footprints,
      label: "今日步數",
      value: w.steps ? w.steps.toLocaleString() : "--",
      sub: w.steps && w.steps >= 8000 ? "達標 ✓" : "持續累積",
      color: "text-cyan-400",
      accent: "bg-cyan-500/10 border-cyan-500/20",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {metrics.map((m) => {
        const Icon = m.icon;
        return (
          <div key={m.label} className={`rounded-xl border p-3 ${m.accent}`}>
            <div className="flex items-center gap-1.5 mb-1.5">
              <Icon className={`w-3.5 h-3.5 ${m.color}`} />
              <span className="text-xs text-muted-foreground">{m.label}</span>
            </div>
            <p className={`text-xl font-bold ${m.color}`}>{m.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{m.sub}</p>
          </div>
        );
      })}
    </div>
  );
}
