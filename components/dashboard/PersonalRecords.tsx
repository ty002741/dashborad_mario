import { Trophy, Ruler, MountainSnow } from "lucide-react";

interface PR {
  fastest5k: { pace: string; date: string; name: string } | null;
  longestDistance: { distance: string; date: string; name: string } | null;
  highestElevation: { elevation: string; date: string; name: string } | null;
}

export default function PersonalRecords({ pr }: { pr: PR }) {
  const records = [
    {
      label: "最快 5K 配速",
      value: pr.fastest5k?.pace ?? "--",
      sub: pr.fastest5k ? `${pr.fastest5k.date} · ${pr.fastest5k.name}` : "尚無 5K 以上跑步紀錄",
      icon: Trophy,
      accent: "text-yellow-400",
      bg: "bg-yellow-500/10 border-yellow-500/20",
    },
    {
      label: "最長距離",
      value: pr.longestDistance?.distance ?? "--",
      sub: pr.longestDistance ? `${pr.longestDistance.date} · ${pr.longestDistance.name}` : "無資料",
      icon: Ruler,
      accent: "text-blue-400",
      bg: "bg-blue-500/10 border-blue-500/20",
    },
    {
      label: "最高單次爬升",
      value: pr.highestElevation?.elevation ?? "--",
      sub: pr.highestElevation ? `${pr.highestElevation.date} · ${pr.highestElevation.name}` : "無資料",
      icon: MountainSnow,
      accent: "text-green-400",
      bg: "bg-green-500/10 border-green-500/20",
    },
  ];

  return (
    <div className="space-y-3">
      {records.map((r) => {
        const Icon = r.icon;
        return (
          <div key={r.label} className={`flex items-center gap-3 rounded-lg border p-3 ${r.bg}`}>
            <div className={`flex-shrink-0 ${r.accent}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">{r.label}</p>
              <p className={`text-lg font-bold ${r.accent}`}>{r.value}</p>
              <p className="text-xs text-muted-foreground truncate">{r.sub}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
