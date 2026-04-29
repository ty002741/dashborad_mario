import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import StatsCard from "@/components/dashboard/StatsCard";
import WorkoutAnalysisSection from "@/components/dashboard/WorkoutAnalysisSection";
import WeeklyMileageChart from "@/components/charts/WeeklyMileageChart";
import HeartRatePaceChart from "@/components/charts/HeartRatePaceChart";
import HrZoneChart from "@/components/charts/HrZoneChart";
import ActivityHeatmap from "@/components/dashboard/ActivityHeatmap";
import PersonalRecords from "@/components/dashboard/PersonalRecords";
import { fetchActivities } from "@/lib/intervals";
import {
  getWeeklyChartData, getHrPaceData, getRecentRows,
  computeStats, computeHrZones, getHeatmapData, computePRs,
} from "@/lib/transforms";

export default async function DashboardPage() {
  const now = new Date();
  const newest = now.toISOString().split("T")[0];
  // 熱力圖需要一年，其餘統計用 90 天即可，一次抓一年搞定
  const oldest = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const activities = await fetchActivities(oldest, newest);

  const stats = computeStats(activities);
  const weeklyData = getWeeklyChartData(activities);
  const hrPaceData = getHrPaceData(activities);
  const recentRows = getRecentRows(activities);
  const hrZones = computeHrZones(activities);
  const heatmapData = getHeatmapData(activities);
  const pr = computePRs(activities);

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
          過去一年 · {activities.length} 筆活動
        </p>
      </div>

      {/* 統計卡片 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <StatsCard key={s.label} {...s} />
        ))}
      </div>

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

      {/* 心率區間 + 個人 PR */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">心率區間分佈</CardTitle>
          </CardHeader>
          <CardContent>
            <HrZoneChart data={hrZones} totalMinutes={totalMinutes} />
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

      {/* AI 教練分析 + 最近活動（可點擊） */}
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
