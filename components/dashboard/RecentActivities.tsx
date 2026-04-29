import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ActivityRow } from "@/lib/transforms";

const typeColor: Record<string, string> = {
  跑步: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  虛擬跑步: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  騎乘: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  虛擬騎乘: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  健走: "bg-green-500/20 text-green-400 border-green-500/30",
  重訓: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  攀岩: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  游泳: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
};

export default function RecentActivities({ activities }: { activities: ActivityRow[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="border-border hover:bg-transparent">
          <TableHead className="text-muted-foreground">日期</TableHead>
          <TableHead className="text-muted-foreground">活動</TableHead>
          <TableHead className="text-muted-foreground">距離</TableHead>
          <TableHead className="text-muted-foreground">配速 / 速度</TableHead>
          <TableHead className="text-muted-foreground text-right">平均心率</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {activities.map((act) => (
          <TableRow key={act.id} className="border-border hover:bg-accent/50">
            <TableCell className="text-muted-foreground text-sm">{act.date}</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={`text-xs px-2 py-0.5 ${typeColor[act.type] ?? "bg-muted text-muted-foreground"}`}
                >
                  {act.type}
                </Badge>
                <span className="text-sm text-foreground truncate max-w-32">{act.name}</span>
              </div>
            </TableCell>
            <TableCell className="font-medium text-sm">{act.distance}</TableCell>
            <TableCell className="text-blue-400 text-sm">{act.pace}</TableCell>
            <TableCell className="text-right text-sm text-muted-foreground">
              {act.hr ? `${act.hr} bpm` : "--"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
