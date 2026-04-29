const BASE_URL = "https://intervals.icu/api/v1";

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

export async function fetchActivities(oldest: string, newest: string): Promise<IntervalsActivity[]> {
  const athleteId = process.env.INTERVALS_ATHLETE_ID!;
  const key = process.env.INTERVALS_API_KEY!;
  const auth = "Basic " + Buffer.from(`API_KEY:${key}`).toString("base64");

  const res = await fetch(
    `${BASE_URL}/athlete/${athleteId}/activities?oldest=${oldest}&newest=${newest}`,
    {
      headers: { Authorization: auth, "Content-Type": "application/json" },
      next: { revalidate: 3600 },
    }
  );

  if (!res.ok) throw new Error(`Intervals.icu API 錯誤：${res.status}`);
  return res.json();
}
