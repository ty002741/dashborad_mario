import { Card, CardContent } from "@/components/ui/card";
import { StatCard } from "@/types/activity";
import { TrendingUp, TrendingDown } from "lucide-react";

export default function StatsCard({ label, value, change, positive }: StatCard) {
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        <p className="text-2xl font-bold text-foreground tracking-tight">
          {value}
        </p>
        <div className="flex items-center gap-1 mt-1">
          {positive ? (
            <TrendingUp className="w-3 h-3 text-green-400" />
          ) : (
            <TrendingDown className="w-3 h-3 text-red-400" />
          )}
          <span
            className={`text-xs font-medium ${
              positive ? "text-green-400" : "text-red-400"
            }`}
          >
            {change}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
