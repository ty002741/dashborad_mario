import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import StatsCard from "@/components/dashboard/StatsCard";
import WorkoutAnalysisSection from "@/components/dashboard/WorkoutAnalysisSection";
import WeeklyMileageChart from "@/components/charts/WeeklyMileageChart";
import HeartRatePaceChart from "@/components/charts/HeartRatePaceChart";
import HrZoneChart from "@/components/charts/HrZoneChart";
import FitnessFatigueChart from "@/components/charts/FitnessFatigueChart";
import ActivityHeatmap from "@/components/dashboard/ActivityHeatmap";
import PersonalRecords from "@/components/dashboard/PersonalRecords";
import WellnessPanel from "@/components/dashboard/WellnessPanel";
import { fetchActivities, fetchWellness } from "@/lib/intervals";
import {
  getWeeklyChartData, getHrPaceData, getRecentRows,
  computeStats, computeHrZones, getHeatmapData, computePRs,
  getFitnessFatigueData, getTodayWellness, computeKarvonenZones,
} from "@/lib/transforms";

export default async function DashboardPage() {
  const now = new Date();
  const newest = now.toISOString().split("T")[0];
  const oldest365 = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const oldest120 = new Date(now.getTime() - 120 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const [activities, wellness] = await Promise.all([
    fetchActivities(oldest365, newest),
    fetchWellness(oldest120, newest),
  ]);

  // 各資料轉換
  const stats = computeStats(activities);
  const weeklyData = getWeeklyChartData(activities);
  const hrPaceData = getHrPaceData(activities);
  const recentRows = getRecentRows(activities);
  const heatmapData = getHeatmapData(activities);
  const pr = computePRs(activities);
  const fitnessFatigueData = getFitnessFatigueData(wellness);
  const todayWellness = getTodayWellness(wellness);

  // Karvonen 心率區間（使用真實靜止心率 + 活動中最高心率）
  const restHR = todayWellness.restingHR ?? 50;
  const maxHR = Math.max(...activities.filter(a => a.max_heartrate).map(a => a.max_heartrate!), 185);
  const karvonenZones = computeKarvonenZones(restHR, maxHR);

  // 用 Karvonen 區間重新計算 HR zone 分佈
  const hrZones = karvonenZones.map(z => {
    const minutes = activities
      .filter(a => a.average_heartrate && a.moving_time &&
        a.average_heartrate >= z.minHR && a.average_heartrate < z.maxHR)
      .reduce((s, a) => s + Math.round(a.moving_time / 60), 0);
    return { name: z.name, minutes, color: z.color };
  });
  const totalMinutes = hrZones.reduce((s, z) => s + z.minutes, 0);

  const statCards = [
    { label: "本週跑量", value: `${stats.weeklyRunKm} km`, change: stats.runChange, positive: stats.runPositive },
    { label: "本週均配速", value: stats.avgPace, change: stats.paceChange, positive: stats.pacePositive },
    { label: "本月活動", value: `${stats.monthActivities} 次`, change: stats.actChange, positive: stats.actPositive },
    { label: "本月爬升", value: `${stats.monthElevM} m`, change: stats.elevChange, positive: stats.elevPositive },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-foreground tracking-tight">訓練總覽</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          過去一年 · {activities.length} 筆活動 · Karvonen 心率區間（靜止心率 {restHR} bpm）
        </p>
      </div>

      {/* 今日健康面板 */}
      <WellnessPanel w={todayWellness} />

      {/* 統計卡片 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => <StatsCard key={s.label} {...s} />)}
      </div>

      {/* 體能疲勞圖 */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-1">
          <CardTitle className="text-sm font-medium">體能 · 疲勞 · 狀態圖（CTL / ATL / TSB）</CardTitle>
          <p className="text-xs text-muted-foreground">
            藍線=體能積累(42天)　紅虛線=近期疲勞(7天)　綠線=當下競技狀態
          </p>
        </CardHeader>
        <CardContent>
          <FitnessFatigueChart data={fitnessFatigueData} />
        </CardContent>
      </Card>

      {/* 週跑量 + 心率配速 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">週跑量 / 騎乘量</CardTitle>
          </CardHeader>
          <CardContent>
            <WeeklyMileageChart data={weeklyData} />
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">心率 vs 配速趨勢（跑步）</CardTitle>
          </CardHeader>
          <CardContent>
            <HeartRatePaceChart data={hrPaceData} />
          </CardContent>
        </Card>
      </div>

      {/* 年度熱力圖 */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">年度訓練熱力圖</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <ActivityHeatmap data={heatmapData} />
        </CardContent>
      </Card>

      {/* 心率區間（Karvonen）+ 個人 PR */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="bg-card border-border">
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium">心率區間分佈（Karvonen 法）</CardTitle>
            <p className="text-xs text-muted-foreground">靜止心率 {restHR} bpm · 最高心率 {maxHR} bpm</p>
          </CardHeader>
          <CardContent>
            <HrZoneChart data={hrZones} totalMinutes={totalMinutes} />
            <div className="mt-3 space-y-1">
              {karvonenZones.map(z => (
                <div key={z.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: z.color }} />
                    <span className="text-muted-foreground">{z.name}</span>
                    <span className="text-muted-foreground/60">{z.minHR}–{z.maxHR} bpm</span>
                  </div>
                  <span className="text-muted-foreground/60 max-w-36 text-right truncate">{z.description}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">個人最佳紀錄 🏆</CardTitle>
          </CardHeader>
          <CardContent>
            <PersonalRecords pr={pr} />
          </CardContent>
        </Card>
      </div>

      {/* AI 教練 + 最近活動 */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">最近活動 · AI 教練分析</CardTitle>
        </CardHeader>
        <CardContent className="p-0 pb-4 px-4">
          <WorkoutAnalysisSection activities={recentRows} />
        </CardContent>
      </Card>
    </div>
  );
}
