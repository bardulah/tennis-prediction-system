import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Sparkles, Loader2, ExternalLink, AlertCircle, RefreshCw, Database } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { analyzeMatch, analyzeMatchWithPerplexity, clearMatchAnalysis, getAIProvidersStatus } from '../services/aiAnalysis'

export default function AIAnalysisModal({ match, isOpen, onClose }) {
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selectedProvider, setSelectedProvider] = useState('google')
  const [providersStatus, setProvidersStatus] = useState(getAIProvidersStatus())

  const handleAnalyze = async (forceRefresh = false, provider = selectedProvider) => {
    setLoading(true)
    setError(null)
    if (forceRefresh) {
      // Clear existing cache when forcing refresh
      clearMatchAnalysis(match)
      setAnalysis(null)
    }

    try {
      let result;
      if (provider === 'perplexity') {
        result = await analyzeMatchWithPerplexity(match, forceRefresh)
      } else {
        result = await analyzeMatch(match, forceRefresh)
      }
      setAnalysis(result)
      setSelectedProvider(provider)
    } catch (err) {
      setError(err.message || 'Failed to analyze match')
      console.error('Analysis error:', err)
    } finally {
      setLoading(false)
    }
  }

  // Reset analysis when match changes
  useEffect(() => {
    setAnalysis(null)
    setError(null)
    setLoading(false)
  }, [match])

  // Auto-trigger analysis when modal opens
  useEffect(() => {
    if (isOpen && !analysis && !loading && match) {
      handleAnalyze()
    }
  }, [isOpen, analysis, loading, match])

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-3xl border border-slate-700/70 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 shadow-2xl"
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-800/70 bg-slate-900/95 backdrop-blur px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-gradient-to-br from-purple-500 to-pink-500 p-2">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-300">
                  AI Match Analysis
                </h2>
                <p className="text-xs text-slate-400">
                  {match.player1} vs {match.player2}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-80px)] p-6 space-y-6">
            {/* AI Provider Selection */}
            <div className="glass-panel rounded-2xl p-4 border border-slate-800/70">
              <h3 className="text-sm font-semibold text-slate-300 mb-3">AI Analysis Provider</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.entries(providersStatus).map(([key, status]) => (
                  <button
                    key={key}
                    onClick={() => {
                      if (status.configured) {
                        setSelectedProvider(key)
                        setAnalysis(null) // Clear current analysis
                        setError(null)
                      }
                    }}
                    disabled={!status.configured}
                    className={`rounded-xl border p-3 text-left transition-all ${
                      selectedProvider === key
                        ? 'border-purple-500/50 bg-purple-500/20'
                        : status.configured
                        ? 'border-slate-700 bg-slate-900/50 hover:border-slate-600'
                        : 'border-slate-800 bg-slate-950/30 cursor-not-allowed opacity-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-2 h-2 rounded-full ${
                        status.configured ? 'bg-emerald-400' : 'bg-slate-500'
                      }`} />
                      <span className="font-medium text-slate-200">
                        {status.name}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400">
                      {status.description}
                    </span>
                    {!status.configured && (
                      <span className="text-xs text-rose-400 block mt-1">
                        API key not configured
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Match Summary Card */}
            <div className="glass-panel rounded-2xl p-4 border border-slate-800/70">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-400">Tournament:</span>
                  <div className="font-medium text-slate-200">{match.tournament}</div>
                </div>
                <div>
                  <span className="text-slate-400">Surface:</span>
                  <div className="font-medium text-slate-200">{match.surface}</div>
                </div>
                <div>
                  <span className="text-slate-400">AI Prediction:</span>
                  <div className="font-semibold text-emerald-300">{match.predicted_winner}</div>
                </div>
                <div>
                  <span className="text-slate-400">Confidence:</span>
                  <div className="font-semibold text-sky-300">{match.confidence_score}%</div>
                </div>
                <div>
                  <span className="text-slate-400">Odds:</span>
                  <div className="font-medium text-amber-300">
                    {Number(match.odds_player1).toFixed(2)} / {Number(match.odds_player2).toFixed(2)}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400">Action:</span>
                  <div className="font-medium text-teal-300 uppercase">{match.recommended_action}</div>
                </div>
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <motion.div
                className="flex flex-col items-center justify-center py-12 space-y-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <Loader2 className="h-12 w-12 animate-spin text-purple-400" />
                <p className="text-slate-300">Analyzing match with AI...</p>
                <p className="text-sm text-slate-400">Searching web for latest player stats and form</p>
              </motion.div>
            )}

            {/* Error State */}
            {error && (
              <motion.div
                className="flex items-start gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <AlertCircle className="h-5 w-5 text-rose-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-rose-300">Analysis Failed</h3>
                  <p className="text-sm text-rose-200/80 mt-1">{error}</p>
                  <button
                    onClick={handleAnalyze}
                    className="mt-3 text-sm text-rose-300 underline hover:text-rose-200"
                  >
                    Try Again
                  </button>
                </div>
              </motion.div>
            )}

            {/* Cache Status Banner */}
            {analysis?.fromCache && (
              <motion.div
                className="rounded-2xl border border-sky-500/30 bg-sky-500/10 p-4"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-start gap-3">
                  <Database className="h-5 w-5 text-sky-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-sky-300">Cached Analysis</h3>
                    <p className="text-sm text-sky-200/80 mt-1">
                      Analysis from {new Date(analysis.cachedAt).toLocaleString()}
                    </p>
                    <button
                      onClick={() => handleAnalyze(true)}
                      className="mt-3 text-sm text-sky-300 underline hover:text-sky-200 flex items-center gap-1"
                    >
                      <RefreshCw className="h-3 w-3" />
                      Run fresh analysis
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Analysis Content */}
            {analysis && (
              <motion.div
                className="space-y-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {/* Analysis Text */}
                <div className="prose prose-invert prose-slate max-w-none">
                  <div className="rounded-2xl border border-slate-800/70 bg-slate-950/50 p-6">
                    <ReactMarkdown
                      components={{
                        h1: ({ children }) => (
                          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-300 mb-4">
                            {children}
                          </h1>
                        ),
                        h2: ({ children }) => (
                          <h2 className="text-xl font-semibold text-sky-300 mt-6 mb-3">
                            {children}
                          </h2>
                        ),
                        h3: ({ children }) => (
                          <h3 className="text-lg font-medium text-teal-300 mt-4 mb-2">
                            {children}
                          </h3>
                        ),
                        p: ({ children }) => (
                          <p className="text-slate-300 mb-3 leading-relaxed">
                            {children}
                          </p>
                        ),
                        ul: ({ children }) => (
                          <ul className="list-disc list-inside space-y-1 text-slate-300 mb-3">
                            {children}
                          </ul>
                        ),
                        li: ({ children }) => (
                          <li className="text-slate-300">{children}</li>
                        ),
                        strong: ({ children }) => (
                          <strong className="font-semibold text-slate-100">{children}</strong>
                        ),
                      }}
                    >
                      {analysis.analysis}
                    </ReactMarkdown>
                  </div>
                </div>

                {/* Sources */}
                {analysis.sources && analysis.sources.length > 0 && (
                  <div className="rounded-2xl border border-slate-800/70 bg-slate-950/50 p-4">
                    <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
                      Sources
                    </h3>
                    <div className="space-y-2">
                      {analysis.sources.map((source, index) => (
                        <a
                          key={index}
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/50 px-3 py-2 text-sm text-slate-300 transition-colors hover:border-teal-500/50 hover:bg-slate-800/50"
                        >
                          <ExternalLink className="h-4 w-4 text-slate-400" />
                          <span className="flex-1 truncate">{source.title}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  {analysis?.fromCache ? (
                    <button
                      onClick={() => handleAnalyze(true, selectedProvider)}
                      className="flex items-center gap-2 px-6 py-3 rounded-2xl border border-purple-500/50 bg-purple-500/20 text-purple-300 transition-colors hover:bg-purple-500/30"
                    >
                      <RefreshCw className="h-4 w-4" />
                      <span>Run Fresh Analysis</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleAnalyze(true, selectedProvider)}
                      className="flex items-center gap-2 px-6 py-3 rounded-2xl border border-slate-800 bg-slate-800 text-slate-300 transition-colors hover:bg-slate-700"
                    >
                      <RefreshCw className="h-4 w-4" />
                      <span>Re-run Analysis</span>
                    </button>
                  )}
                  
                  {/* Compare button - only show if both providers are configured */}
                  {providersStatus.google.configured && providersStatus.perplexity.configured && (
                    <button
                      onClick={() => {
                        // Toggle to the other provider
                        const otherProvider = selectedProvider === 'google' ? 'perplexity' : 'google';
                        setSelectedProvider(otherProvider);
                        setAnalysis(null);
                        setError(null);
                      }}
                      className="flex items-center gap-2 px-6 py-3 rounded-2xl border border-teal-500/50 bg-teal-500/20 text-teal-300 transition-colors hover:bg-teal-500/30"
                    >
                      <Sparkles className="h-4 w-4" />
                      <span>
                        Compare with {selectedProvider === 'google' ? 'Perplexity' : 'Google Gemini'}
                      </span>
                    </button>
                  )}
                </div>

                {/* Metadata */}
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>
                    Generated by {analysis.model}
                    {analysis?.fromCache && ' (from cache)'}
                  </span>
                  <span>
                    {new Date(analysis.timestamp).toLocaleString()}
                    {analysis?.fromCache && (
                      <span className="ml-2">
                        cached {new Date(analysis.cachedAt).toLocaleTimeString()}
                      </span>
                    )}
                  </span>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
