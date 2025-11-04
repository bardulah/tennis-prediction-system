import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { AnimatePresence, motion } from 'framer-motion'
import { LayoutGrid, List } from 'lucide-react'
import FilterPanel from './components/FilterPanel.jsx'
import PredictionTable from './components/PredictionTable.jsx'
import TournamentRolldowns from './components/TournamentRolldowns.jsx'
import SocialsSection from './components/SocialsSection.jsx'
import TimelineRail from './components/TimelineRail.jsx'

const pageSizeOptions = [10, 25, 50, 100]

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
  const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://193.24.209.9:3001'
  const params = buildQueryParams(filters, page, pageSize)
  const fullURL = `${baseURL}/api/predictions?${params}`
  console.log('🔗 Making API call to:', fullURL)
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
  const [pageSize, setPageSize] = useState(25)
  const [showFilters, setShowFilters] = useState(true)
  const [viewMode, setViewMode] = useState('rolldowns') // 'rolldowns' or 'table'
  const [filters, setFilters] = useState({
    search: '',
    surface: '',
    tournament: '',
    learningPhase: '',
    recommendedAction: '',
    predictionCorrect: '',
    valueBet: '',
    minConfidence: '',
    maxConfidence: '',
    dateFrom: '',
    dateTo: '',
    sortBy: 'prediction_day',
    sortDir: 'DESC'
  })

  const query = useQuery({
    queryKey: ['predictions', filters, page, pageSize],
    queryFn: fetchPredictions,
    keepPreviousData: true
  })

  const meta = query.data?.meta ?? { total: 0, total_pages: 0 }
  const totalRecords = meta.total ?? meta.totalRecords ?? 0

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
    setFilters((current) => ({ ...current, ...next }))
  }

  const totalPages = meta.total_pages ?? meta.totalPages ?? 0

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 pb-16">
      <div className="max-w-7xl mx-auto">
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="px-6 pt-10 pb-4 flex flex-col gap-6"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 via-sky-300 to-fuchsia-400">Tennis Predictions Control Room</span>
            </h1>
            <p className="text-slate-300/80 max-w-2xl">
              Monitor live model outputs, spot value-bet opportunities, and replay how today’s calls performed. Powered by Neon + Go API. Styled with UIverse glassmorphism and ReactBits animation cues.
            </p>
          </div>
          <motion.button
            className="uiverse-button"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => window.open('https://uiverse.io/', '_blank')}
          >
            Browse UIverse Inspiration
          </motion.button>
        </div>
      </motion.header>

      <main className="px-4 sm:px-6 max-w-full space-y-6">
        {/* Compact Overview Cards with Controls */}
        <motion.div
          className="flex flex-wrap gap-4 items-center justify-between"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <div className="flex flex-wrap gap-4">
            <div className="glass-panel rounded-2xl px-4 py-3 border border-slate-800/70">
              <div className="text-xs text-slate-400 uppercase tracking-wide">Accuracy</div>
              <div className="text-lg font-bold text-emerald-300">{highlightMetrics.accuracy}</div>
            </div>
            <div className="glass-panel rounded-2xl px-4 py-3 border border-slate-800/70">
              <div className="text-xs text-slate-400 uppercase tracking-wide">Avg Conf.</div>
              <div className="text-lg font-bold text-sky-300">{highlightMetrics.averageConfidence}</div>
            </div>
            <div className="glass-panel rounded-2xl px-4 py-3 border border-slate-800/70">
              <div className="text-xs text-slate-400 uppercase tracking-wide">Value Bets</div>
              <div className="text-lg font-bold text-fuchsia-300">{highlightMetrics.valueBetShare}</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="glass-panel rounded-2xl border border-slate-800/70 p-1 flex items-center gap-1">
              <button
                onClick={() => setViewMode('rolldowns')}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                  viewMode === 'rolldowns'
                    ? 'bg-gradient-to-r from-teal-500/20 to-sky-500/20 text-teal-300 border border-teal-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <LayoutGrid className="h-4 w-4" />
                <span className="hidden sm:inline">Tournaments</span>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                  viewMode === 'table'
                    ? 'bg-gradient-to-r from-teal-500/20 to-sky-500/20 text-teal-300 border border-teal-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <List className="h-4 w-4" />
                <span className="hidden sm:inline">Table</span>
              </button>
            </div>

            {/* Filter Toggle Button */}
            <motion.button
              className="uiverse-button flex items-center gap-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowFilters(!showFilters)}
            >
              <span>{showFilters ? '🔼' : '🔽'}</span>
              {showFilters ? 'Hide Filters' : 'Show Filters'}
              {!showFilters && (
                <span className="text-xs bg-teal-500/20 text-teal-300 px-2 py-1 rounded-full">
                  {Object.values(filters).filter(v => v !== '').length} active
                </span>
              )}
            </motion.button>
          </div>
        </motion.div>

        {/* Collapsible Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -20 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -20 }}
              transition={{ duration: 0.4, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <motion.div
                className="glass-panel rounded-3xl p-6 border border-slate-800/70 w-full max-w-none"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.3 }}
              >
                <FilterPanel
                  filters={filters}
                  onChange={handleFilterChange}
                  loading={query.isFetching}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Community Picks Section */}
        <SocialsSection />

        {/* Timeline and Predictions */}
        <section className="space-y-6">
          <TimelineRail loading={query.isLoading} total={totalRecords} />

          {/* Tournament Rolldowns View */}
          {viewMode === 'rolldowns' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              <TournamentRolldowns
                data={query.data?.data ?? []}
                loading={query.isLoading || query.isFetching}
                error={query.error}
              />
            </motion.div>
          )}

          {/* Table View */}
          {viewMode === 'table' && (
            <motion.div
              className="glass-panel rounded-3xl border border-slate-800/70 overflow-hidden w-full max-w-none"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8, ease: 'easeOut' }}
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
