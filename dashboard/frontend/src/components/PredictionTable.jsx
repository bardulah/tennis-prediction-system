import { motion } from 'framer-motion'

const rowVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.035, duration: 0.35, ease: 'easeOut' }
  })
}

const columns = [
  { key: 'prediction_day', label: 'Day', sortable: true },
  { key: 'tournament', label: 'Tournament', sortable: true },
  { key: 'surface', label: 'Surface', sortable: true },
  { key: 'matchup', label: 'Match-up', sortable: false },
  { key: 'predicted_winner', label: 'Predicted Winner', sortable: true },
  { key: 'predicted_odds', label: 'Odds', sortable: true },
  { key: 'confidence_score', label: 'Conf.', sortable: true },
  { key: 'recommended_action', label: 'Call', sortable: true },
  { key: 'live_status', label: 'Status', sortable: false }
]

export default function PredictionTable({
  data,
  loading,
  error,
  page,
  pageSize,
  totalPages,
  totalRecords,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions,
  onFilterChange,
  onSortChange,
  sortBy = '',
  sortDir = 'DESC'
}) {
  const shouldShowPagination = (totalPages && totalPages > 1) || (pageSize && totalRecords && pageSize < totalRecords)

  return (
    <div className="w-full">
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead className="bg-slate-900/80">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`text-left text-xs uppercase tracking-wider px-5 py-3 ${
                    column.sortable 
                      ? 'text-slate-400 cursor-pointer hover:text-slate-200 transition-colors' 
                      : 'text-slate-400'
                  }`}
                  onClick={() => {
                    if (column.sortable && onSortChange) {
                      const newSortDir = (sortBy === column.key && sortDir === 'ASC') ? 'DESC' : 'ASC'
                      onSortChange({ sortBy: column.key, sortDir: newSortDir })
                    }
                  }}
                >
                  <div className="flex items-center gap-1">
                    {column.label}
                    {column.sortable && sortBy === column.key && (
                      <span className="text-teal-400">
                        {sortDir === 'ASC' ? '↑' : '↓'}
                      </span>
                    )}
                    {column.sortable && sortBy !== column.key && (
                      <span className="text-slate-600 text-xs">↕</span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-slate-950/30 divide-y divide-slate-800/60">
            {loading && <SkeletonRows />}
            {!loading && error && (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-slate-300/80">
                  Failed to load predictions.
                </td>
              </tr>
            )}
            {!loading && !error && data.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-slate-300/80">
                  No predictions match your filters yet.
                </td>
              </tr>
            )}
            {!loading && !error && data.map((row, index) => (
              <motion.tr
                key={row.prediction_id}
                custom={index}
                variants={rowVariants}
                initial="hidden"
                animate="visible"
                className={`transition-colors ${row.value_bet ? 'bg-teal-500/[0.08]' : ''}`}
              >
                <td className="px-5 py-4 text-sm text-slate-200/90">
                  {formatDay(row.prediction_day)}
                </td>
                <td className="px-5 py-4 text-sm text-slate-300">
                  <div className="font-medium text-slate-100/90">
                    {row.tournament}
                  </div>
                  <div className="text-xs text-slate-400">{row.learning_phase?.replaceAll('_', ' ') || '—'}</div>
                </td>
                <td className="px-5 py-4 text-sm">
                  <span className="uiverse-pill text-xs">
                    {row.surface}
                  </span>
                </td>
                <td className="px-5 py-4 text-sm text-slate-200">
                  <div className="font-semibold flex items-center gap-2">
                    <span>{row.player1}</span>
                    <span className="text-slate-500">vs</span>
                    <span>{row.player2}</span>
                  </div>
                  <div className="text-xs text-slate-400">Odds {Number(row.odds_player1).toFixed(2)} / {Number(row.odds_player2).toFixed(2)}</div>
                </td>
                <td className="px-5 py-4 text-sm text-slate-200">
                  <div className="font-semibold text-emerald-300 flex items-center gap-2">
                    <span className="text-teal-400">🏆</span>
                    {row.predicted_winner}
                  </div>
                </td>
                <td className="px-5 py-4 text-sm text-slate-200">
                  <div className="font-semibold text-amber-300">
                    {row.predicted_winner === row.player1 
                      ? Number(row.odds_player1).toFixed(2)
                      : Number(row.odds_player2).toFixed(2)
                    }
                  </div>
                  <div className="text-xs text-slate-400">vs {row.predicted_winner === row.player1 ? Number(row.odds_player2).toFixed(2) : Number(row.odds_player1).toFixed(2)}</div>
                </td>
                <td className="px-5 py-4 text-sm text-slate-200">
                  <ConfidenceBadge value={row.confidence_score} bucket={row.confidence_bucket} />
                </td>
                <td className="px-5 py-4 text-sm text-slate-200">
                  <CallBadge action={row.recommended_action} />
                </td>
                <td className="px-5 py-4 text-sm">
                  <LiveStatusBadge
                    status={row.live_status}
                    score={row.live_score}
                    lastUpdated={row.last_updated}
                    actualWinner={row.actual_winner}
                    predictedWinner={row.predicted_winner}
                    predictionCorrect={row.prediction_correct}
                    player1={row.player1}
                    player2={row.player2}
                  />
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 px-5 py-4 border-t border-slate-800/70 bg-slate-900/60">
        <div className="text-sm text-slate-400">
          Showing <span className="text-slate-200">{data.length}</span> of <span className="text-slate-200">{totalRecords}</span> predictions
        </div>

        {shouldShowPagination && (
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-xs uppercase tracking-wider text-slate-400">
              Page size
              <select
                value={pageSize}
                onChange={(event) => onPageSizeChange(Number(event.target.value))}
                className="rounded-2xl bg-slate-900/80 border border-slate-700/70 px-3 py-1.5 text-sm text-slate-100"
              >
                {pageSizeOptions.map((size) => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </label>

            <div className="flex items-center gap-2">
              <PageButton disabled={page <= 1} onClick={() => onPageChange(page - 1)}>Prev</PageButton>
              <span className="text-sm text-slate-300">{page} / {Math.max(totalPages, 1)}</span>
              <PageButton disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>Next</PageButton>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function SkeletonRows() {
  return Array.from({ length: 5 }).map((_, index) => (
    <tr key={`skeleton-${index}`} className="animate-pulse">
      {columns.map((col) => (
        <td key={col.key} className="px-5 py-4">
          <div className="h-4 bg-slate-800/70 rounded-full" />
        </td>
      ))}
    </tr>
  ))
}

function formatDay(dateLike) {
  if (!dateLike) return '—'
  const date = new Date(dateLike)
  if (Number.isNaN(date.getTime())) return dateLike
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function ConfidenceBadge({ value, bucket }) {
  if (value === null || value === undefined) return <span className="text-slate-400">—</span>
  const gradient = value >= 60 ? 'from-emerald-400 to-teal-500' : value >= 45 ? 'from-amber-400 to-orange-500' : 'from-rose-400 to-pink-500'
  return (
    <span className={`inline-flex min-w-[64px] justify-center rounded-full bg-gradient-to-r ${gradient} text-slate-900 text-xs font-semibold px-3 py-1`}>{value}%</span>
  )
}

function CallBadge({ action }) {
  if (!action) return <span className="text-xs text-slate-400">—</span>
  const color = action === 'bet' ? 'text-emerald-200' : action === 'monitor' ? 'text-amber-200' : 'text-slate-200'
  return (
    <span className={`uiverse-pill text-xs ${color}`}>{action}</span>
  )
}

function LiveStatusBadge({ status, score, lastUpdated, actualWinner, predictedWinner, predictionCorrect, player1, player2 }) {
  if (!status || status === 'not_started') {
    return <span className="text-xs text-slate-400">Not Started</span>
  }

  if (status === 'live') {
    return (
      <div className="flex flex-col gap-1">
        <span className="uiverse-pill text-xs text-red-300 flex items-center gap-1">
          <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></span>
          Live
        </span>
        {score && score !== '-' && <span className="text-xs text-slate-300 font-mono">{score}</span>}
      </div>
    )
  }

  if (status === 'completed') {
    // Calculate correctness on the fly from live results, fall back to database
    let isCorrect = null
    if (actualWinner && predictedWinner) {
      isCorrect = actualWinner === predictedWinner
    } else if (predictionCorrect !== null && predictionCorrect !== undefined) {
      isCorrect = predictionCorrect
    }

    return (
      <div className="flex flex-col gap-1">
        <span className="uiverse-pill text-xs text-emerald-300 flex items-center gap-1">
          <span className="w-2 h-2 bg-emerald-400 rounded-full"></span>
          Finished
        </span>

        {score && score !== '-' && (
          <span className="text-xs text-slate-400 font-mono">{score}</span>
        )}

        {actualWinner && (
          <div className="flex flex-col gap-1">
            <span className="text-xs text-slate-200">
              {actualWinner}
            </span>
            {isCorrect !== null && (
              <span className={`text-xs font-semibold ${
                isCorrect ? 'text-emerald-300' : 'text-rose-300'
              }`}>
                {isCorrect ? '✅ Correct' : '❌ Wrong'}
              </span>
            )}
          </div>
        )}
      </div>
    )
  }

  return <span className="text-xs text-slate-400">Unknown</span>
}

function PageButton({ children, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`uiverse-button px-4 py-2 text-sm ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
    >
      {children}
    </button>
  )
}
