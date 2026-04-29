"use client";

import {
  ComposedChart, Line, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ReferenceLine, ResponsiveContainer,
} from "recharts";
import { FitnessFatiguePoint } from "@/lib/transforms";

export default function FitnessFatigueChart({ data }: { data: FitnessFatiguePoint[] }) {
  const tsbValues = data.map(d => d.tsb);
  const minTsb = Math.min(...tsbValues) - 5;
  const maxTsb = Math.max(...tsbValues) + 5;

  // 每兩週顯示一個 X 軸標籤
  const tickInterval = Math.max(1, Math.floor(data.length / 8));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <ComposedChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
        <XAxis
          dataKey="date"
          tick={{ fill: "#71717a", fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          interval={tickInterval}
          tickFormatter={(v) => v.slice(5)} // MM-DD
        />
        <YAxis
          yAxisId="load"
          orientation="left"
          tick={{ fill: "#71717a", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          domain={[0, "auto"]}
          width={36}
        />
        <YAxis
          yAxisId="tsb"
          orientation="right"
          domain={[minTsb, maxTsb]}
          tick={{ fill: "#71717a", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={36}
        />
        <Tooltip
          contentStyle={{ backgroundColor: "#18181b", border: "1px solid #27272a", borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: "#a1a1aa" }}
          formatter={(value, name) => {
            const labels: Record<string, string> = { ctl: "體能 CTL", atl: "疲勞 ATL", tsb: "狀態 TSB" };
            return [Number(value).toFixed(1), labels[String(name)] ?? String(name)];
          }}
        />
        <Legend
          wrapperStyle={{ fontSize: 11, color: "#71717a" }}
          formatter={(v) => { const m: Record<string,string> = { ctl: "體能 CTL", atl: "疲勞 ATL", tsb: "狀態 TSB" }; return m[String(v)] ?? v; }}
        />
        <ReferenceLine yAxisId="tsb" y={0} stroke="#ffffff20" strokeDasharray="4 4" />
        {/* TSB 背景色塊：正值綠，負值紅 */}
        <Bar yAxisId="tsb" dataKey="tsb" fill="#22c55e" opacity={0.15} radius={[2, 2, 0, 0]} />
        <Line yAxisId="load" type="monotone" dataKey="ctl" stroke="#3b82f6" strokeWidth={2.5}
          dot={false} activeDot={{ r: 4 }} />
        <Line yAxisId="load" type="monotone" dataKey="atl" stroke="#ef4444" strokeWidth={2}
          dot={false} activeDot={{ r: 4 }} strokeDasharray="5 3" />
        <Line yAxisId="tsb" type="monotone" dataKey="tsb" stroke="#22c55e" strokeWidth={1.5}
          dot={false} activeDot={{ r: 4 }} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
