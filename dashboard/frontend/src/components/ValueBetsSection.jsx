import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronRight, Sparkles, TrendingUp, Award, Calendar, Filter } from 'lucide-react'
import AIAnalysisModal from './AIAnalysisModal'

export default function ValueBetsSection({ data, loading, error }) {
  const [expandedTournaments, setExpandedTournaments] = useState(new Set())
  const [selectedMatch, setSelectedMatch] = useState(null)
  const [showAIModal, setShowAIModal] = useState(false)
  
  // Filter for current day predictions with odds > 1.4 AND action='bet'
  const filteredData = useMemo(() => {
    if (!data) return []
    
    const today = new Date().toISOString().split('T')[0]
    return data.filter(match => {
      // Calculate predicted odds based on predicted winner
      const predictedOdds = match.predicted_winner === match.player1 
        ? match.odds_player1 
        : match.odds_player2
      
      return (
        match.prediction_day?.startsWith(today) &&
        predictedOdds > 1.4 &&
        match.recommended_action === 'bet'
      )
    })
  }, [data])

  if (loading) {
    return <LoadingSkeleton />
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-center">
        <p className="text-rose-300">Failed to load value bets</p>
      </div>
    )
  }

  if (!filteredData || filteredData.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-800/70 bg-slate-950/30 p-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <TrendingUp className="h-5 w-5 text-slate-400" />
          <span className="text-slate-400">No value bets found for today</span>
        </div>
        <p className="text-sm text-slate-500">Current day predictions with odds &gt; 1.4 and action='bet'</p>
      </div>
    )
  }

  // Group data by tournament
  const tournamentGroups = groupByTournament(filteredData)

  const toggleTournament = (tournament) => {
    const newExpanded = new Set(expandedTournaments)
    if (newExpanded.has(tournament)) {
      newExpanded.delete(tournament)
    } else {
      newExpanded.add(tournament)
    }
    setExpandedTournaments(newExpanded)
  }

  const handleAnalyzeMatch = (match) => {
    setSelectedMatch(match)
    setShowAIModal(true)
  }

  const totalValueBets = filteredData.length
  const avgOdds = filteredData.reduce((sum, m) => {
    const odds = m.predicted_winner === m.player1 ? m.odds_player1 : m.odds_player2
    return sum + odds
  }, 0) / totalValueBets

  return (
    <>
      <motion.div
        className="space-y-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Section Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-teal-500/20 to-emerald-500/20 border border-teal-500/30">
              <TrendingUp className="h-5 w-5 text-teal-300" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-100">Value Bets</h2>
              <p className="text-sm text-slate-400">Today's picks with odds &gt; 1.4 and action='bet'</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-center">
              <div className="text-xs text-slate-500">Total Bets</div>
              <div className="text-lg font-bold text-teal-300">{totalValueBets}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-slate-500">Avg Odds</div>
              <div className="text-lg font-bold text-emerald-300">{avgOdds.toFixed(2)}</div>
            </div>
          </div>
        </div>

        {/* Tournament Groups */}
        <div className="space-y-3">
          {Object.entries(tournamentGroups).map(([tournament, matches]) => {
            const isExpanded = expandedTournaments.has(tournament)
            const stats = calculateTournamentStats(matches)

            return (
              <motion.div
                key={tournament}
                className="rounded-2xl border border-slate-800/70 bg-slate-950/30 overflow-hidden"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                layout
              >
                {/* Tournament Header */}
                <motion.button
                  className="w-full flex items-center justify-between p-4 text-left transition-colors hover:bg-slate-900/40"
                  onClick={() => toggleTournament(tournament)}
                  whileHover={{ backgroundColor: 'rgba(15, 23, 42, 0.4)' }}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <motion.div
                      animate={{ rotate: isExpanded ? 90 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex-shrink-0"
                    >
                      <ChevronRight className="h-5 w-5 text-slate-400" />
                    </motion.div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-100 truncate">
                        {tournament}
                      </h3>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {matches.length} {matches.length === 1 ? 'match' : 'matches'}
                        </span>
                        {stats.surface && (
                          <span className="uiverse-pill text-xs">{stats.surface}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Tournament Stats */}
                  <div className="hidden sm:flex items-center gap-3 ml-4">
                    <div className="text-center">
                      <div className="text-xs text-slate-500">Avg Conf</div>
                      <div className="text-sm font-semibold text-sky-300">{stats.avgConfidence}%</div>
                    </div>
                    {stats.accuracy !== null && (
                      <div className="text-center">
                        <div className="text-xs text-slate-500">Accuracy</div>
                        <div className="text-sm font-semibold text-emerald-300">{stats.accuracy}%</div>
                      </div>
                    )}
                    <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-teal-500/20 border border-teal-500/30">
                      <Award className="h-3 w-3 text-teal-400" />
                      <span className="text-xs font-semibold text-teal-300">Value</span>
                    </div>
                  </div>
                </motion.button>

                {/* Matches List */}
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
                        {matches.map((match, index) => (
                          <MatchRow
                            key={match.prediction_id}
                            match={match}
                            index={index}
                            onAnalyze={handleAnalyzeMatch}
                          />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>
      </motion.div>

      {/* AI Analysis Modal */}
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

function MatchRow({ match, index, onAnalyze }) {
  const confidenceColor = match.confidence_score >= 60
    ? 'from-emerald-400 to-teal-500'
    : match.confidence_score >= 45
    ? 'from-amber-400 to-orange-500'
    : 'from-rose-400 to-pink-500'

  const predictedOdds = match.predicted_winner === match.player1 
    ? match.odds_player1 
    : match.odds_player2

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="border-b border-slate-800/50 p-4 transition-colors hover:bg-slate-800/30 bg-teal-500/5"
    >
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        {/* Match Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xs text-slate-500">
              {formatDay(match.prediction_day)}
            </span>
            <span className="flex items-center gap-1 text-xs font-semibold text-teal-300">
              <TrendingUp className="h-3 w-3" />
              Value Bet
            </span>
          </div>

          {/* Players */}
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center gap-2 flex-1">
              <span className="font-semibold text-slate-100">{match.player1}</span>
              <span className="text-xs text-slate-500">vs</span>
              <span className="font-semibold text-slate-100">{match.player2}</span>
            </div>
          </div>

          {/* Odds */}
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <span>
              Odds: {Number(match.odds_player1).toFixed(2)} / {Number(match.odds_player2).toFixed(2)}
            </span>
            <span className="text-teal-300 font-semibold">
              Predicted: {predictedOdds.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Prediction */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="text-center">
            <div className="text-xs text-slate-500 mb-1">Prediction</div>
            <div className="font-semibold text-emerald-300 flex items-center gap-1">
              <span>🏆</span>
              <span className="text-sm">{match.predicted_winner}</span>
            </div>
            <div className="text-xs text-slate-400 mt-1">
              @ {predictedOdds.toFixed(2)}
            </div>
          </div>

          {/* Confidence Badge */}
          <div className="text-center">
            <div className="text-xs text-slate-500 mb-1">Confidence</div>
            <span className={`inline-flex px-3 py-1 rounded-full bg-gradient-to-r ${confidenceColor} text-slate-900 text-sm font-semibold`}>
              {match.confidence_score}%
            </span>
          </div>

          {/* Action */}
          <div className="text-center">
            <div className="text-xs text-slate-500 mb-1">Action</div>
            <span className="uiverse-pill text-xs text-emerald-200">
              {match.recommended_action || 'N/A'}
            </span>
          </div>

          {/* Result */}
          <div className="text-center">
            <div className="text-xs text-slate-500 mb-1">Result</div>
            <ResultBadge
              correct={match.prediction_correct}
              winner={match.actual_winner}
              predicted={match.predicted_winner}
            />
          </div>

          {/* AI Analysis Button */}
          <motion.button
            onClick={() => onAnalyze(match)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 text-purple-300 text-sm font-medium transition-all hover:from-purple-500/30 hover:to-pink-500/30 hover:border-purple-400/50"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">Analyze</span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}

function ResultBadge({ correct, winner, predicted }) {
  if (correct === null || correct === undefined) {
    return <span className="text-xs text-slate-400">Upcoming</span>
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

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-xl bg-slate-800/70 animate-pulse" />
        <div className="space-y-2">
          <div className="h-6 bg-slate-800/70 rounded-full w-32 animate-pulse" />
          <div className="h-4 bg-slate-800/50 rounded-full w-48 animate-pulse" />
        </div>
      </div>
      {[1, 2].map((i) => (
        <div key={i} className="rounded-2xl border border-slate-800/70 bg-slate-950/30 p-4 animate-pulse">
          <div className="h-6 bg-slate-800/70 rounded-full w-1/3 mb-3" />
          <div className="space-y-2">
            <div className="h-4 bg-slate-800/50 rounded-full w-full" />
            <div className="h-4 bg-slate-800/50 rounded-full w-5/6" />
          </div>
        </div>
      ))}
    </div>
  )
}

function groupByTournament(data) {
  return data.reduce((groups, match) => {
    const tournament = match.tournament || 'Unknown Tournament'
    if (!groups[tournament]) {
      groups[tournament] = []
    }
    groups[tournament].push(match)
    return groups
  }, {})
}

function calculateTournamentStats(matches) {
  const totalMatches = matches.length
  const avgConfidence = Math.round(
    matches.reduce((sum, m) => sum + (m.confidence_score || 0), 0) / totalMatches
  )

  const scoredMatches = matches.filter(m => m.prediction_correct !== null && m.prediction_correct !== undefined)
  const correctMatches = scoredMatches.filter(m => m.prediction_correct)
  const accuracy = scoredMatches.length > 0
    ? Math.round((correctMatches.length / scoredMatches.length) * 100)
    : null

  // Get common surface and learning phase
  const surface = matches[0]?.surface || null

  return {
    avgConfidence,
    accuracy,
    surface,
  }
}

function formatDay(dateLike) {
  if (!dateLike) return '—'
  const date = new Date(dateLike)
  if (Number.isNaN(date.getTime())) return dateLike
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}
