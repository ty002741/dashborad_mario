const BASE_URL = "https://intervals.icu/api/v1";

function getAuth() {
  const key = process.env.INTERVALS_API_KEY!;
  return "Basic " + Buffer.from(`API_KEY:${key}`).toString("base64");
}

function getAthleteId() {
  return process.env.INTERVALS_ATHLETE_ID!;
}

export interface IntervalsActivity {
  id: string;
  name: string;
  type: string;
  start_date_local: string;
  distance: number;
  moving_time: number;
  total_elevation_gain: number;
  average_speed: number;
  average_heartrate?: number;
  max_heartrate?: number;
  calories?: number;
}

export interface WellnessEntry {
  id: string; // YYYY-MM-DD
  ctl: number | null;
  atl: number | null;
  rampRate: number | null;
  restingHR: number | null;
  hrv: number | null;
  sleepSecs: number | null;
  sleepScore: number | null;
  weight: number | null;
  steps: number | null;
}

export interface AthleteProfile {
  name: string;
  sex: string;
  icu_resting_hr: number | null;
}

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { Authorization: getAuth(), "Content-Type": "application/json" },
    next: { revalidate: 900 },
  });
  if (!res.ok) throw new Error(`Intervals.icu API 錯誤：${res.status}`);
  return res.json();
}

export function fetchActivities(oldest: string, newest: string): Promise<IntervalsActivity[]> {
  return apiFetch(`/athlete/${getAthleteId()}/activities?oldest=${oldest}&newest=${newest}`);
}

export function fetchWellness(oldest: string, newest: string): Promise<WellnessEntry[]> {
  return apiFetch(`/athlete/${getAthleteId()}/wellness?oldest=${oldest}&newest=${newest}`);
}

export function fetchAthleteProfile(): Promise<AthleteProfile> {
  return apiFetch(`/athlete/${getAthleteId()}`);
}
