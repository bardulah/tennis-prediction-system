import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, TrendingUp, RefreshCw, ExternalLink, Users, Award } from 'lucide-react'
import { getTennisBettingThreads, getSocialsStatus } from '../services/socialsScraper'

export default function SocialsSection() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [expanded, setExpanded] = useState(false)
  const [status, setStatus] = useState(getSocialsStatus())

  const fetchData = async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await getTennisBettingThreads()
      setData(result)
    } catch (err) {
      setError(err.message)
      console.error('Error fetching social data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    // Refresh every 15 minutes
    const interval = setInterval(fetchData, 15 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const totalPicks = data?.picks?.length || 0
  const highConfidencePicks = data?.picks?.filter(p =>
    p.extracted?.some(e => e.confidence === 'high')
  ).length || 0

  return (
    <motion.div
      className="glass-panel rounded-3xl border border-slate-800/70 overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between p-6 cursor-pointer bg-gradient-to-r from-slate-900/50 to-slate-800/30 border-b border-slate-800/70"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-4">
          <div className="rounded-full bg-gradient-to-br from-orange-500 to-pink-500 p-3">
            <MessageSquare className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-orange-300 to-pink-300">
              Community Picks
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              {status.message}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Stats Pills */}
          <div className="hidden sm:flex items-center gap-3">
            <div className="glass-panel rounded-full px-4 py-2 border border-slate-800">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-orange-400" />
                <span className="text-sm font-semibold text-slate-200">{totalPicks}</span>
                <span className="text-xs text-slate-400">threads</span>
              </div>
            </div>
            <div className="glass-panel rounded-full px-4 py-2 border border-slate-800">
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-emerald-400" />
                <span className="text-sm font-semibold text-emerald-300">{highConfidencePicks}</span>
                <span className="text-xs text-slate-400">hot picks</span>
              </div>
            </div>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation()
              fetchData()
            }}
            disabled={loading}
            className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200 disabled:opacity-50"
          >
            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <motion.div
            animate={{ rotate: expanded ? 180 : 0 }}
            className="text-slate-400"
          >
            ▼
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="p-6 space-y-4">
              {/* Loading State */}
              {loading && !data && (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin text-slate-400" />
                </div>
              )}

              {/* Error State */}
              {error && (
                <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-center">
                  <p className="text-sm text-rose-300">{error}</p>
                </div>
              )}

              {/* Summary */}
              {data?.summary && (
                <div className="rounded-2xl border border-slate-800/70 bg-slate-950/50 p-4">
                  <h3 className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-orange-400" />
                    Community Consensus
                  </h3>
                  <p className="text-sm text-slate-400">{data.summary}</p>
                </div>
              )}

              {/* Picks Grid */}
              {data?.picks && data.picks.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data.picks.slice(0, 6).map((pick) => (
                    <PickCard key={pick.id} pick={pick} />
                  ))}
                </div>
              )}

              {/* Last Updated */}
              {data?.lastUpdated && (
                <div className="text-center text-xs text-slate-500">
                  Last updated: {new Date(data.lastUpdated).toLocaleTimeString()}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function PickCard({ pick }) {
  const confidenceBadge = pick.extracted?.[0]?.confidence || 'medium'
  const confidenceColor = {
    high: 'from-emerald-500 to-teal-500',
    medium: 'from-amber-500 to-orange-500',
    low: 'from-slate-500 to-slate-600',
  }[confidenceBadge]

  const extractedPick = pick.extracted?.[0]

  return (
    <motion.a
      href={pick.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block rounded-2xl border border-slate-800/70 bg-slate-950/30 p-4 transition-all hover:border-orange-500/50 hover:bg-slate-900/50"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-slate-200 truncate group-hover:text-orange-300 transition-colors">
            {pick.title}
          </h4>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-slate-500">r/{pick.subreddit}</span>
            {pick.score > 0 && (
              <span className="text-xs text-slate-500">• {pick.score} upvotes</span>
            )}
          </div>
        </div>
        <ExternalLink className="h-4 w-4 text-slate-400 flex-shrink-0 group-hover:text-orange-400 transition-colors" />
      </div>

      {/* Content Preview */}
      <p className="text-xs text-slate-400 line-clamp-2 mb-3">
        {pick.content}
      </p>

      {/* Extracted Pick */}
      {extractedPick && (
        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 uppercase tracking-wider">Pick</span>
            <span className={`text-xs font-semibold px-2 py-1 rounded-full bg-gradient-to-r ${confidenceColor} text-white`}>
              {confidenceBadge}
            </span>
          </div>
          {extractedPick.player1 && extractedPick.player2 && (
            <div className="text-sm text-slate-300">
              <span className="font-medium text-slate-200">{extractedPick.player1}</span>
              <span className="text-slate-500 mx-2">vs</span>
              <span className="font-medium text-slate-200">{extractedPick.player2}</span>
            </div>
          )}
          {extractedPick.pick && (
            <div className="text-sm">
              <span className="text-slate-400">Backing: </span>
              <span className="font-semibold text-emerald-300">{extractedPick.pick}</span>
            </div>
          )}
        </div>
      )}
    </motion.a>
  )
}
