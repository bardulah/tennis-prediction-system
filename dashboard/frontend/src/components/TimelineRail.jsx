import { motion } from 'framer-motion'

export default function TimelineRail({ loading, total }) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-900/60 px-6 py-5">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#1e293b_0%,rgba(15,23,42,0)_55%)] opacity-60" />
      <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-sm uppercase tracking-[0.3em] text-slate-400">Neon stream</h3>
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
            Powered by Go API + Neon
          </span>
        </motion.div>
      </div>
    </div>
  )
}
