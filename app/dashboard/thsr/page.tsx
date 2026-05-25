'use client'

import { useState, useCallback } from 'react'
import {
  THSR_STATIONS,
  THSRSearchParams,
  THSRTrain,
  HunterConfig,
} from '@/lib/thsr'
import THSRSearchForm from '@/components/thsr/THSRSearchForm'
import THSRTrainList from '@/components/thsr/THSRTrainList'
import THSRHunterPanel from '@/components/thsr/THSRHunterPanel'
import THSRHunterConfig from '@/components/thsr/THSRHunterConfig'
import {
  Train,
  Crosshair,
  Settings2,
  ExternalLink,
  ChevronRight,
  TicketCheck,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react'

type Tab = 'search' | 'hunter' | 'config'

function getDefaultTomorrow() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}/${m}/${day}`
}

const DEFAULT_SEARCH: THSRSearchParams = {
  fromStation: '1000', // 台北
  toStation: '1130',   // 左營
  date: getDefaultTomorrow(),
  timeSlot: '0',
  adultCount: 1,
  seatType: 'S',
}

const DEFAULT_CONFIG: HunterConfig = {
  searchParams: DEFAULT_SEARCH,
  targetTrainNos: [],
  intervalSeconds: 30,
  maxAttempts: 0,
  passengerId: '',
  passengerPhone: '',
}

export default function THSRPage() {
  const [activeTab, setActiveTab] = useState<Tab>('search')
  const [searchParams, setSearchParams] = useState<THSRSearchParams>(DEFAULT_SEARCH)
  const [hunterConfig, setHunterConfig] = useState<HunterConfig>(DEFAULT_CONFIG)

  const [searching, setSearching] = useState(false)
  const [trains, setTrains] = useState<THSRTrain[]>([])
  const [selectedTrains, setSelectedTrains] = useState<string[]>([])
  const [searchError, setSearchError] = useState<string | null>(null)
  const [lastSearch, setLastSearch] = useState<THSRSearchParams | null>(null)

  const fromStation = THSR_STATIONS.find(s => s.id === searchParams.fromStation)
  const toStation = THSR_STATIONS.find(s => s.id === searchParams.toStation)

  const handleSearch = useCallback(async (params: THSRSearchParams) => {
    setSearching(true)
    setSearchError(null)
    setTrains([])
    setSearchParams(params)
    setLastSearch(params)

    try {
      const resp = await fetch('/api/thsr/trains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      })

      const data = await resp.json()

      if (!data.success) {
        throw new Error(data.error || '查詢失敗')
      }

      setTrains(data.trains || [])

      if (data.errorMsg) {
        setSearchError(data.errorMsg)
      }
    } catch (err) {
      setSearchError(String(err))
    } finally {
      setSearching(false)
    }
  }, [])

  const handleToggleSelect = useCallback((trainNo: string) => {
    setSelectedTrains(prev =>
      prev.includes(trainNo) ? prev.filter(n => n !== trainNo) : [...prev, trainNo]
    )
  }, [])

  const handleUseForHunter = () => {
    setHunterConfig(prev => ({
      ...prev,
      searchParams,
      targetTrainNos: selectedTrains,
    }))
    setActiveTab('hunter')
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'search', label: '班次查詢', icon: <Train className="w-4 h-4" /> },
    { id: 'hunter', label: '自動搶票', icon: <Crosshair className="w-4 h-4" /> },
    { id: 'config', label: '搶票設定', icon: <Settings2 className="w-4 h-4" /> },
  ]

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <TicketCheck className="w-5 h-5 text-blue-400" />
            <h1 className="text-lg font-bold text-foreground">台灣高鐵搶票系統</h1>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            自動監控並快速訂購高鐵票
          </p>
        </div>
        <a
          href="https://irs.thsrc.com.tw/IMINT/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors"
        >
          官網訂票
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 p-1 rounded-xl bg-accent/30 border border-border">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-card text-foreground shadow-sm border border-border'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Search Tab */}
      {activeTab === 'search' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-4">
            <THSRSearchForm onSearch={handleSearch} loading={searching} />
          </div>

          {/* Search Error */}
          {searchError && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-sm text-red-400">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">查詢錯誤</p>
                <p className="text-xs mt-0.5 text-red-400/70">{searchError}</p>
                <p className="text-xs mt-1 text-muted-foreground">
                  高鐵官網可能限制自動查詢，請直接前往
                  <a
                    href="https://irs.thsrc.com.tw/IMINT/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 underline ml-1"
                  >
                    官網訂票
                  </a>
                </p>
              </div>
            </div>
          )}

          {/* Train List */}
          {(trains.length > 0 || searching) && (
            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-sm font-semibold text-foreground">
                    班次結果
                  </h2>
                  {lastSearch && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {THSR_STATIONS.find(s => s.id === lastSearch.fromStation)?.name} →{' '}
                      {THSR_STATIONS.find(s => s.id === lastSearch.toStation)?.name}
                      {' · '}{lastSearch.date}
                    </p>
                  )}
                </div>
                {trains.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {trains.length} 個班次
                  </span>
                )}
              </div>

              {searching ? (
                <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span className="text-sm">查詢班次中...</span>
                </div>
              ) : (
                <THSRTrainList
                  trains={trains}
                  selectedTrains={selectedTrains}
                  onToggleSelect={handleToggleSelect}
                />
              )}
            </div>
          )}

          {/* Use for Hunter CTA */}
          {selectedTrains.length > 0 && (
            <div className="rounded-2xl border border-blue-500/50 bg-blue-500/5 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    已選 {selectedTrains.length} 個目標車次
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {selectedTrains.join(', ')}
                  </p>
                </div>
                <button
                  onClick={handleUseForHunter}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
                >
                  開始搶票
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Empty State - No trains yet */}
          {!searching && trains.length === 0 && !searchError && (
            <div className="rounded-2xl border border-border bg-card p-8 text-center">
              <Train className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">選擇站點和日期後查詢班次</p>
              <p className="text-xs text-muted-foreground/60 mt-1">點選班次可加入自動搶票目標</p>
            </div>
          )}
        </div>
      )}

      {/* Hunter Tab */}
      {activeTab === 'hunter' && (
        <div className="rounded-2xl border border-border bg-card p-4">
          {/* Route Summary */}
          <div className="flex items-center gap-2 mb-4 p-3 rounded-xl bg-accent/20 border border-border text-sm">
            <span className="font-medium text-foreground">
              {THSR_STATIONS.find(s => s.id === hunterConfig.searchParams.fromStation)?.name || '?'}
            </span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium text-foreground">
              {THSR_STATIONS.find(s => s.id === hunterConfig.searchParams.toStation)?.name || '?'}
            </span>
            <span className="text-muted-foreground text-xs ml-auto">
              {hunterConfig.searchParams.date}
            </span>
          </div>

          <THSRHunterPanel config={hunterConfig} />
        </div>
      )}

      {/* Config Tab */}
      {activeTab === 'config' && (
        <div className="rounded-2xl border border-border bg-card p-4">
          <THSRHunterConfig
            searchParams={searchParams}
            currentConfig={hunterConfig}
            onConfigChange={config => {
              setHunterConfig(config)
              setActiveTab('hunter')
            }}
          />
        </div>
      )}

      {/* Info Cards */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: '出發站', value: fromStation?.name || '-', sub: fromStation?.nameEn },
          { label: '抵達站', value: toStation?.name || '-', sub: toStation?.nameEn },
          { label: '票數', value: `${searchParams.adultCount} 張`, sub: searchParams.seatType === 'S' ? '標準廂' : '商務廂' },
        ].map(({ label, value, sub }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-3 text-center">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-base font-bold text-foreground mt-0.5">{value}</p>
            {sub && <p className="text-xs text-muted-foreground/60">{sub}</p>}
          </div>
        ))}
      </div>

      {/* Footer Notice */}
      <p className="text-xs text-center text-muted-foreground/50 pb-2">
        本系統僅供合法個人購票使用 · 請遵守高鐵及相關法規
      </p>
    </div>
  )
}
