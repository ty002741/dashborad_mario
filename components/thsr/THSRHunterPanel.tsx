'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { HunterConfig, HunterStatus, THSRSearchParams, THSRTrain } from '@/lib/thsr'
import { Play, Square, RefreshCw, AlertCircle, CheckCircle2, Clock, List } from 'lucide-react'

interface Props {
  config: HunterConfig
  onStatusChange?: (status: HunterStatus) => void
}

const MAX_LOG_LINES = 100

export default function THSRHunterPanel({ config, onStatusChange }: Props) {
  const [status, setStatus] = useState<HunterStatus>({
    running: false,
    attempts: 0,
    lastChecked: null,
    lastResult: null,
    foundTickets: [],
    log: [],
  })
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const runningRef = useRef(false)
  const attemptsRef = useRef(0)

  const addLog = useCallback((msg: string) => {
    const ts = new Date().toLocaleTimeString('zh-TW')
    const line = `[${ts}] ${msg}`
    setStatus(prev => {
      const newLog = [...prev.log, line].slice(-MAX_LOG_LINES)
      return { ...prev, log: newLog }
    })
  }, [])

  const doSearch = useCallback(async () => {
    if (!runningRef.current) return

    attemptsRef.current += 1
    const attempt = attemptsRef.current

    setStatus(prev => ({
      ...prev,
      attempts: attempt,
      lastChecked: new Date().toLocaleTimeString('zh-TW'),
      lastResult: '查詢中...',
    }))

    addLog(`第 ${attempt} 次查詢...`)

    try {
      const resp = await fetch('/api/thsr/trains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config.searchParams),
      })

      if (!resp.ok) throw new Error(`HTTP ${resp.status}`)

      const data = await resp.json()

      if (!data.success) {
        throw new Error(data.error || '查詢失敗')
      }

      const trains: THSRTrain[] = data.trains || []
      addLog(`找到 ${trains.length} 個班次`)

      // Filter by target train numbers if specified
      let available: THSRTrain[]
      if (config.targetTrainNos.length > 0) {
        available = trains.filter(t =>
          config.targetTrainNos.includes(t.no) && t.standardAvailable
        )
      } else {
        available = trains.filter(t => t.standardAvailable)
      }

      if (available.length > 0) {
        addLog(`✅ 找到可訂位班次: ${available.map(t => `${t.no}(${t.departTime})`).join(', ')}`)
        setStatus(prev => ({
          ...prev,
          lastResult: `找到 ${available.length} 個可用班次！`,
          foundTickets: available,
        }))
        onStatusChange?.({ ...status, foundTickets: available })
      } else {
        const msg = trains.length > 0 ? '目前無法訂位，繼續監控...' : '沒有找到班次，繼續監控...'
        addLog(msg)
        setStatus(prev => ({ ...prev, lastResult: msg }))
      }

      // Check max attempts
      if (config.maxAttempts > 0 && attempt >= config.maxAttempts) {
        addLog('已達最大查詢次數，停止搶票')
        stopHunter()
      }
    } catch (err) {
      const msg = `查詢錯誤: ${err}`
      addLog(msg)
      setStatus(prev => ({ ...prev, lastResult: msg }))
    }
  }, [config, addLog, onStatusChange])

  const startHunter = useCallback(() => {
    if (runningRef.current) return
    runningRef.current = true
    attemptsRef.current = 0

    setStatus(prev => ({
      ...prev,
      running: true,
      attempts: 0,
      foundTickets: [],
      log: [],
    }))

    addLog('🚀 開始搶票...')

    // Run immediately then on interval
    doSearch()
    intervalRef.current = setInterval(doSearch, config.intervalSeconds * 1000)
  }, [doSearch, config.intervalSeconds, addLog])

  const stopHunter = useCallback(() => {
    runningRef.current = false
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setStatus(prev => ({ ...prev, running: false }))
    addLog('⏹ 已停止搶票')
  }, [addLog])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  const logEndRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [status.log])

  return (
    <div className="space-y-4">
      {/* Status Bar */}
      <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
        <div className={`w-2.5 h-2.5 rounded-full ${
          status.running ? 'bg-green-400 animate-pulse' :
          status.foundTickets.length > 0 ? 'bg-blue-400' : 'bg-muted-foreground'
        }`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">
            {status.running ? '搶票進行中' : status.foundTickets.length > 0 ? '找到票了！' : '等待啟動'}
          </p>
          {status.lastResult && (
            <p className="text-xs text-muted-foreground truncate">{status.lastResult}</p>
          )}
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs text-muted-foreground">查詢次數</p>
          <p className="text-sm font-bold text-foreground">{status.attempts}</p>
        </div>
      </div>

      {/* Found Tickets Alert */}
      {status.foundTickets.length > 0 && (
        <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/30">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-green-400" />
            <span className="text-sm font-semibold text-green-400">找到可用票！</span>
          </div>
          <div className="space-y-1">
            {status.foundTickets.map(t => (
              <div key={t.no} className="flex items-center gap-3 text-sm">
                <span className="font-bold text-foreground">{t.no}</span>
                <span className="text-muted-foreground">{t.departTime} → {t.arriveTime}</span>
                {t.duration && <span className="text-xs text-muted-foreground">{t.duration}</span>}
              </div>
            ))}
          </div>
          <p className="text-xs text-green-300/70 mt-2">
            ⚠️ 請前往高鐵官網完成訂票（需填寫身份證及驗證碼）
          </p>
        </div>
      )}

      {/* Control Buttons */}
      <div className="flex gap-2">
        <button
          onClick={startHunter}
          disabled={status.running}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-green-600 hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
        >
          <Play className="w-4 h-4" />
          開始搶票
        </button>
        <button
          onClick={stopHunter}
          disabled={!status.running}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
        >
          <Square className="w-4 h-4" />
          停止
        </button>
      </div>

      {/* Config Summary */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="p-2 rounded-lg bg-accent/30 border border-border">
          <div className="flex items-center gap-1.5 text-muted-foreground mb-0.5">
            <Clock className="w-3 h-3" />
            <span>查詢間隔</span>
          </div>
          <span className="font-medium text-foreground">{config.intervalSeconds} 秒</span>
        </div>
        <div className="p-2 rounded-lg bg-accent/30 border border-border">
          <div className="flex items-center gap-1.5 text-muted-foreground mb-0.5">
            <RefreshCw className="w-3 h-3" />
            <span>最大次數</span>
          </div>
          <span className="font-medium text-foreground">
            {config.maxAttempts > 0 ? `${config.maxAttempts} 次` : '無限制'}
          </span>
        </div>
        <div className="p-2 rounded-lg bg-accent/30 border border-border col-span-2">
          <div className="flex items-center gap-1.5 text-muted-foreground mb-0.5">
            <List className="w-3 h-3" />
            <span>目標車次</span>
          </div>
          <span className="font-medium text-foreground">
            {config.targetTrainNos.length > 0
              ? config.targetTrainNos.join(', ')
              : '任意班次'}
          </span>
        </div>
      </div>

      {/* Log */}
      {status.log.length > 0 && (
        <div className="rounded-xl border border-border bg-black/30 overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-1.5 border-b border-border bg-accent/20">
            <AlertCircle className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground font-medium">執行日誌</span>
          </div>
          <div className="p-3 h-36 overflow-y-auto font-mono text-xs space-y-0.5">
            {status.log.map((line, i) => (
              <div key={i} className="text-green-300/80">{line}</div>
            ))}
            <div ref={logEndRef} />
          </div>
        </div>
      )}
    </div>
  )
}
