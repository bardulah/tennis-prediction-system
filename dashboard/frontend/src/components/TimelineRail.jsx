import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight } from 'lucide-react'
import FilterPanel from './FilterPanel.jsx'

export default function TimelineRail({ loading, total, filters, onChange, loading: filterLoading }) {
  const [isExpanded, setIsExpanded] = useState(false)

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded)
  }

  return (
    <div className="glass-panel rounded-3xl border border-slate-800/80 overflow-hidden">
      {/* Neon Stream Header */}
      <motion.button
        className="w-full flex items-center justify-between p-4 text-left transition-colors hover:bg-slate-900/40"
        onClick={toggleExpanded}
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
              Neon Stream
            </h3>
            <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                Streaming {total ?? 0} rows
              </span>
            </div>
          </div>
        </div>
      </motion.button>

      {/* Stream Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="border-t border-slate-800/70 bg-slate-900/20 px-6 py-5">
              <FilterPanel
                filters={filters}
                onChange={onChange}
                loading={filterLoading}
              />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#1e293b_0%,rgba(15,23,42,0)_55%)] opacity-60" />
              <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4 mt-6">
                <div className="space-y-1">
                  <p className="text-lg font-semibold text-slate-100/90">
                    {loading ? 'Querying live predictions…' : `Streaming ${total ?? 0} rows from Neon`}
                  </p>
                </div>

                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  className="flex items-center gap-3"
                >
                  <motion.div
                    className="h-2 w-32 rounded-full bg-slate-800 overflow-hidden"
                    initial={{ backgroundPosition: '0 0' }}
                    animate={{ backgroundPosition: '200% 0' }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    style={{
                      backgroundImage: 'linear-gradient(90deg, rgba(34,211,166,0.4) 0%, rgba(14,165,233,0.4) 50%, rgba(124,58,237,0.35) 100%)'
                    }}
                  />
                  <span className="uiverse-pill text-xs text-slate-100/80">
                    {total ?? 0} rows
                  </span>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
