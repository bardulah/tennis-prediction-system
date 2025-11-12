import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, ExternalLink, Loader2, Sparkles, AlertCircle, TrendingUp, CalendarClock } from 'lucide-react'
import { fetchSportsPicks } from '../services/geminiSearch'

export default function GeminiSearchSection() {
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSearch = async (e) => {
    e.preventDefault()
    
    if (!query.trim()) {
      setError('Please enter a search query')
      return
    }

    setLoading(true)
    setError(null)
    setSearchResults(null)

    try {
      const results = await fetchSportsPicks(query.trim())
      setSearchResults(results)
    } catch (err) {
      setError(err.message || 'Failed to fetch sports picks')
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => {
    setQuery('')
    setSearchResults(null)
    setError(null)
  }

  const formatEventStart = (isoString) => {
    if (!isoString) return null
    const date = new Date(isoString)
    if (Number.isNaN(date.getTime())) return null
    return date.toLocaleString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
    >
      {/* Section Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30">
          <Sparkles className="h-5 w-5 text-purple-300" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-100">AI Sports Picks Search</h2>
          <p className="text-sm text-slate-400">Find expert picks powered by Gemini</p>
        </div>
      </div>

      {/* Search Form */}
      <motion.div
        className="glass-panel rounded-3xl p-6 border border-slate-800/70"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="relative">
            <motion.div
              className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-400/20 to-pink-500/10 blur"
              initial={{ opacity: 0 }}
              animate={{ opacity: query ? 1 : 0.3 }}
              transition={{ duration: 0.4 }}
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g., 'Best tennis bets today', 'NBA value bets', 'soccer accumulator tips'"
              className="relative w-full px-6 py-4 pr-12 rounded-2xl bg-slate-900/50 border border-slate-700/50 text-slate-100 placeholder-slate-400 focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
              disabled={loading}
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
              {query && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors"
                  disabled={loading}
                >
                  ✕
                </button>
              )}
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Search across sports news, betting analysis, and expert predictions</span>
            <span className="text-purple-400">Powered by Gemini</span>
          </div>
        </form>
      </motion.div>

      {/* Error Display */}
      {error && (
        <motion.div
          className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-2 text-rose-300">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        </motion.div>
      )}

      {/* Search Results */}
      {searchResults && (
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <span>Found {searchResults.picks.length} upcoming pick{searchResults.picks.length !== 1 ? 's' : ''}</span>
            {searchResults.picks.length > 0 && (
              <span>for "{query}"</span>
            )}
          </div>

          {searchResults.picks.length === 0 ? (
            <div className="rounded-2xl border border-slate-800/70 bg-slate-950/30 p-8 text-center">
              <Sparkles className="h-8 w-8 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-400">No upcoming sports picks found for this query</p>
              <p className="text-sm text-slate-500 mt-2">Try different keywords or check back later</p>
            </div>
          ) : (
            <div className="space-y-3">
              {searchResults.picks.map((pick, index) => (
                <motion.div
                  key={index}
                  className="glass-panel rounded-2xl p-5 border border-slate-800/70 hover:border-purple-500/30 transition-colors"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-slate-500 uppercase tracking-wide">{pick.league}</span>
                          {pick.odds && (
                            <span className="flex items-center gap-1 text-xs font-semibold text-emerald-300">
                              <TrendingUp className="h-3 w-3" />
                              {pick.odds}
                            </span>
                          )}
                        </div>
                        <h3 className="font-semibold text-slate-100">{pick.matchup}</h3>
                        {formatEventStart(pick.eventStartTime) && (
                          <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                            <CalendarClock className="h-3.5 w-3.5" />
                            <span>{formatEventStart(pick.eventStartTime)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Pick and Reason */}
                    <div className="space-y-2">
                      <div>
                        <span className="text-xs text-slate-500 uppercase tracking-wide">Pick</span>
                        <p className="font-medium text-purple-300">{pick.pick}</p>
                      </div>
                      
                      <div>
                        <span className="text-xs text-slate-500 uppercase tracking-wide">Reasoning</span>
                        <p className="text-sm text-slate-300">{pick.reason}</p>
                      </div>
                    </div>

                    {/* Source */}
                    {pick.sourceUrl && (
                      <div className="flex items-center justify-between pt-3 border-t border-slate-800/50">
                        <div className="flex-1 min-w-0">
                          <span className="text-xs text-slate-500 uppercase tracking-wide">Source</span>
                          <a
                            href={pick.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-sm text-slate-300 hover:text-purple-300 truncate transition-colors"
                          >
                            {pick.sourceTitle || pick.sourceUrl}
                          </a>
                        </div>
                        <a
                          href={pick.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-3 py-1 rounded-lg bg-slate-800/50 text-slate-400 hover:text-purple-300 hover:bg-slate-700/50 transition-colors"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  )
}
