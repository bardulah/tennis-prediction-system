import { motion } from 'framer-motion'

const cardVariants = {
  hidden: { opacity: 0, y: 24, rotateX: 15 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    rotateX: 0,
    transition: {
      delay: 0.1 + i * 0.12,
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1]
    }
  })
}

const cards = (
  metrics,
  loading
) => [
  {
    title: 'Accuracy clip',
    metric: metrics.accuracy,
    accent: 'from-emerald-300 via-lime-300 to-sky-300',
    description: 'Share of predictions landing exactly right this slice of data.'
  },
  {
    title: 'Avg confidence',
    metric: metrics.averageConfidence,
    accent: 'from-fuchsia-300 via-purple-300 to-indigo-300',
    description: 'Mean self-belief of the model for the rows you are seeing.'
  },
  {
    title: 'Value bet density',
    metric: metrics.valueBetShare,
    accent: 'from-cyan-300 via-sky-300 to-violet-300',
    description: 'How often the AI called out a betting edge in this window.'
  }
]

export default function OverviewCards({ metrics, loading }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {cards(metrics, loading).map((card, index) => (
        <motion.div
          key={card.title}
          custom={index}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          className="relative overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-900/60 px-5 py-6"
        >
          <div className={`absolute inset-0 bg-gradient-to-br ${card.accent} opacity-20`} />
          <div className="relative space-y-4">
            <div className="uiverse-pill text-xs uppercase tracking-widest text-slate-200/90">
              {card.title}
            </div>
            <motion.div
              key={card.metric}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
              className="text-4xl font-semibold text-slate-50"
            >
              {loading ? '…' : card.metric}
            </motion.div>
            <p className="text-sm text-slate-300/70 leading-relaxed">
              {card.description}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
