"use client";

import {
  ComposedChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { HrPacePoint, secondsToPace } from "@/lib/transforms";

export default function HeartRatePaceChart({ data }: { data: HrPacePoint[] }) {
  const paces = data.map(d => d.pace);
  const minPace = Math.min(...paces) - 15;
  const maxPace = Math.max(...paces) + 15;

  return (
    <ResponsiveContainer width="100%" height={220}>
      <ComposedChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
        <XAxis dataKey="date" tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis yAxisId="hr" orientation="left" domain={["auto", "auto"]}
          tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} unit=" bpm" width={60} />
        <YAxis yAxisId="pace" orientation="right" domain={[maxPace, minPace]} reversed
          tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false}
          tickFormatter={secondsToPace} width={48} />
        <Tooltip
          contentStyle={{ backgroundColor: "#18181b", border: "1px solid #27272a", borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: "#a1a1aa" }}
          itemStyle={{ color: "#f4f4f5" }}
          formatter={(value, name) => {
            const v = Number(value);
            return name === "avgHr" ? [`${v} bpm`, "平均心率"] : [`${secondsToPace(v)} /km`, "配速"];
          }}
        />
        <Legend wrapperStyle={{ fontSize: 12, color: "#71717a" }}
          formatter={(value) => (value === "avgHr" ? "平均心率" : "配速")} />
        <Line yAxisId="hr" type="monotone" dataKey="avgHr" stroke="#ef4444" strokeWidth={2}
          dot={{ fill: "#ef4444", r: 3 }} activeDot={{ r: 5 }} />
        <Line yAxisId="pace" type="monotone" dataKey="pace" stroke="#22d3ee" strokeWidth={2}
          dot={{ fill: "#22d3ee", r: 3 }} activeDot={{ r: 5 }} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
