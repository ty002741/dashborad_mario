'use client'
import { useState, useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from '@/components/ui/table'

const typeColor: Record<string, string> = {
  跑步: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  虛擬跑步: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  騎乘: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  虛擬騎乘: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  健走: 'bg-green-500/20 text-green-400 border-green-500/30',
  重訓: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  攀岩: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  游泳: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
}

type Row = {
  id: string
  date: string
  type: string
  name: string
  distance: string
  duration: string
  pace: string
  hr: string
  elevation: string
}

export default function ActivitiesClient({ rows }: { rows: Row[] }) {
  const [filter, setFilter] = useState('全部')

  const types = useMemo(() => {
    const set = new Set(rows.map(r => r.type))
    return ['全部', ...Array.from(set)]
  }, [rows])

  const filtered = filter === '全部' ? rows : rows.filter(r => r.type === filter)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-foreground">活動紀錄</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          過去一年 · {rows.length} 筆活動
          {filter !== '全部' && ` · 顯示 ${filtered.length} 筆`}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {types.map(type => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
              filter === type
                ? 'bg-blue-500 text-white border-blue-500'
                : 'border-border text-muted-foreground hover:bg-accent'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent bg-muted/30">
                <TableHead className="text-muted-foreground text-xs">日期</TableHead>
                <TableHead className="text-muted-foreground text-xs">活動</TableHead>
                <TableHead className="text-muted-foreground text-xs">距離</TableHead>
                <TableHead className="text-muted-foreground text-xs hidden sm:table-cell">時間</TableHead>
                <TableHead className="text-muted-foreground text-xs">配速 / 速度</TableHead>
                <TableHead className="text-muted-foreground text-xs hidden md:table-cell">心率</TableHead>
                <TableHead className="text-muted-foreground text-xs hidden md:table-cell">爬升</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(act => (
                <TableRow key={act.id} className="border-border hover:bg-accent/50">
                  <TableCell className="text-muted-foreground text-sm">{act.date}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={`text-xs px-2 py-0.5 shrink-0 ${typeColor[act.type] ?? 'bg-muted text-muted-foreground'}`}
                      >
                        {act.type}
                      </Badge>
                      <span className="text-sm text-foreground truncate max-w-28 md:max-w-48">{act.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-sm">{act.distance}</TableCell>
                  <TableCell className="text-sm text-muted-foreground hidden sm:table-cell">{act.duration}</TableCell>
                  <TableCell className="text-blue-400 text-sm">{act.pace}</TableCell>
                  <TableCell className="text-sm text-muted-foreground hidden md:table-cell">{act.hr}</TableCell>
                  <TableCell className="text-sm text-muted-foreground hidden md:table-cell">{act.elevation}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm">
            沒有符合的活動
          </div>
        )}
      </div>
    </div>
  )
}
