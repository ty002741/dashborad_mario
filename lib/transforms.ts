import { IntervalsActivity, WellnessEntry } from "./intervals";

// ── Wellness 型別 ──────────────────────────────────
export interface FitnessFatiguePoint {
  date: string;
  ctl: number;
  atl: number;
  tsb: number;
}

export interface HrvSleepPoint {
  date: string;
  hrv: number | null;
  sleepScore: number | null;
  sleepHrs: number | null;
}

export interface TodayWellness {
  ctl: number | null;
  atl: number | null;
  tsb: number | null;
  restingHR: number | null;
  hrv: number | null;
  sleepScore: number | null;
  sleepHrs: number | null;
  weight: number | null;
  steps: number | null;
}

export interface KarvonenZone {
  name: string;
  minHR: number;
  maxHR: number;
  color: string;
  description: string;
}

// ── Wellness 轉換 ─────────────────────────────────
export function getFitnessFatigueData(wellness: WellnessEntry[]): FitnessFatiguePoint[] {
  return wellness
    .filter(w => w.ctl !== null && w.atl !== null)
    .map(w => ({
      date: w.id,
      ctl: Math.round((w.ctl ?? 0) * 10) / 10,
      atl: Math.round((w.atl ?? 0) * 10) / 10,
      tsb: Math.round(((w.ctl ?? 0) - (w.atl ?? 0)) * 10) / 10,
    }));
}

export function getHrvSleepData(wellness: WellnessEntry[]): HrvSleepPoint[] {
  return wellness
    .filter(w => w.hrv !== null || w.sleepScore !== null)
    .slice(-60)
    .map(w => ({
      date: w.id.slice(5), // MM-DD
      hrv: w.hrv,
      sleepScore: w.sleepScore,
      sleepHrs: w.sleepSecs ? Math.round((w.sleepSecs / 3600) * 10) / 10 : null,
    }));
}

export function getTodayWellness(wellness: WellnessEntry[]): TodayWellness {
  const latest = [...wellness].reverse().find(w => w.ctl !== null) ?? wellness[wellness.length - 1];
  return {
    ctl: latest?.ctl ? Math.round(latest.ctl * 10) / 10 : null,
    atl: latest?.atl ? Math.round(latest.atl * 10) / 10 : null,
    tsb: latest?.ctl && latest?.atl ? Math.round((latest.ctl - latest.atl) * 10) / 10 : null,
    restingHR: latest?.restingHR ?? null,
    hrv: latest?.hrv ?? null,
    sleepScore: latest?.sleepScore ?? null,
    sleepHrs: latest?.sleepSecs ? Math.round((latest.sleepSecs / 3600) * 10) / 10 : null,
    weight: latest?.weight ?? null,
    steps: latest?.steps ?? null,
  };
}

// ── Karvonen 心率區間（科學版） ──────────────────────
export function computeKarvonenZones(restHR: number, maxHR: number): KarvonenZone[] {
  // Target HR = (maxHR - restHR) × intensity% + restHR
  const hrr = (pct: number) => Math.round((maxHR - restHR) * pct + restHR);
  return [
    { name: "Z1 恢復", minHR: hrr(0.50), maxHR: hrr(0.60), color: "#6b7280", description: "主動恢復，促進血液循環" },
    { name: "Z2 有氧", minHR: hrr(0.60), maxHR: hrr(0.70), color: "#3b82f6", description: "建立有氧基礎，80% 訓練應在此區" },
    { name: "Z3 節奏", minHR: hrr(0.70), maxHR: hrr(0.80), color: "#22c55e", description: "馬拉松配速，提升乳酸緩衝能力" },
    { name: "Z4 閾值", minHR: hrr(0.80), maxHR: hrr(0.90), color: "#f97316", description: "乳酸閾值訓練，提升無氧能力" },
    { name: "Z5 無氧", minHR: hrr(0.90), maxHR: maxHR, color: "#ef4444", description: "VO₂max 區間，每週最多一次" },
  ];
}

// ── 型別 ───────────────────────────────────────────
export interface WeeklyData {
  week: string;
  run: number;
  ride: number;
}

export interface HrPacePoint {
  date: string;
  avgHr: number;
  pace: number; // 秒/公里
}

export interface ActivityRow {
  id: string;
  date: string;
  type: string;
  name: string;
  distance: string;
  pace: string;
  hr?: number;
  // 原始數值，供 AI 分析用
  rawDistance: number;
  rawMovingTime: number;
  rawAvgSpeed: number;
  rawAvgHr?: number;
  rawMaxHr?: number;
  rawElevation: number;
}

export interface HrZoneData {
  name: string;
  minutes: number;
  color: string;
}

export interface HeatmapData {
  date: string;
  minutes: number;
  activities: string[];
}

export interface PersonalRecords {
  fastest5k: { pace: string; date: string; name: string } | null;
  longestDistance: { distance: string; date: string; name: string } | null;
  highestElevation: { elevation: string; date: string; name: string } | null;
}

export interface DashboardStats {
  weeklyRunKm: string;
  runChange: string;
  runPositive: boolean;
  avgPace: string;
  paceChange: string;
  pacePositive: boolean;
  monthActivities: number;
  actChange: string;
  actPositive: boolean;
  monthElevM: string;
  elevChange: string;
  elevPositive: boolean;
}

// ── 工具函式 ──────────────────────────────────────
export function secondsToPace(total: number): string {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function getActivityLabel(type: string): string {
  const map: Record<string, string> = {
    Run: "跑步", VirtualRun: "虛擬跑步",
    Ride: "騎乘", VirtualRide: "虛擬騎乘",
    Walk: "健走", WeightTraining: "重訓",
    RockClimbing: "攀岩", Swim: "游泳",
  };
  return map[type] ?? type;
}

function fmt(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function getMondayOf(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay() || 7;
  d.setDate(d.getDate() - day + 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

const isRun = (a: IntervalsActivity) => a.type === "Run" || a.type === "VirtualRun";
const isRide = (a: IntervalsActivity) => a.type === "Ride" || a.type === "VirtualRide";

function inRange(dateStr: string, start: Date, end: Date) {
  const d = new Date(dateStr);
  return d >= start && d < end;
}

// ── 資料轉換 ──────────────────────────────────────
export function getWeeklyChartData(activities: IntervalsActivity[]): WeeklyData[] {
  const now = new Date();
  return Array.from({ length: 8 }, (_, i) => {
    const weekStart = getMondayOf(new Date(now.getTime() - (7 - i) * 7 * 24 * 60 * 60 * 1000));
    const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
    const label = `${weekStart.getMonth() + 1}/${weekStart.getDate()}`;
    let run = 0, ride = 0;
    activities.forEach(a => {
      if (!a.distance || !inRange(a.start_date_local, weekStart, weekEnd)) return;
      if (isRun(a)) run += a.distance / 1000;
      else if (isRide(a)) ride += a.distance / 1000;
    });
    return { week: label, run: Math.round(run * 10) / 10, ride: Math.round(ride * 10) / 10 };
  });
}

export function getHrPaceData(activities: IntervalsActivity[]): HrPacePoint[] {
  return activities
    .filter(a => isRun(a) && a.average_heartrate && a.average_speed > 0)
    .slice(0, 15)
    .reverse()
    .map(a => ({
      date: fmt(a.start_date_local),
      avgHr: a.average_heartrate!,
      pace: Math.round(1000 / a.average_speed),
    }));
}

export function getRecentRows(activities: IntervalsActivity[]): ActivityRow[] {
  return activities.slice(0, 8).map(a => {
    let pace = "--";
    if (isRun(a) && a.average_speed > 0)
      pace = `${secondsToPace(Math.round(1000 / a.average_speed))} /km`;
    else if (isRide(a) && a.average_speed > 0)
      pace = `${(a.average_speed * 3.6).toFixed(1)} km/h`;
    return {
      id: a.id,
      date: fmt(a.start_date_local),
      type: getActivityLabel(a.type),
      name: a.name,
      distance: a.distance ? `${(a.distance / 1000).toFixed(1)} km` : "--",
      pace,
      hr: a.average_heartrate,
      rawDistance: a.distance ?? 0,
      rawMovingTime: a.moving_time ?? 0,
      rawAvgSpeed: a.average_speed ?? 0,
      rawAvgHr: a.average_heartrate,
      rawMaxHr: a.max_heartrate,
      rawElevation: a.total_elevation_gain ?? 0,
    };
  });
}

export function computeHrZones(activities: IntervalsActivity[]): HrZoneData[] {
  const maxHr = Math.max(...activities.filter(a => a.max_heartrate).map(a => a.max_heartrate!), 185);
  const zones: (HrZoneData & { minPct: number; maxPct: number })[] = [
    { name: "Z1 恢復", minPct: 0, maxPct: 0.60, color: "#6b7280", minutes: 0 },
    { name: "Z2 有氧", minPct: 0.60, maxPct: 0.70, color: "#3b82f6", minutes: 0 },
    { name: "Z3 節奏", minPct: 0.70, maxPct: 0.80, color: "#22c55e", minutes: 0 },
    { name: "Z4 閾值", minPct: 0.80, maxPct: 0.90, color: "#f97316", minutes: 0 },
    { name: "Z5 無氧", minPct: 0.90, maxPct: 1.00, color: "#ef4444", minutes: 0 },
  ];
  activities.filter(a => a.average_heartrate && a.moving_time).forEach(a => {
    const pct = a.average_heartrate! / maxHr;
    const zone = zones.find(z => pct >= z.minPct && (pct < z.maxPct || z.maxPct === 1.0));
    if (zone) zone.minutes += Math.round(a.moving_time / 60);
  });
  return zones.map(z => ({ name: z.name, minutes: z.minutes, color: z.color }));
}

export function getHeatmapData(activities: IntervalsActivity[]): HeatmapData[] {
  const map: Record<string, { minutes: number; activities: string[] }> = {};
  activities.forEach(a => {
    const date = a.start_date_local.split("T")[0];
    if (!map[date]) map[date] = { minutes: 0, activities: [] };
    map[date].minutes += Math.round((a.moving_time ?? 0) / 60);
    map[date].activities.push(a.name);
  });
  return Object.entries(map).map(([date, v]) => ({ date, ...v }));
}

export function computePRs(activities: IntervalsActivity[]): PersonalRecords {
  const runs = activities.filter(a => isRun(a) && a.distance && a.average_speed > 0);
  const longRuns = runs.filter(a => a.distance >= 5000);
  const fastest5kActivity = longRuns.length > 0
    ? longRuns.reduce((best, a) => a.average_speed > best.average_speed ? a : best)
    : null;

  const longest = activities.filter(a => a.distance).reduce<IntervalsActivity | null>(
    (best, a) => (!best || a.distance > best.distance) ? a : best, null
  );
  const highestElev = activities.filter(a => a.total_elevation_gain).reduce<IntervalsActivity | null>(
    (best, a) => (!best || a.total_elevation_gain > best.total_elevation_gain) ? a : best, null
  );

  return {
    fastest5k: fastest5kActivity ? {
      pace: `${secondsToPace(Math.round(1000 / fastest5kActivity.average_speed))} /km`,
      date: fmt(fastest5kActivity.start_date_local),
      name: fastest5kActivity.name,
    } : null,
    longestDistance: longest ? {
      distance: `${(longest.distance / 1000).toFixed(1)} km`,
      date: fmt(longest.start_date_local),
      name: longest.name,
    } : null,
    highestElevation: highestElev ? {
      elevation: `${Math.round(highestElev.total_elevation_gain)} m`,
      date: fmt(highestElev.start_date_local),
      name: highestElev.name,
    } : null,
  };
}

export function computeStats(activities: IntervalsActivity[]): DashboardStats {
  const now = new Date();
  const thisWeekStart = getMondayOf(now);
  const lastWeekStart = new Date(thisWeekStart.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const thisWeekRuns = activities.filter(a => isRun(a) && inRange(a.start_date_local, thisWeekStart, now));
  const lastWeekRuns = activities.filter(a => isRun(a) && inRange(a.start_date_local, lastWeekStart, thisWeekStart));

  const thisKm = thisWeekRuns.reduce((s, a) => s + (a.distance || 0) / 1000, 0);
  const lastKm = lastWeekRuns.reduce((s, a) => s + (a.distance || 0) / 1000, 0);
  const kmPct = lastKm > 0 ? (thisKm - lastKm) / lastKm * 100 : 0;

  const avgPace = (runs: IntervalsActivity[]) => {
    const r = runs.filter(a => a.average_speed > 0);
    return r.length > 0
      ? Math.round(r.reduce((s, a) => s + 1000 / a.average_speed, 0) / r.length)
      : 0;
  };
  const thisPace = avgPace(thisWeekRuns);
  const lastPace = avgPace(lastWeekRuns);
  const paceDiff = thisPace && lastPace ? lastPace - thisPace : 0; // 正值 = 進步（變快）

  const thisMonthActs = activities.filter(a => inRange(a.start_date_local, thisMonthStart, now));
  const lastMonthActs = activities.filter(a => inRange(a.start_date_local, lastMonthStart, thisMonthStart));
  const actDiff = thisMonthActs.length - lastMonthActs.length;

  const elev = (acts: IntervalsActivity[]) => acts.reduce((s, a) => s + (a.total_elevation_gain || 0), 0);
  const thisElev = elev(thisMonthActs);
  const lastElev = elev(lastMonthActs);
  const elevDiff = thisElev - lastElev;

  const sign = (n: number) => n >= 0 ? "+" : "";

  return {
    weeklyRunKm: thisKm.toFixed(1),
    runChange: lastKm > 0 ? `${sign(kmPct)}${kmPct.toFixed(0)}% vs 上週` : "上週無跑步資料",
    runPositive: thisKm >= lastKm,
    avgPace: thisPace > 0 ? `${secondsToPace(thisPace)} /km` : "--",
    paceChange: paceDiff !== 0 ? `${sign(paceDiff)}${secondsToPace(Math.abs(paceDiff))} vs 上週` : "--",
    pacePositive: paceDiff >= 0,
    monthActivities: thisMonthActs.length,
    actChange: `${sign(actDiff)}${actDiff} vs 上月`,
    actPositive: actDiff >= 0,
    monthElevM: Math.round(thisElev).toLocaleString(),
    elevChange: `${sign(elevDiff)}${Math.round(Math.abs(elevDiff))} m vs 上月`,
    elevPositive: elevDiff >= 0,
  };
}
