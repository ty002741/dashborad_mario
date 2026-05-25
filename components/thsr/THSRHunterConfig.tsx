'use client'

import { useState } from 'react'
import { HunterConfig, THSRSearchParams } from '@/lib/thsr'
import { Settings2, User, Phone, Crosshair, Timer } from 'lucide-react'

interface Props {
  searchParams: THSRSearchParams
  onConfigChange: (config: HunterConfig) => void
  currentConfig: HunterConfig
}

export default function THSRHunterConfig({ searchParams, onConfigChange, currentConfig }: Props) {
  const [targetTrains, setTargetTrains] = useState(currentConfig.targetTrainNos.join(', '))
  const [interval, setInterval] = useState(currentConfig.intervalSeconds)
  const [maxAttempts, setMaxAttempts] = useState(currentConfig.maxAttempts)
  const [passengerId, setPassengerId] = useState(currentConfig.passengerId)
  const [passengerPhone, setPassengerPhone] = useState(currentConfig.passengerPhone)

  const handleApply = () => {
    const trainNos = targetTrains
      .split(/[,\s]+/)
      .map(s => s.trim())
      .filter(Boolean)

    onConfigChange({
      searchParams,
      targetTrainNos: trainNos,
      intervalSeconds: Math.max(10, interval),
      maxAttempts: Math.max(0, maxAttempts),
      passengerId,
      passengerPhone,
    })
  }

  const inputCls = 'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500'
  const labelCls = 'block text-xs text-muted-foreground mb-1'

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 pb-2 border-b border-border">
        <Settings2 className="w-4 h-4 text-blue-400" />
        <span className="text-sm font-semibold text-foreground">搶票設定</span>
      </div>

      {/* Target Trains */}
      <div>
        <label className={labelCls}>
          <Crosshair className="w-3 h-3 inline mr-1" />
          目標車次（留空=任意，多筆用逗號分隔）
        </label>
        <input
          type="text"
          className={inputCls}
          placeholder="例：0636, 0638, 0640"
          value={targetTrains}
          onChange={e => setTargetTrains(e.target.value)}
        />
      </div>

      {/* Interval & Max Attempts */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>
            <Timer className="w-3 h-3 inline mr-1" />
            查詢間隔（秒）
          </label>
          <input
            type="number"
            className={inputCls}
            min={10}
            max={300}
            value={interval}
            onChange={e => setInterval(Number(e.target.value))}
          />
        </div>
        <div>
          <label className={labelCls}>最大次數（0=無限）</label>
          <input
            type="number"
            className={inputCls}
            min={0}
            max={9999}
            value={maxAttempts}
            onChange={e => setMaxAttempts(Number(e.target.value))}
          />
        </div>
      </div>

      {/* Passenger Info */}
      <div className="pt-2 border-t border-border">
        <p className="text-xs text-muted-foreground mb-3">旅客資料（訂票時使用）</p>
        <div className="space-y-3">
          <div>
            <label className={labelCls}>
              <User className="w-3 h-3 inline mr-1" />
              身份證字號 / 護照號碼
            </label>
            <input
              type="text"
              className={inputCls}
              placeholder="A123456789"
              value={passengerId}
              onChange={e => setPassengerId(e.target.value)}
            />
          </div>
          <div>
            <label className={labelCls}>
              <Phone className="w-3 h-3 inline mr-1" />
              手機號碼
            </label>
            <input
              type="tel"
              className={inputCls}
              placeholder="0912345678"
              value={passengerPhone}
              onChange={e => setPassengerPhone(e.target.value)}
            />
          </div>
        </div>
      </div>

      <button
        onClick={handleApply}
        className="w-full py-2 px-4 rounded-lg border border-blue-500 text-blue-400 hover:bg-blue-500/10 text-sm font-medium transition-colors"
      >
        套用設定
      </button>

      {/* Legal Notice */}
      <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
        <p className="text-xs text-yellow-400/80 leading-relaxed">
          ⚠️ <strong>使用須知：</strong>本工具僅供個人合法購票使用，嚴禁商業炒票。
          依台灣法規，利用電腦程式搶購轉賣票券可能違反相關規定。
          使用本系統前請確認已了解相關法律責任。
        </p>
      </div>
    </div>
  )
}
