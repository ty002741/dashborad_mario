export type ActivityType = "跑步" | "騎乘" | "游泳" | "健走";

export interface Activity {
  id: string;
  date: string;
  type: ActivityType;
  name: string;
  distanceMeters: number;
  movingTimeSeconds: number;
  avgHeartRate?: number;
  elevationGainMeters?: number;
}

export interface WeeklyData {
  week: string;
  run: number;
  ride: number;
}

export interface HrPaceData {
  date: string;
  avgHr: number;
  pace: number; // 秒/公里
}

export interface StatCard {
  label: string;
  value: string;
  change: string;
  positive: boolean;
  unit?: string;
}
