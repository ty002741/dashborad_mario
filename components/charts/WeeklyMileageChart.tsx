"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { WeeklyData } from "@/lib/transforms";

export default function WeeklyMileageChart({ data }: { data: WeeklyData[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} barGap={2}>
        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
        <XAxis dataKey="week" tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} unit=" km" width={52} />
        <Tooltip
          contentStyle={{ backgroundColor: "#18181b", border: "1px solid #27272a", borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: "#a1a1aa" }}
          itemStyle={{ color: "#f4f4f5" }}
          formatter={(value) => [`${Number(value)} km`]}
        />
        <Legend
          wrapperStyle={{ fontSize: 12, color: "#71717a" }}
          formatter={(value) => (value === "run" ? "跑步" : "騎乘")}
        />
        <Bar dataKey="run" fill="#3b82f6" radius={[3, 3, 0, 0]} name="run" />
        <Bar dataKey="ride" fill="#f97316" radius={[3, 3, 0, 0]} name="ride" />
      </BarChart>
    </ResponsiveContainer>
  );
}
