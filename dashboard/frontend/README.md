# Tennis Predictions Dashboard - Enhanced Edition

A modern, responsive dashboard for monitoring tennis match predictions with AI-powered analysis and social media insights.

## 🎯 Features

### Core Features
- **Tournament Rolldowns**: Collapsible sections grouped by tournament for better organization
- **Dual View Modes**: Switch between Tournament view and classic Table view
- **Dynamic Filters**: Tournament, surface, and phase filters loaded from live data
- **Responsive Design**: Optimized for desktop and mobile with smooth animations

### AI-Powered Analysis
- **Match Analysis with Google Gemini**: Click "Analyze" on any match to get:
  - Recent form and performance analysis
  - Head-to-head history
  - Surface-specific insights
  - Playing style matchup analysis
  - Betting value assessment
  - AI-powered prediction with confidence level
- **Real-time Web Search**: Analysis uses Google's grounding with web search for up-to-date information

### Social Intelligence
- **Community Picks Section**: Displays tennis betting discussions from Reddit
  - r/sportsbook, r/tennis, r/Betting, and more
  - Confidence indicators (high/medium/low)
  - Vote counts and upvotes
  - Direct links to discussions
- **Powered by Tavily API**: Intelligent web scraping with fallback to demo data

### User Experience
- **Glass Morphism UI**: Modern, sleek design with dark theme
- **Smooth Animations**: Framer Motion for buttery transitions
- **Real-time Updates**: React Query for efficient data caching
- **Highlight Metrics**: Accuracy, Average Confidence, Value Bet percentage

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Backend API running (Go server with PostgreSQL)

### Installation

1. **Install dependencies**:
   ```bash
   cd dashboard/frontend
   npm install
   ```

2. **Configure environment variables**:
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and add your API keys:
   ```env
   VITE_API_BASE_URL=http://localhost:3001
   VITE_GOOGLE_AI_API_KEY=your_key_here
   VITE_TAVILY_API_KEY=your_key_here
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. **Build for production**:
   ```bash
   npm run build
   ```

## 🔑 API Keys Setup

### Google AI (Gemini) API Key
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add to `.env` as `VITE_GOOGLE_AI_API_KEY`

**Features enabled**: AI match analysis with web search grounding

### Tavily API Key
1. Visit [Tavily](https://tavily.com)
2. Sign up and get your API key
3. Add to `.env` as `VITE_TAVILY_API_KEY`

**Features enabled**: Live Reddit scraping for community picks
**Fallback**: Demo data shown if key not configured

## 📁 Project Structure

```
dashboard/frontend/
├── src/
│   ├── components/
│   │   ├── AIAnalysisModal.jsx      # AI analysis popup
│   │   ├── FilterPanel.jsx          # Dynamic filter controls
│   │   ├── PredictionTable.jsx      # Classic table view
│   │   ├── TournamentRolldowns.jsx  # Grouped tournament view
│   │   ├── SocialsSection.jsx       # Reddit picks section
│   │   └── TimelineRail.jsx         # Status indicator
│   ├── services/
│   │   ├── aiAnalysis.js            # Google Gemini integration
│   │   └── socialsScraper.js        # Tavily/Reddit scraping
│   ├── App.jsx                      # Main application
│   ├── main.jsx                     # React Query setup
│   └── styles.css                   # Tailwind + custom styles
├── package.json
├── vite.config.js
├── tailwind.config.js
└── .env.example
```

## 🎨 Key Components

### TournamentRolldowns
- Groups predictions by tournament
- Collapsible sections with tournament stats
- Shows avg confidence, accuracy, value bets per tournament
- "Analyze with AI" button on each match

### AIAnalysisModal
- Full-screen modal with match analysis
- Powered by Google Gemini 2.0 Flash
- Real-time web search for latest player stats
- Sources and citations displayed
- Markdown-formatted analysis

### SocialsSection
- Fetches betting discussions from Reddit
- Extracts player names and picks
- Shows confidence levels and upvotes
- Links to original threads
- Auto-refreshes every 15 minutes

### FilterPanel
- Dynamically loads tournaments from database
- Real-time filter updates
- Clear all filters button
- Shows active filter count

## 🔧 Backend Requirements

The backend API needs to support:

### Existing Endpoint
```
GET /api/predictions?page=1&pageSize=25&filters...
```

### New Endpoint (Added)
```
GET /api/filters
```
Returns:
```json
{
  "tournaments": ["Tournament 1", "Tournament 2", ...],
  "surfaces": ["Hard", "Clay", "Grass", ...],
  "learning_phases": ["phase1_data_collection", ...]
}
```

## 🎯 Usage Guide

### View Modes
- **Tournaments View** (Default): Shows predictions grouped by tournament
- **Table View**: Classic tabular layout with pagination

### AI Analysis
1. Find a match in the predictions
2. Click the "Analyze" button (with sparkle icon)
3. Wait for AI to analyze (uses web search)
4. Read comprehensive analysis with sources

### Filtering
1. Click "Show Filters" if hidden
2. Select tournament, surface, or other criteria
3. Apply confidence ranges, dates, etc.
4. Click "Reset filters" to clear all

### Social Picks
1. Expand the "Community Picks" section
2. Browse Reddit discussions
3. Click any pick to open the original thread
4. See extracted player picks and confidence

## 🚀 Performance Optimizations

- **React Query**: Caching and background refetching
- **Virtualization**: Efficient rendering of large datasets
- **Code Splitting**: Lazy loading for faster initial load
- **Debounced Filters**: Prevents excessive API calls
- **Memoization**: Optimized re-renders with useMemo

## 🎨 Styling

- **Framework**: Tailwind CSS
- **Animations**: Framer Motion
- **Theme**: Dark mode with glassmorphism
- **Icons**: Lucide React
- **Gradients**: Teal, sky, purple, pink

## 📝 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_BASE_URL` | Yes | Backend API URL |
| `VITE_GOOGLE_AI_API_KEY` | No | Google Gemini API key (for AI analysis) |
| `VITE_TAVILY_API_KEY` | No | Tavily API key (for Reddit scraping) |

## 🐛 Troubleshooting

### AI Analysis not working
- Check `VITE_GOOGLE_AI_API_KEY` is set correctly
- Verify API key has Gemini API access enabled
- Check browser console for errors

### Social picks showing demo data
- Verify `VITE_TAVILY_API_KEY` is configured
- Check Tavily API quota/limits
- Demo data will show if API fails (by design)

### Filters not loading
- Ensure backend `/api/filters` endpoint is working
- Check CORS settings on backend
- Verify database has data in predictions table

## 📦 Dependencies

- React 18.3
- React Query 5.59
- Framer Motion 11.11
- Axios 1.7
- Google Generative AI 0.21
- Lucide React (icons)
- React Markdown
- Tailwind CSS 3.4
- Vite 5.4

## 🔮 Future Enhancements

- [ ] Perplexity API integration as alternative to Gemini
- [ ] BrowserUse integration for advanced scraping
- [ ] Firecrawl API for more robust web scraping
- [ ] Export predictions to CSV/JSON
- [ ] Dark/Light mode toggle
- [ ] Customizable dashboard layout
- [ ] Real-time notifications for high-value bets
- [ ] Historical analysis charts

## 📄 License

Part of the Tennis Prediction System project.

## 🤝 Contributing

This is an experimental branch. See main project for contribution guidelines.
