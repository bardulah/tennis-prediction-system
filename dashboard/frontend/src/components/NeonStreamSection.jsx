import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Play, Users, Trophy, Clock } from 'lucide-react'
import AIAnalysisModal from './AIAnalysisModal'

export default function NeonStreamSection({ data, loading, error }) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [selectedMatch, setSelectedMatch] = useState(null)
  const [showAIModal, setShowAIModal] = useState(false)

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

  if (loading) {
    return (
      <div className="glass-panel rounded-3xl border border-slate-800/70 overflow-hidden">
        <div className="p-6 text-center">
          <div className="animate-pulse space-y-3">
            <div className="h-6 bg-slate-800/70 rounded w-1/3 mx-auto" />
            <div className="space-y-2">
              <div className="h-4 bg-slate-800/50 rounded w-full" />
              <div className="h-4 bg-slate-800/50 rounded w-5/6" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="glass-panel rounded-3xl border border-rose-500/30 bg-rose-500/10 overflow-hidden">
        <div className="p-6 text-center">
          <p className="text-rose-300">Failed to load neon stream data</p>
        </div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="glass-panel rounded-3xl border border-slate-800/70 overflow-hidden">
        <div className="p-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Play className="h-5 w-5 text-slate-400" />
            <span className="text-slate-400">No matches found</span>
          </div>
          <p className="text-sm text-slate-500">Neon database predictions will appear here</p>
        </div>
      </div>
    )
  }

  const totalMatches = data.length
  const totalTournaments = tournamentStats.length

  return (
    <>
      <motion.div
        className="glass-panel rounded-3xl border border-slate-800/70 overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Header */}
        <motion.button
          className="w-full flex items-center justify-between p-6 text-left transition-colors hover:bg-slate-900/40"
          onClick={() => setIsExpanded(!isExpanded)}
          whileHover={{ backgroundColor: 'rgba(15, 23, 42, 0.4)' }}
        >
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="p-2 rounded-xl bg-gradient-to-br from-sky-500/20 to-blue-500/20 border border-sky-500/30">
              <Play className="h-5 w-5 text-sky-300" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-semibold text-slate-100 truncate">
                Neon Stream
              </h3>
              <p className="text-sm text-slate-400 mt-1">Tournament-grouped matchups from Neon database</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-xs text-slate-500">Tournaments</div>
              <div className="text-lg font-bold text-sky-300">{totalTournaments}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-slate-500">Matches</div>
              <div className="text-lg font-bold text-blue-300">{totalMatches}</div>
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

        {/* Tournament Groups */}
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
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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

function TournamentGroup({ tournament, index, onAnalyzeMatch }) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="border-b border-slate-800/30"
    >
      {/* Tournament Header */}
      <motion.button
        className="w-full flex items-center justify-between p-4 text-left transition-colors hover:bg-slate-800/30"
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
            <div className="bg-slate-900/30">
              {tournament.matches.map((match, matchIndex) => (
                <MatchRow
                  key={match.prediction_id}
                  match={match}
                  index={matchIndex}
                  onAnalyze={onAnalyzeMatch}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
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
      transition={{ delay: index * 0.02 }}
      className="border-b border-slate-800/20 p-4 transition-colors hover:bg-slate-800/20"
    >
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        {/* Match Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xs text-slate-500">
              {formatDay(match.prediction_day)}
            </span>
            <span className="flex items-center gap-1 text-xs font-semibold text-sky-300">
              <Clock className="h-3 w-3" />
              {predictedOdds.toFixed(2)}
            </span>
            {match.recommended_action === 'bet' && (
              <span className="flex items-center gap-1 text-xs font-semibold text-emerald-300">
                <Trophy className="h-3 w-3" />
                Bet
              </span>
            )}
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
            <span className="text-sky-300 font-semibold">
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
            <span className={`uiverse-pill text-xs ${
              match.recommended_action === 'bet' ? 'text-emerald-200' :
              match.recommended_action === 'monitor' ? 'text-amber-200' :
              'text-slate-200'
            }`}>
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
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 text-purple-300 text-sm font-medium transition-all hover:from-purple-500/30 hover:to-pink-500/30 hover:border-purple-400/50"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
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

function formatDay(dateLike) {
  if (!dateLike) return '—'
  const date = new Date(dateLike)
  if (Number.isNaN(date.getTime())) return dateLike
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}
