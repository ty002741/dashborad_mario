'use client'

import { useState } from 'react'
import { THSR_STATIONS, THSR_TIME_SLOTS, SEAT_TYPES, THSRSearchParams } from '@/lib/thsr'
import { Search, RefreshCw } from 'lucide-react'

interface Props {
  onSearch: (params: THSRSearchParams) => void
  loading?: boolean
}

function getTodayStr() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}/${m}/${day}`
}

function getTomorrowStr() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}/${m}/${day}`
}

function dateInputToThsr(input: string): string {
  // convert YYYY-MM-DD to YYYY/MM/DD
  return input.replace(/-/g, '/')
}

function thsrDateToInput(thsr: string): string {
  // convert YYYY/MM/DD to YYYY-MM-DD
  return thsr.replace(/\//g, '-')
}

export default function THSRSearchForm({ onSearch, loading }: Props) {
  const [fromStation, setFromStation] = useState('1000') // 台北
  const [toStation, setToStation] = useState('1130')    // 左營
  const [dateInput, setDateInput] = useState(thsrDateToInput(getTomorrowStr()))
  const [timeSlot, setTimeSlot] = useState('0')
  const [adultCount, setAdultCount] = useState(1)
  const [seatType, setSeatType] = useState('S')

  const handleSwap = () => {
    setFromStation(toStation)
    setToStation(fromStation)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch({
      fromStation,
      toStation,
      date: dateInputToThsr(dateInput),
      timeSlot,
      adultCount,
      seatType,
    })
  }

  const inputCls = 'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500'
  const labelCls = 'block text-xs text-muted-foreground mb-1'

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Station Row */}
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <label className={labelCls}>出發站</label>
          <select className={inputCls} value={fromStation} onChange={e => setFromStation(e.target.value)}>
            {THSR_STATIONS.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={handleSwap}
          className="mb-0.5 p-2 rounded-lg border border-border hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
          title="互換站點"
        >
          <RefreshCw className="w-4 h-4" />
        </button>

        <div className="flex-1">
          <label className={labelCls}>到達站</label>
          <select className={inputCls} value={toStation} onChange={e => setToStation(e.target.value)}>
            {THSR_STATIONS.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Date & Time Row */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>出發日期</label>
          <input
            type="date"
            className={inputCls}
            value={dateInput}
            onChange={e => setDateInput(e.target.value)}
            min={thsrDateToInput(getTodayStr())}
            required
          />
        </div>
        <div>
          <label className={labelCls}>出發時段</label>
          <select className={inputCls} value={timeSlot} onChange={e => setTimeSlot(e.target.value)}>
            {THSR_TIME_SLOTS.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Ticket Count & Seat Type Row */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>成人票數</label>
          <select className={inputCls} value={adultCount} onChange={e => setAdultCount(Number(e.target.value))}>
            {[1, 2, 3, 4, 5, 6].map(n => (
              <option key={n} value={n}>{n} 張</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>座位類型</label>
          <select className={inputCls} value={seatType} onChange={e => setSeatType(e.target.value)}>
            {SEAT_TYPES.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2.5 px-4 rounded-lg transition-colors"
      >
        {loading ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin" />
            查詢中...
          </>
        ) : (
          <>
            <Search className="w-4 h-4" />
            查詢班次
          </>
        )}
      </button>
    </form>
  )
}
