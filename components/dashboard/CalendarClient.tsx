'use client'
import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const typeColor: Record<string, string> = {
  跑步: 'bg-blue-400',
  虛擬跑步: 'bg-blue-400',
  騎乘: 'bg-orange-400',
  虛擬騎乘: 'bg-orange-400',
  健走: 'bg-green-400',
  重訓: 'bg-purple-400',
  攀岩: 'bg-yellow-400',
  游泳: 'bg-cyan-400',
}

type Activity = { type: string; name: string; distance: string }

export default function CalendarClient({
  byDate,
}: {
  byDate: Record<string, Activity[]>
}) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [selected, setSelected] = useState<string | null>(null)

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
    setSelected(null)
  }
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
    setSelected(null)
  }

  const firstDay = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const startDow = (firstDay.getDay() + 6) % 7 // 週一=0

  const cells: (number | null)[] = [
    ...Array(startDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  const todayStr = today.toISOString().split('T')[0]
  const getDateStr = (day: number) =>
    `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`

  const selectedActs = selected ? (byDate[selected] ?? []) : []

  const weekDays = ['一', '二', '三', '四', '五', '六', '日']

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-foreground">訓練日曆</h1>
        <p className="text-sm text-muted-foreground mt-0.5">點擊日期查看當天活動</p>
      </div>

      {/* 月份導覽 */}
      <div className="flex items-center justify-between">
        <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-accent transition-colors">
          <ChevronLeft className="w-4 h-4 text-muted-foreground" />
        </button>
        <span className="text-sm font-semibold text-foreground">
          {year} 年 {month + 1} 月
        </span>
        <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-accent transition-colors">
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* 月曆表格 */}
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="grid grid-cols-7 bg-muted/30 border-b border-border">
          {weekDays.map(d => (
            <div key={d} className="text-center text-xs text-muted-foreground py-2 font-medium">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 divide-x divide-y divide-border">
          {cells.map((day, i) => {
            if (day === null) {
              return <div key={`empty-${i}`} className="min-h-14 md:min-h-20 bg-muted/10" />
            }
            const dateStr = getDateStr(day)
            const acts = byDate[dateStr] ?? []
            const isToday = dateStr === todayStr
            const isSelected = dateStr === selected

            return (
              <div
                key={dateStr}
                onClick={() => setSelected(isSelected ? null : dateStr)}
                className={`min-h-14 md:min-h-20 p-1.5 cursor-pointer transition-colors ${
                  isSelected ? 'bg-blue-500/10' : 'hover:bg-accent/50'
                }`}
              >
                <div className={`text-xs mb-1 w-6 h-6 flex items-center justify-center rounded-full font-medium ${
                  isToday ? 'bg-blue-500 text-white' : 'text-muted-foreground'
                }`}>
                  {day}
                </div>
                <div className="space-y-0.5">
                  {acts.slice(0, 3).map((a, j) => (
                    <div key={j} className={`h-1.5 rounded-full ${typeColor[a.type] ?? 'bg-gray-400'}`} />
                  ))}
                  {acts.length > 3 && (
                    <div className="text-xs text-muted-foreground/60">+{acts.length - 3}</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 選取日期詳情 */}
      {selected && (
        <div className="rounded-lg border border-border p-4 space-y-3">
          <h3 className="text-sm font-semibold text-foreground">{selected}</h3>
          {selectedActs.length === 0 ? (
            <p className="text-sm text-muted-foreground">當天無訓練紀錄</p>
          ) : (
            <div className="space-y-2">
              {selectedActs.map((a, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${typeColor[a.type] ?? 'bg-gray-400'}`} />
                  <div>
                    <p className="text-sm text-foreground">{a.name}</p>
                    <p className="text-xs text-muted-foreground">{a.type} · {a.distance}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 圖例 */}
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        {Object.entries(typeColor)
          .filter(([, color], i, arr) => arr.findIndex(([, c]) => c === color) === i)
          .map(([type, color]) => (
            <div key={type} className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${color}`} />
              {type}
            </div>
          ))}
      </div>
    </div>
  )
}
