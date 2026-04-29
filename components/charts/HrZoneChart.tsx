"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

export interface HrZoneData {
  name: string;
  minutes: number;
  color: string;
}

function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function HrZoneChart({ data, totalMinutes }: { data: HrZoneData[]; totalMinutes: number }) {
  const filled = data.filter((d) => d.minutes > 0);

  return (
    <div className="flex items-center gap-4">
      <div className="relative flex-shrink-0" style={{ width: 160, height: 160 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={filled.length > 0 ? filled : [{ name: "無資料", minutes: 1, color: "#27272a" }]}
              cx="50%"
              cy="50%"
              innerRadius={52}
              outerRadius={72}
              paddingAngle={2}
              dataKey="minutes"
              stroke="none"
            >
              {(filled.length > 0 ? filled : [{ color: "#27272a" }]).map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ backgroundColor: "#18181b", border: "1px solid #27272a", borderRadius: 8, fontSize: 12 }}
              formatter={(value) => [formatTime(Number(value)), ""]}
            />
          </PieChart>
        </ResponsiveContainer>
        {/* 中央顯示總時間 */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-lg font-bold text-foreground">{formatTime(totalMinutes)}</span>
          <span className="text-xs text-muted-foreground">總時間</span>
        </div>
      </div>

      {/* 圖例 */}
      <div className="space-y-1.5 flex-1">
        {data.map((zone) => (
          <div key={zone.name} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: zone.color }} />
              <span className="text-muted-foreground">{zone.name}</span>
            </div>
            <span className="font-medium text-foreground">{formatTime(zone.minutes)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
