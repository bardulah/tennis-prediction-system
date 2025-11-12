import { useMemo, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import axios from 'axios'
import { API_BASE_URL } from '../config.js'

const actions = ['', 'bet', 'monitor', 'skip']
const sortOptions = [
  { value: 'prediction_day', label: 'Prediction Date' },
  { value: 'created_at', label: 'Created At' },
  { value: 'confidence_score', label: 'Confidence' },
  { value: 'system_accuracy_at_prediction', label: 'System Accuracy' }
]

export default function FilterPanel({ filters, onChange, loading, onReset, density = 'cozy' }) {
  const [filterOptions, setFilterOptions] = useState({
    tournaments: [''],
    surfaces: [''],
    learningPhases: ['']
  })
  const [loadingOptions, setLoadingOptions] = useState(true)

  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const { data } = await axios.get(`${API_BASE_URL}/api/filters`)
        setFilterOptions({
          tournaments: ['', ...(data.tournaments || [])],
          surfaces: ['', ...(data.surfaces || [])],
          learningPhases: ['', ...(data.learningPhases || [])]
        })
      } catch (error) {
        console.error('Failed to fetch filter options:', error)
        setFilterOptions({
          tournaments: [''],
          surfaces: ['', 'Hard', 'Clay', 'Grass', 'Carpet'],
          learningPhases: ['', 'phase1_data_collection', 'phase2_pattern_recognition', 'phase3_mature_system']
        })
      } finally {
        setLoadingOptions(false)
      }
    }

    fetchFilterOptions()
  }, [])

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
    if (onReset) {
      onReset()
      return
    }
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

  const containerClasses = density === 'compact' ? 'space-y-6 text-sm' : 'space-y-8'

  return (
    <div className={containerClasses}>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <Field label="Search">
          <div className="relative">
            <motion.div
              className="absolute inset-0 rounded-xl bg-gradient-to-br from-teal-400/15 to-sky-500/10 blur"
              initial={{ opacity: 0 }}
              animate={{ opacity: filters.search ? 1 : 0.2 }}
              transition={{ duration: 0.3 }}
            />
            <input
              type="text"
              placeholder="Player or tournament"
              value={filters.search}
              onChange={handleInput('search')}
              className="relative w-full rounded-xl bg-slate-950/70 border border-slate-800 px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-teal-400/60"
            />
          </div>
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="From">
            <input
              type="date"
              value={filters.dateFrom || ''}
              onChange={handleInput('dateFrom')}
              className="w-full rounded-xl bg-slate-950/70 border border-slate-800 px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-teal-400/60"
            />
          </Field>
          <Field label="To">
            <input
              type="date"
              value={filters.dateTo || ''}
              onChange={handleInput('dateTo')}
              className="w-full rounded-xl bg-slate-950/70 border border-slate-800 px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-teal-400/60"
            />
          </Field>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Field label="Surface">
          <select
            value={filters.surface}
            onChange={handleInput('surface')}
            disabled={loadingOptions}
            className="w-full rounded-xl bg-slate-950/70 border border-slate-800 px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-fuchsia-400/50 disabled:opacity-50"
          >
            {filterOptions.surfaces.map((surface) => (
              <option value={surface} key={surface || 'all'}>
                {surface || 'Any surface'}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Tournament">
          <select
            value={filters.tournament}
            onChange={handleInput('tournament')}
            disabled={loadingOptions}
            className="w-full rounded-xl bg-slate-950/70 border border-slate-800 px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-fuchsia-400/50 disabled:opacity-50"
          >
            {filterOptions.tournaments.map((tournament) => (
              <option value={tournament} key={tournament || 'all'}>
                {tournament || 'Any tournament'}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Learning phase">
          <select
            value={filters.learningPhase}
            onChange={handleInput('learningPhase')}
            disabled={loadingOptions}
            className="w-full rounded-xl bg-slate-950/70 border border-slate-800 px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-fuchsia-400/50 disabled:opacity-50"
          >
            {filterOptions.learningPhases.map((phase) => (
              <option value={phase} key={phase || 'all'}>
                {phase || 'Any phase'}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Field label="Action">
          <select
            value={filters.recommendedAction}
            onChange={handleInput('recommendedAction')}
            className="w-full rounded-xl bg-slate-950/70 border border-slate-800 px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-fuchsia-400/50"
          >
            {actions.map((action) => (
              <option value={action} key={action || 'all'}>
                {action || 'Any call'}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Confidence from">
          <input
            type="number"
            value={filters.minConfidence}
            onChange={handleInput('minConfidence')}
            className="w-full rounded-xl bg-slate-950/70 border border-slate-800 px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-teal-400/50"
            placeholder="0-100"
            min="0"
            max="100"
          />
        </Field>

        <Field label="Confidence to">
          <input
            type="number"
            value={filters.maxConfidence}
            onChange={handleInput('maxConfidence')}
            className="w-full rounded-xl bg-slate-950/70 border border-slate-800 px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-teal-400/50"
            placeholder="0-100"
            min="0"
            max="100"
          />
        </Field>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => onChange({ sortDir: filters.sortDir === 'DESC' ? 'ASC' : 'DESC' })}
          className="rounded-full border border-slate-700/70 px-3 py-2 text-xs uppercase tracking-widest text-slate-300 hover:border-teal-500/50 hover:text-teal-200 transition-colors"
        >
          {filters.sortDir === 'DESC' ? 'Newest first' : 'Oldest first'}
        </button>
        <div className="flex-1 min-w-[200px]">
          <Field label="Sort by">
            <select
              value={filters.sortBy}
              onChange={handleInput('sortBy')}
              className="w-full rounded-xl bg-slate-950/70 border border-slate-800 px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-teal-400/50"
            >
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </Field>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <ToggleCard
          label="Only scored winners"
          active={isPredictionCorrect}
          onToggle={() => toggleValue('predictionCorrect')}
        />
        <ToggleCard
          label="Surface value bets"
          active={isValueBet}
          onToggle={() => toggleValue('valueBet')}
        />
      </div>

      <motion.button
        type="button"
        className="w-full rounded-xl border border-slate-700/70 bg-slate-900/60 py-2.5 text-sm font-medium text-slate-100 hover:border-teal-500/50 hover:text-teal-200 transition-colors"
        onClick={clearFilters}
        disabled={loading}
        whileHover={{ scale: loading ? 1 : 1.01 }}
        whileTap={{ scale: loading ? 1 : 0.99 }}
      >
        Reset filters
      </motion.button>
    </div>
  )
}

function Field({ label, description, children }) {
  return (
    <label className="space-y-1 block">
      <span className="block text-[11px] uppercase tracking-[0.24em] text-slate-500">{label}</span>
      {description && (
        <span className="block text-xs text-slate-400/70">{description}</span>
      )}
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
      className={`w-full flex items-center justify-between rounded-xl border px-4 py-3 transition-colors ${
        active ? 'border-teal-400/70 bg-teal-500/15' : 'border-slate-800 bg-slate-950/60'
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
