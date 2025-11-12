import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { AnimatePresence, motion } from 'framer-motion'
import { LayoutGrid, List, SlidersHorizontal } from 'lucide-react'

import { API_BASE_URL } from './config.js'
import PredictionTable from './components/PredictionTable.jsx'
import TournamentRolldowns from './components/TournamentRolldowns.jsx'
import SocialsSection from './components/SocialsSection.jsx'
import ValueBetsSection from './components/ValueBetsSection.jsx'
import HighOddsSection from './components/HighOddsSection.jsx'
import GeminiSearchSection from './components/GeminiSearchSection.jsx'
import NeonStreamSection from './components/NeonStreamSection.jsx'
import FilterPanel from './components/FilterPanel.jsx'

const basePageSizeOptions = [50, 100, 250, 500]
const getLocalISODate = () => {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
const todayISO = getLocalISODate()

const createDefaultFilters = () => ({
  search: '',
  surface: '',
  tournament: '',
  learningPhase: '',
  recommendedAction: '',
  predictionCorrect: '',
  valueBet: '',
  minConfidence: '',
  maxConfidence: '',
  dateFrom: todayISO,
  dateTo: todayISO,
  sortBy: 'prediction_day',
  sortDir: 'DESC'
})

const buildQueryParams = (filters, page, pageSize) => {
  const params = new URLSearchParams()
  params.set('page', String(page))
  params.set('pageSize', String(pageSize))

  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return
    if (typeof value === 'boolean') {
      params.set(key, value ? 'true' : 'false')
      return
    }
    params.set(key, value)
  })

  return params.toString()
}

const fetchPredictions = async ({ queryKey }) => {
  const [, filters, page, pageSize] = queryKey
  const params = buildQueryParams(filters, page, pageSize)
  const fullURL = `${API_BASE_URL}/api/predictions?${params}`
  console.log('🔗 Making API call to:', fullURL)
  console.log('📅 Filters being sent:', JSON.stringify(filters, null, 2))
  try {
    const { data } = await axios.get(fullURL)
    console.log('✅ API call successful:', data.meta.total, 'predictions loaded')
    return data
  } catch (error) {
    console.error('❌ API call failed:', error.message, 'URL:', fullURL)
    throw error
  }
}

export default function App() {
  const [page, setPage] = useState(1)
  const [viewMode, setViewMode] = useState('table')
  const [pageSize, setPageSize] = useState(200)
  const defaultFiltersRef = useRef(createDefaultFilters())
  const [filters, setFilters] = useState(defaultFiltersRef.current)
  const [panelView, setPanelView] = useState('stream')
  const [scope, setScope] = useState('today')

  const query = useQuery({
    queryKey: ['predictions', filters, page, pageSize],
    queryFn: fetchPredictions,
    keepPreviousData: true,
    staleTime: 1000 * 45,
    gcTime: 1000 * 120,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: 1000 * 60 * 60 * 2,
    retry: false
  })

  const meta = query.data?.meta ?? { total: 0, total_pages: 0 }
  const totalRecords = meta.total ?? meta.totalRecords ?? 0

  useEffect(() => {
    const total = meta.total ?? meta.totalRecords ?? 0
    if (total > 0 && pageSize !== total) {
      setPageSize(total)
      setPage(1)
    }
  }, [meta.total, meta.totalRecords, pageSize])

  const pageSizeOptions = useMemo(() => {
    const total = meta.total ?? meta.totalRecords
    const options = [...basePageSizeOptions]
    if (total && !options.includes(total)) {
      options.push(total)
    }
    return options
  }, [meta.total, meta.totalRecords])

  const activeFilterCount = useMemo(() => {
    const defaults = defaultFiltersRef.current
    return Object.entries(filters).reduce((count, [key, value]) => {
      const baseline = defaults[key]
      if (typeof value === 'string') {
        return value !== baseline ? count + 1 : count
      }
      return value !== baseline ? count + 1 : count
    }, 0)
  }, [filters])

  const highlightMetrics = useMemo(() => {
    const rows = query.data?.data ?? []
    if (!rows.length) {
      return {
        accuracy: '--',
        averageConfidence: '--',
        valueBetShare: '--'
      }
    }

    const tracked = rows.reduce(
      (acc, row) => {
        if (row.prediction_correct === true) acc.correct += 1
        if (row.prediction_correct !== null && row.prediction_correct !== undefined) acc.totalScored += 1
        acc.confidenceSum += row.confidence_score
        if (row.value_bet) acc.valueBets += 1
        return acc
      },
      { correct: 0, totalScored: 0, confidenceSum: 0, valueBets: 0 }
    )

    const accuracy = tracked.totalScored ? `${Math.round((tracked.correct / tracked.totalScored) * 100)}%` : '—'
    const averageConfidence = `${Math.round(tracked.confidenceSum / rows.length)}%`
    const valueBetShare = `${Math.round((tracked.valueBets / rows.length) * 100)}%`

    return { accuracy, averageConfidence, valueBetShare }
  }, [query.data])

  const handleFilterChange = (next) => {
    setPage(1)
    setFilters((current) => {
      const merged = { ...current, ...next }
      if ('dateFrom' in next || 'dateTo' in next) {
        const matchesToday = merged.dateFrom === todayISO && merged.dateTo === todayISO
        setScope(matchesToday ? 'today' : 'open')
      }
      return merged
    })
  }

  const handleResetFilters = () => {
    const defaults = createDefaultFilters()
    defaultFiltersRef.current = defaults
    setScope('today')
    setPage(1)
    setFilters(defaults)
  }

  const handleScopeChange = (nextScope) => {
    if (nextScope === scope) return
    setScope(nextScope)
    setPage(1)
    if (nextScope === 'today') {
      setFilters((current) => ({ ...current, dateFrom: todayISO, dateTo: todayISO }))
    } else {
      setFilters((current) => ({ ...current, dateFrom: '', dateTo: '' }))
    }
  }

  const totalPages = meta.total_pages ?? meta.totalPages ?? 0

  return (
    <div className="min-h-screen bg-[#0f0b18] text-slate-100">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-12 space-y-12">
        <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="space-y-4">
            <span className="text-[11px] uppercase tracking-[0.6em] text-amber-300">Match Tape</span>
            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-50">Prediction Console</h1>
              <p className="max-w-xl text-sm text-slate-300/80">
                Track today&apos;s slate at a glance, flip open historical reels when needed, and keep value stories close without the chrome.
              </p>
            </div>
          </div>

          <ScopeToggle active={scope} onChange={handleScopeChange} />
        </header>

        <main className="space-y-12">
          <section className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="grid w-full max-w-3xl gap-4 sm:grid-cols-3">
              <MetricCard label="Accuracy" value={highlightMetrics.accuracy} accent="bg-emerald-400/90" />
              <MetricCard label="Avg Confidence" value={highlightMetrics.averageConfidence} accent="bg-sky-400/90" />
              <MetricCard label="Value Rate" value={highlightMetrics.valueBetShare} accent="bg-amber-300/90" />
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3">
              <motion.button
                type="button"
                onClick={() => query.refetch()}
                className="flex items-center gap-2 rounded-xl border border-slate-700/70 bg-slate-900/70 px-3 py-2 text-sm text-slate-200 hover:text-amber-200 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Refresh
              </motion.button>
              <ModeToggle
                icon={<LayoutGrid className="h-4 w-4" />}
                label="Tournaments"
                active={viewMode === 'rolldowns'}
                onClick={() => {
                  setViewMode('rolldowns')
                  setPageSize(1000)
                  setPage(1)
                }}
              />
              <ModeToggle
                icon={<List className="h-4 w-4" />}
                label="Table"
                active={viewMode === 'table'}
                onClick={() => {
                  setViewMode('table')
                  const total = meta.total ?? meta.totalRecords ?? 500
                  setPageSize(total)
                  setPage(1)
                }}
              />
              <motion.button
                type="button"
                className={`flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-medium transition-colors ${
                  panelView === 'filters'
                    ? 'border-amber-500/60 bg-amber-500/15 text-amber-200'
                    : 'border-slate-700/70 bg-slate-900/70 text-slate-200 hover:text-amber-200'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setPanelView(panelView === 'filters' ? 'stream' : 'filters')}
              >
                <SlidersHorizontal className="h-4 w-4" />
                {panelView === 'filters' ? 'Show stream' : 'Adjust filters'}
                {activeFilterCount > 0 && (
                  <span className="text-xs font-semibold text-amber-200/90">{activeFilterCount}</span>
                )}
              </motion.button>
            </div>
          </section>

          <section>
            <motion.div
              className="rounded-3xl border border-slate-800/70 bg-[#120d1f] shadow-[0_0_60px_rgba(10,12,28,0.45)] overflow-hidden"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800/60 px-6 py-4">
                <div className="inline-flex items-center gap-1 rounded-full border border-slate-800/60 bg-slate-900/70 p-1">
                  <PanelSwitch label="Live Stream" active={panelView === 'stream'} onClick={() => setPanelView('stream')} />
                  <PanelSwitch label="Filters" active={panelView === 'filters'} onClick={() => setPanelView('filters')} />
                </div>
                <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-400">
                  <span>{activeFilterCount} filters active</span>
                  <button
                    type="button"
                    onClick={() => {
                      handleResetFilters()
                      setPanelView('stream')
                    }}
                    className="rounded-full border border-slate-700/70 px-3 py-1.5 text-slate-300 hover:border-amber-400/60 hover:text-amber-200 transition-colors"
                  >
                    Reset
                  </button>
                </div>
              </div>

              <div className="px-6 py-6">
                <AnimatePresence mode="wait">
                  {panelView === 'filters' ? (
                    <motion.div
                      key="filters-panel"
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -16 }}
                      transition={{ duration: 0.25, ease: 'easeOut' }}
                    >
                      <FilterPanel
                        filters={filters}
                        onChange={handleFilterChange}
                        loading={query.isFetching}
                        onReset={handleResetFilters}
                        density="compact"
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="stream-panel"
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -16 }}
                      transition={{ duration: 0.25, ease: 'easeOut' }}
                    >
                      <NeonStreamSection
                        data={query.data?.data ?? []}
                        loading={query.isLoading || query.isFetching}
                        error={query.error}
                        variant="embedded"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </section>

          <SocialsSection />

          <section className="space-y-8">
            <ValueBetsSection
              data={query.data?.data ?? []}
              loading={query.isLoading || query.isFetching}
              error={query.error}
            />
            <HighOddsSection
              data={query.data?.data ?? []}
              loading={query.isLoading || query.isFetching}
              error={query.error}
            />
          </section>

          <GeminiSearchSection />

          <section className="space-y-6">
            {viewMode === 'rolldowns' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08, duration: 0.5, ease: 'easeOut' }}
              >
                <TournamentRolldowns
                  data={query.data?.data ?? []}
                  loading={query.isLoading || query.isFetching}
                  error={query.error}
                />
              </motion.div>
            )}

            {viewMode === 'table' && (
              <motion.div
                className="rounded-3xl border border-slate-800/70 bg-[#120d1f] overflow-hidden"
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08, duration: 0.6, ease: 'easeOut' }}
              >
                <PredictionTable
                  data={query.data?.data ?? []}
                  loading={query.isLoading || query.isFetching}
                  error={query.error}
                  page={page}
                  pageSize={pageSize}
                  totalPages={totalPages}
                  totalRecords={totalRecords}
                  onPageChange={setPage}
                  onPageSizeChange={setPageSize}
                  pageSizeOptions={pageSizeOptions}
                  onFilterChange={handleFilterChange}
                  onSortChange={handleFilterChange}
                  sortBy={filters.sortBy}
                  sortDir={filters.sortDir}
                />
              </motion.div>
            )}
          </section>
        </main>

        <AnimatePresence>
          {query.isFetching && (
            <motion.div
              className="fixed bottom-6 right-6 px-4 py-2 rounded-full bg-slate-900/85 border border-slate-700/60 backdrop-blur"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3 }}
            >
              Refreshing predictions…
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function MetricCard({ label, value, accent }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-800/70 bg-slate-900/70 px-5 py-4">
      <div className={`absolute inset-y-0 left-0 w-1 ${accent}`} />
      <div className="text-xs uppercase tracking-[0.35em] text-slate-400">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-slate-50">{value}</div>
    </div>
  )
}

function ModeToggle({ icon, label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
        active
          ? 'border border-amber-400/70 bg-amber-400/15 text-amber-200'
          : 'border border-transparent text-slate-300 hover:text-amber-200'
      }`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  )
}

function ScopeToggle({ active, onChange }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-slate-800/70 bg-slate-900/60 p-1">
      <ScopePill
        label="Today only"
        active={active === 'today'}
        onClick={() => onChange('today')}
      />
      <ScopePill
        label="Open calendar"
        active={active !== 'today'}
        onClick={() => onChange('open')}
      />
    </div>
  )
}

function ScopePill({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] transition-colors ${
        active
          ? 'bg-amber-400 text-[#120d1f]'
          : 'text-slate-300 hover:text-amber-200'
      }`}
    >
      {label}
    </button>
  )
}

function PanelSwitch({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
        active
          ? 'bg-slate-100 text-slate-900'
          : 'text-slate-300 hover:text-slate-100'
      }`}
    >
      {label}
    </button>
  )
}
