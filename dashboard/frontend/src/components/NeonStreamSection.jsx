import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Play, Users, Trophy, Clock } from 'lucide-react'
import AIAnalysisModal from './AIAnalysisModal'

export default function NeonStreamSection({ data, loading, error, variant = 'card' }) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [selectedMatch, setSelectedMatch] = useState(null)
  const [showAIModal, setShowAIModal] = useState(false)
  const isEmbedded = variant === 'embedded'

  // Group data by tournament
  const groupedData = useMemo(() => {
    if (!data) return {}
    
    return data.reduce((groups, match) => {
      const tournament = match.tournament || 'Unknown Tournament'
      if (!groups[tournament]) {
        groups[tournament] = []
      }
      groups[tournament].push(match)
      return groups
    }, {})
  }, [data])

  // Calculate stats for each tournament
  const tournamentStats = useMemo(() => {
    return Object.entries(groupedData).map(([tournament, matches]) => {
      const totalMatches = matches.length
      const avgConfidence = Math.round(
        matches.reduce((sum, m) => sum + (m.confidence_score || 0), 0) / totalMatches
      )
      
      const betRecommendations = matches.filter(m => m.recommended_action === 'bet').length
      const avgOdds = matches.reduce((sum, m) => {
        const odds = m.predicted_winner === m.player1 ? m.odds_player1 : m.odds_player2
        return sum + odds
      }, 0) / totalMatches

      return {
        tournament,
        totalMatches,
        avgConfidence,
        betRecommendations,
        avgOdds: avgOdds.toFixed(2),
        matches
      }
    })
  }, [groupedData])

  const handleAnalyzeMatch = (match) => {
    setSelectedMatch(match)
    setShowAIModal(true)
  }

  const containerClass = isEmbedded
    ? 'rounded-2xl border border-slate-800/60 bg-slate-950/40 overflow-hidden'
    : 'rounded-3xl border border-slate-800/70 bg-slate-950/55 shadow-[0_0_40px_rgba(10,20,40,0.28)] overflow-hidden'

  const renderShell = (content, animate = true) => (
    <motion.div
      className={containerClass}
      initial={animate ? { opacity: 0, y: 14 } : false}
      animate={animate ? { opacity: 1, y: 0 } : false}
      transition={animate ? { duration: 0.45, ease: 'easeOut' } : undefined}
    >
      {content}
    </motion.div>
  )

  if (loading) {
    return renderShell(
      <div className="p-6 text-center">
        <div className="animate-pulse space-y-3">
          <div className="h-6 bg-slate-800/70 rounded w-1/3 mx-auto" />
          <div className="space-y-2">
            <div className="h-4 bg-slate-800/50 rounded w-full" />
            <div className="h-4 bg-slate-800/50 rounded w-5/6" />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return renderShell(
      <div className="p-6 text-center">
        <p className="text-rose-300">Failed to load neon stream data</p>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return renderShell(
      <div className="p-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Play className="h-5 w-5 text-slate-400" />
          <span className="text-slate-400">No matches found</span>
        </div>
        <p className="text-sm text-slate-500">Neon database predictions will appear here</p>
      </div>
    )
  }

  const totalMatches = data.length
  const totalTournaments = tournamentStats.length

  const headerPadding = isEmbedded ? 'p-5' : 'p-6'
  const hoverColor = isEmbedded ? 'rgba(15,23,42,0.35)' : 'rgba(15, 23, 42, 0.4)'

  return (
    <>
      {renderShell(
        <>
          <motion.button
            className={`w-full flex items-center justify-between text-left transition-colors ${headerPadding} hover:bg-slate-900/40`}
            onClick={() => setIsExpanded(!isExpanded)}
            whileHover={{ backgroundColor: hoverColor }}
          >
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="p-2 rounded-xl bg-gradient-to-br from-sky-500/20 to-blue-500/20 border border-sky-500/30">
                <Play className="h-5 w-5 text-sky-300" />
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-slate-100 truncate">
                  Neon Stream
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">Tournament-grouped matchups direct from Neon</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-[10px] uppercase tracking-[0.3em] text-slate-500">Tournaments</div>
                <div className="text-sm font-semibold text-sky-300">{totalTournaments}</div>
              </div>
              <div className="text-center">
                <div className="text-[10px] uppercase tracking-[0.3em] text-slate-500">Matches</div>
                <div className="text-sm font-semibold text-blue-300">{totalMatches}</div>
              </div>
              
              <motion.div
                animate={{ rotate: isExpanded ? 0 : 180 }}
                transition={{ duration: 0.2 }}
                className="flex-shrink-0"
              >
                <ChevronDown className="h-5 w-5 text-slate-400" />
              </motion.div>
            </div>
          </motion.button>

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="border-t border-slate-800/70 bg-slate-900/20">
                  {tournamentStats.map((tournament, tournamentIndex) => (
                    <TournamentGroup
                      key={tournament.tournament}
                      tournament={tournament}
                      index={tournamentIndex}
                      onAnalyzeMatch={handleAnalyzeMatch}
                      embedded={isEmbedded}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>,
        variant !== 'embedded'
      )}

      <AIAnalysisModal
        match={selectedMatch}
        isOpen={showAIModal}
        onClose={() => {
          setShowAIModal(false)
          setSelectedMatch(null)
        }}
      />
    </>
  )
}

function TournamentGroup({ tournament, index, onAnalyzeMatch, embedded = false }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const headerPadding = embedded ? 'p-4' : 'p-5'
  const bodyBg = embedded ? 'bg-slate-900/25' : 'bg-slate-900/30'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="border-b border-slate-800/30"
    >
      {/* Tournament Header */}
      <motion.button
        className={`w-full flex items-center justify-between text-left transition-colors hover:bg-slate-800/30 ${headerPadding}`}
        onClick={() => setIsExpanded(!isExpanded)}
        whileHover={{ backgroundColor: 'rgba(51, 65, 85, 0.3)' }}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="p-1 rounded-lg bg-slate-800/60">
            <Trophy className="h-4 w-4 text-slate-400" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-slate-200 truncate">
              {tournament.tournament}
            </h4>
            <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {tournament.totalMatches} matches
              </span>
              <span className="flex items-center gap-1">
                <Trophy className="h-3 w-3" />
                {tournament.betRecommendations} bets
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-center">
            <div className="text-xs text-slate-500">Avg Conf.</div>
            <div className="text-sm font-semibold text-sky-300">{tournament.avgConfidence}%</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-slate-500">Avg Odds</div>
            <div className="text-sm font-semibold text-blue-300">{tournament.avgOdds}</div>
          </div>
          
          <motion.div
            animate={{ rotate: isExpanded ? 0 : 180 }}
            transition={{ duration: 0.2 }}
            className="flex-shrink-0"
          >
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </motion.div>
        </div>
      </motion.button>

      {/* Matches */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className={bodyBg}>
              {tournament.matches.map((match, matchIndex) => (
                <MatchRow
                  key={match.prediction_id}
                  match={match}
                  index={matchIndex}
                  onAnalyze={onAnalyzeMatch}
                  embedded={embedded}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function MatchRow({ match, index, onAnalyze, embedded = false }) {
  const confidenceColor = match.confidence_score >= 60
    ? 'from-emerald-400 to-teal-500'
    : match.confidence_score >= 45
    ? 'from-amber-400 to-orange-500'
    : 'from-rose-400 to-pink-500'

  const predictedOdds = match.predicted_winner === match.player1 
    ? match.odds_player1 
    : match.odds_player2

  const rowClass = embedded
    ? 'border-b border-slate-800/25 p-4 md:p-5 transition-colors hover:bg-slate-800/25'
    : 'border-b border-slate-800/20 p-4 transition-colors hover:bg-slate-800/20'

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.02 }}
      className={rowClass}
    >
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.7fr)_repeat(2,minmax(0,1fr))_auto] items-center">
        <div className="min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span>{formatDay(match.prediction_day)}</span>
            <span className="flex items-center gap-1 text-sky-300 font-semibold">
              <Clock className="h-3 w-3" />
              {predictedOdds.toFixed(2)}
            </span>
            {match.recommended_action === 'bet' && (
              <span className="flex items-center gap-1 text-emerald-300 font-semibold">
                <Trophy className="h-3 w-3" />
                Bet
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-slate-100 leading-tight">
            <span>{match.player1}</span>
            <span className="text-slate-500">vs</span>
            <span>{match.player2}</span>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
            <span>
              {Number(match.odds_player1).toFixed(2)} / {Number(match.odds_player2).toFixed(2)}
            </span>
            <span className="text-sky-300 font-semibold">Predicted {predictedOdds.toFixed(2)}</span>
          </div>
        </div>

        <div className="text-center text-xs text-slate-400">
          <span className="uppercase tracking-[0.25em]">Winner:</span>
          <span className="ml-1 text-sm font-semibold text-emerald-300">{match.predicted_winner}</span>
        </div>

        <div className="text-center text-xs text-slate-400">
          <span className="uppercase tracking-[0.25em]">Conf:</span>
          <span className={`ml-1 inline-flex px-2.5 py-0.5 rounded-full bg-gradient-to-r ${confidenceColor} text-slate-900 text-sm font-semibold`}>
            {match.confidence_score}%
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 text-xs text-slate-400">
          <StatusDisplay
            status={match.live_status}
            score={match.live_score}
            winner={match.actual_winner}
          />
          <ResultBadge
            correct={match.prediction_correct}
            winner={match.actual_winner}
            predicted={match.predicted_winner}
          />
          <span className={`uiverse-pill text-xs ${
            match.recommended_action === 'bet' ? 'text-emerald-200' :
            match.recommended_action === 'monitor' ? 'text-amber-200' :
            'text-slate-200'
          }`}>
            {match.recommended_action || 'N/A'}
          </span>
          <motion.button
            onClick={() => onAnalyze(match)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-purple-500/30 text-purple-300 text-xs font-medium hover:border-purple-400/60 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Analyze
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}

function ResultBadge({ correct, winner, predicted }) {
  if (correct === null || correct === undefined) {
    return null
  }

  if (correct) {
    return (
      <span className="uiverse-pill text-xs text-emerald-300">
        ✅ {winner || predicted}
      </span>
    )
  }

  return (
    <span className="uiverse-pill text-xs text-rose-300">
      ❌ {predicted}
    </span>
  )
}

function StatusDisplay({ status, score, winner }) {
  const formattedScore = score && score !== '-' ? ` (${score})` : ''

  if (!status || status === 'not_started') {
    return <span className="inline-flex items-center text-xs text-slate-400">Not started</span>
  }

  if (status === 'live') {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-rose-300">
        <span className="w-2 h-2 bg-rose-400 rounded-full animate-pulse" />
        Live{formattedScore}
      </span>
    )
  }

  if (status === 'completed') {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-emerald-300">
        <span className="w-2 h-2 bg-emerald-400 rounded-full" />
        Finished{winner ? ` – ${winner}` : ''}{formattedScore}
      </span>
    )
  }

  return <span className="inline-flex items-center text-xs text-slate-400">Unknown</span>
}

function formatDay(dateLike) {
  if (!dateLike) return '—'
  const date = new Date(dateLike)
  if (Number.isNaN(date.getTime())) return dateLike
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}
