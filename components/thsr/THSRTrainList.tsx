'use client'

import { THSRTrain } from '@/lib/thsr'
import { Clock, CheckCircle, XCircle, Tag, Train } from 'lucide-react'

interface Props {
  trains: THSRTrain[]
  selectedTrains: string[]
  onToggleSelect: (trainNo: string) => void
  onBook?: (train: THSRTrain) => void
  loading?: boolean
}

export default function THSRTrainList({ trains, selectedTrains, onToggleSelect, onBook, loading }: Props) {
  if (trains.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        <Train className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p className="text-sm">尚無班次資訊，請先查詢</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {trains.map(train => {
        const isSelected = selectedTrains.includes(train.no)
        return (
          <div
            key={train.no}
            className={`rounded-xl border p-3 transition-all cursor-pointer ${
              isSelected
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-border bg-card hover:border-blue-400/50 hover:bg-accent/30'
            }`}
            onClick={() => onToggleSelect(train.no)}
          >
            <div className="flex items-center justify-between gap-3">
              {/* Train Number */}
              <div className="flex items-center gap-2 min-w-[60px]">
                <Train className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span className="font-bold text-sm text-foreground">{train.no}</span>
              </div>

              {/* Times */}
              <div className="flex items-center gap-2 flex-1">
                <span className="font-mono text-sm font-semibold text-foreground">
                  {train.departTime}
                </span>
                <div className="flex-1 flex items-center gap-1">
                  <div className="h-px flex-1 bg-border" />
                  <Clock className="w-3 h-3 text-muted-foreground" />
                  <div className="h-px flex-1 bg-border" />
                </div>
                <span className="font-mono text-sm font-semibold text-foreground">
                  {train.arriveTime}
                </span>
              </div>

              {/* Duration */}
              {train.duration && (
                <span className="text-xs text-muted-foreground shrink-0">{train.duration}</span>
              )}

              {/* Availability & Discount */}
              <div className="flex items-center gap-1.5 shrink-0">
                {train.discount && (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs bg-orange-500/20 text-orange-400 border border-orange-500/30">
                    <Tag className="w-2.5 h-2.5" />
                    {train.discount}
                  </span>
                )}
                {train.standardAvailable ? (
                  <CheckCircle className="w-4 h-4 text-green-400" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-400" />
                )}
              </div>

              {/* Book button */}
              {onBook && train.standardAvailable && (
                <button
                  onClick={e => {
                    e.stopPropagation()
                    onBook(train)
                  }}
                  disabled={loading}
                  className="shrink-0 px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors disabled:opacity-50"
                >
                  訂票
                </button>
              )}
            </div>

            {/* Selected indicator */}
            {isSelected && (
              <div className="mt-2 text-xs text-blue-400 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                已加入搶票目標
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
