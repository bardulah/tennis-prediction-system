import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import { API_BASE_URL } from '../config.js'

export default function TournamentRollDown({ onTournamentSelect, selectedTournament }) {
  const [tournaments, setTournaments] = useState([])
  const [loading, setLoading] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    const fetchTournaments = async () => {
      setLoading(true)
      try {
        const { data } = await axios.get(`${API_BASE_URL}/api/tournaments`)
        setTournaments(data.data)
      } catch (error) {
        console.error('Failed to fetch tournaments:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTournaments()
  }, [])

  const handleTournamentClick = (tournament) => {
    onTournamentSelect(tournament)
    setIsExpanded(false)
  }

  const handleClearSelection = () => {
    onTournamentSelect('')
  }

  return (
    <div className="relative">
      <motion.button
        className="flex items-center gap-3 w-full rounded-3xl bg-slate-900/60 border border-slate-800/70 px-6 py-4 hover:bg-slate-900/80 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <div className="flex items-center gap-3">
          <div className="text-2xl">🏆</div>
          <div className="text-left">
            <div className="text-sm text-slate-400 uppercase tracking-wider">Tournament</div>
            <div className="text-slate-100 font-medium">
              {selectedTournament || 'Select a tournament'}
            </div>
          </div>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="ml-auto text-slate-400"
        >
          ▼
        </motion.div>
        {selectedTournament && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleClearSelection()
            }}
            className="ml-2 p-1 rounded-full hover:bg-slate-700/50 text-slate-400 hover:text-slate-200 transition-colors"
          >
            ✕
          </button>
        )}
      </motion.button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="absolute top-full mt-2 w-full z-50"
          >
            <div className="bg-slate-900/95 backdrop-blur border border-slate-700/80 rounded-2xl shadow-2xl max-h-80 overflow-y-auto">
              {loading ? (
                <div className="p-6 text-center text-slate-400">
                  <div className="animate-spin h-6 w-6 border-2 border-teal-400 border-t-transparent rounded-full mx-auto mb-2"></div>
                  Loading tournaments...
                </div>
              ) : tournaments.length > 0 ? (
                <div className="p-2">
                  {tournaments.map((tournament, index) => (
                    <motion.button
                      key={tournament}
                      onClick={() => handleTournamentClick(tournament)}
                      className={`w-full text-left p-3 rounded-xl transition-colors ${
                        selectedTournament === tournament
                          ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                          : 'hover:bg-slate-800/60 text-slate-200'
                      }`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ x: 4 }}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">🏆</span>
                        <div>
                          <div className="font-medium">{tournament}</div>
                          {selectedTournament === tournament && (
                            <div className="text-xs text-teal-300 mt-1">✓ Selected</div>
                          )}
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-slate-400">
                  No tournaments available
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40"
            onClick={() => setIsExpanded(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
