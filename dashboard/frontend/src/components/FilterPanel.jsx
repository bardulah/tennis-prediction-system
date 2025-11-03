import { useMemo } from 'react'
import { motion } from 'framer-motion'

const surfaces = ['', 'Hard', 'Clay', 'Grass', 'Carpet']
const tournaments = [
  '',
  'Chennai (India), hard',
  'Paris (France), hard (indoor)',
  'Monastir (Tunisia), hard',
  'Hong Kong (Hong Kong), hard',
  'Seoul (South Korea), hard',
  'Jiujiang (China), hard',
  'Bratislava 2 (Slovakia), hard (indoor)',
  'Charlottesville (USA), hard (indoor)',
  'Cali (Colombia), clay',
  'Lima 2 (Peru), clay',
  'M15 Heraklion 12 (Greece), hard',
  'M15 Hua Hin 2 (Thailand), hard',
  'M15 Bol 2 (Croatia), clay',
  'W15 Bol 2 (Croatia), clay'
]
const actions = ['', 'bet', 'monitor', 'skip']
const learningPhases = ['', 'phase1_data_collection', 'phase2_pattern_recognition', 'phase3_mature_system']
const sortOptions = [
  { value: 'prediction_day', label: 'Prediction Date' },
  { value: 'created_at', label: 'Created At' },
  { value: 'confidence_score', label: 'Confidence' },
  { value: 'system_accuracy_at_prediction', label: 'System Accuracy' }
]

export default function FilterPanel({ filters, onChange, loading }) {
  const toggleValue = (key, trueValue = 'true', falseValue = 'false') => {
    const current = filters[key]
    if (current === trueValue) {
      onChange({ [key]: '' })
    } else if (current === falseValue) {
      onChange({ [key]: trueValue })
    } else {
      onChange({ [key]: trueValue })
    }
  }

  const isPredictionCorrect = useMemo(() => filters.predictionCorrect === 'true', [filters.predictionCorrect])
  const isValueBet = useMemo(() => filters.valueBet === 'true', [filters.valueBet])

  const handleInput = (key) => (event) => {
    onChange({ [key]: event.target.value })
  }

  const clearFilters = () => {
    onChange({
      search: '',
      surface: '',
      tournament: '',
      learningPhase: '',
      recommendedAction: '',
      predictionCorrect: '',
      valueBet: '',
      minConfidence: '',
      maxConfidence: '',
      dateFrom: '',
      dateTo: ''
    })
  }

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">Filters</h2>
        <p className="text-sm text-slate-300/70">
          Sculpt the dataset. All filters hit live Neon data via the Go API.
        </p>
      </div>

      <div className="space-y-5">
        <label className="block">
          <span className="text-xs uppercase tracking-wider text-slate-400">Search context</span>
          <div className="relative mt-2">
            <motion.div
              className="absolute inset-0 rounded-2xl bg-gradient-to-br from-teal-400/20 to-sky-500/10 blur"
              initial={{ opacity: 0 }}
              animate={{ opacity: filters.search ? 1 : 0.3 }}
              transition={{ duration: 0.4 }}
            />
            <input
              type="text"
              placeholder="Tournament / Player"
              value={filters.search}
              onChange={handleInput('search')}
              className="relative w-full rounded-2xl bg-slate-900/70 border border-slate-700/60 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400/60"
            />
          </div>
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Field label="Surface" description="Court conditions">
            <select
              value={filters.surface}
              onChange={handleInput('surface')}
              className="w-full rounded-2xl bg-slate-900/70 border border-slate-800 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-400/40"
            >
              {surfaces.map((surface) => (
                <option value={surface} key={surface || 'all'}>
                  {surface || 'All surfaces'}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Tournament" description="Specific tournament">
            <select
              value={filters.tournament}
              onChange={handleInput('tournament')}
              className="w-full rounded-2xl bg-slate-900/70 border border-slate-800 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-400/40"
            >
              {tournaments.map((tournament) => (
                <option value={tournament} key={tournament || 'all'}>
                  {tournament || 'All tournaments'}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Learning phase" description="Model maturity">
            <select
              value={filters.learningPhase}
              onChange={handleInput('learningPhase')}
              className="w-full rounded-2xl bg-slate-900/70 border border-slate-800 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400/40"
            >
              {learningPhases.map((phase) => (
                <option value={phase} key={phase || 'all'}>
                  {phase ? phase.replaceAll('_', ' ') : 'All phases'}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Action" description="Recommended call">
            <select
              value={filters.recommendedAction}
              onChange={handleInput('recommendedAction')}
              className="w-full rounded-2xl bg-slate-900/70 border border-slate-800 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400/40"
            >
              {actions.map((action) => (
                <option value={action} key={action || 'all'}>
                  {action || 'All actions'}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Field label="Confidence min" description="0-100">
            <input
              type="number"
              value={filters.minConfidence}
              onChange={handleInput('minConfidence')}
              className="w-full rounded-2xl bg-slate-900/70 border border-slate-800 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400/40"
              min={0}
              max={100}
            />
          </Field>
          <Field label="Confidence max" description="0-100">
            <input
              type="number"
              value={filters.maxConfidence}
              onChange={handleInput('maxConfidence')}
              className="w-full rounded-2xl bg-slate-900/70 border border-slate-800 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400/40"
              min={0}
              max={100}
            />
          </Field>
          <Field label="Date from" description="Start date">
            <input
              type="date"
              value={filters.dateFrom}
              onChange={handleInput('dateFrom')}
              className="w-full rounded-2xl bg-slate-900/70 border border-slate-800 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/40"
            />
          </Field>
          <Field label="Date to" description="End date">
            <input
              type="date"
              value={filters.dateTo}
              onChange={handleInput('dateTo')}
              className="w-full rounded-2xl bg-slate-900/70 border border-slate-800 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/40"
            />
          </Field>
        </div>

        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <Field label="Sort by" description="Sort criteria">
              <select
                value={filters.sortBy}
                onChange={handleInput('sortBy')}
                className="w-full rounded-2xl bg-slate-900/70 border border-slate-800 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400/40"
              >
                {sortOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </Field>
          </div>
          <button
            onClick={() => onChange({ sortDir: filters.sortDir === 'DESC' ? 'ASC' : 'DESC' })}
            className="uiverse-pill text-xs uppercase px-4 py-3"
            type="button"
          >
            {filters.sortDir === 'DESC' ? 'Newest' : 'Oldest'}
          </button>
        </div>

        <div className="space-y-4">
          <ToggleCard
            label="Only correct predictions"
            active={isPredictionCorrect}
            onToggle={() => toggleValue('predictionCorrect')}
          />
          <ToggleCard
            label="Show value bets"
            active={isValueBet}
            onToggle={() => toggleValue('valueBet')}
          />
        </div>
      </div>

      <motion.button
        type="button"
        className="uiverse-button w-full justify-center"
        onClick={clearFilters}
        disabled={loading}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
      >
        Reset filters
      </motion.button>
    </div>
  )
}

function Field({ label, description, children }) {
  return (
    <label className="space-y-2 block">
      <div>
        <span className="block text-xs uppercase tracking-widest text-slate-500">{label}</span>
        {description && (
          <span className="block text-xs text-slate-400/70">{description}</span>
        )}
      </div>
      {children}
    </label>
  )
}

function ToggleCard({ label, active, onToggle }) {
  return (
    <motion.button
      type="button"
      onClick={onToggle}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      className={`w-full flex items-center justify-between rounded-2xl border px-4 py-3 transition-colors ${
        active ? 'border-teal-400/70 bg-teal-500/10' : 'border-slate-800 bg-slate-900/60'
      }`}
    >
      <span className="text-sm font-medium text-slate-200">{label}</span>
      <span className="uiverse-switch">
        <input type="checkbox" checked={active} readOnly />
        <span className="uiverse-switch-ball" />
      </span>
    </motion.button>
  )
}
