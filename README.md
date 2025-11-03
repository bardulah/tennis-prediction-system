# Tennis AI Prediction System

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen.svg)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17+-blue.svg)](https://postgresql.org/)

An AI-powered tennis match prediction system that combines web scraping, machine learning, and continuous learning to generate intelligent betting predictions with confidence scoring.

## 🚀 Features

- **AI-Powered Predictions**: OpenAI/Gemini integration for sophisticated match analysis
- **Continuous Learning**: Self-improving system with pattern discovery and accuracy tracking
- **Real-Time Data**: Automated web scraping from Flashscore.com
- **Vector Similarity**: Pinecone-powered historical match pattern matching
- **Multi-Stage Learning**: Phase-based confidence calibration (60% → 75% → 100%)
- **Comprehensive Analytics**: Detailed accuracy tracking and performance metrics
- **Automated Workflows**: n8n orchestration for seamless prediction and validation cycles

## 🏗️ Architecture

This system operates in two main workflows:

### Morning Workflow (AI Predictions)
1. **Data Collection**: Scrape today's matches without scores
2. **AI Analysis**: Generate predictions using LLM with historical context
3. **Database Storage**: Store predictions with confidence scoring
4. **Notifications**: Telegram alerts with top predictions

### Evening Workflow (Results & Learning)
1. **Data Collection**: Scrape yesterday's completed matches
2. **Prediction Validation**: Match results against AI predictions
3. **Learning Analysis**: Extract patterns from failed predictions
4. **Pattern Storage**: Upload insights to vector database for future matching

## 🛠️ Technology Stack

### Core Components
- **Web Scraping**: Node.js + Puppeteer
- **AI Processing**: OpenAI/Gemini via n8n workflows
- **Database**: PostgreSQL (via Neon)
- **Vector Database**: Pinecone for similarity search
- **Workflow Automation**: n8n
- **Dashboard**: Go backend + React frontend

### Data Flow
```
Flashscore.com → Scraping → n8n Workflows → AI Analysis → Database → Dashboard
                                    ↓
                              Pattern Discovery → Vector Storage → Future Predictions
```

## 📁 Project Structure

```
tennis-prediction-system/
├── README.md
├── LICENSE
├── docs/
│   ├── ARCHITECTURE.md          # Detailed system architecture
│   ├── API_DOCUMENTATION.md     # API endpoints and usage
│   ├── DEPLOYMENT_GUIDE.md      # Deployment instructions
│   └── TROUBLESHOOTING.md       # Common issues and solutions
├── workflows/
│   ├── morning-workflow.json    # n8n morning prediction workflow
│   └── evening-workflow.json    # n8n evening validation workflow
├── scraping/
│   ├── scrape-with-date.js      # Main scraping script
│   ├── run-morning-scrape.sh    # Morning automation script
│   └── run-evening-scrape.sh    # Evening automation script
├── database/
│   ├── schema.sql               # Database schema
│   ├── fix_nationality.sql      # Data cleanup scripts
│   └── migrations/              # Version migrations
├── dashboard/
│   ├── backend/                 # Go backend service
│   └── frontend/                # React frontend
├── config/
│   ├── .env.example            # Environment variables template
│   └── nginx.conf              # Web server configuration
├── scripts/
│   ├── setup.sh                # Initial setup script
│   ├── test-data.sql           # Sample test data
│   └── backup.sh               # Database backup utility
├── tests/
│   ├── unit/                   # Unit tests
│   ├── integration/            # Integration tests
│   └── e2e/                    # End-to-end tests
└── docs/
    ├── ALL_PROMPTS.md          # AI prompts used in workflows
    └── DATABASE_FIXES.md       # Database issue fixes
```

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- PostgreSQL 17+
- n8n workflow platform
- Neon/Supabase account for hosted PostgreSQL
- OpenAI API key
- Pinecone account for vector database

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/your-username/tennis-prediction-system.git
cd tennis-prediction-system
```

2. **Install dependencies**
```bash
npm install
cd dashboard/backend && go mod download
cd ../frontend && npm install
```

3. **Setup environment variables**
```bash
cp config/.env.example .env
# Edit .env with your API keys and database URLs
```

4. **Initialize database**
```bash
psql -h your-db-host -U your-username -d your-database < database/schema.sql
```

5. **Import n8n workflows**
- Import `workflows/morning-workflow.json` to your n8n instance
- Import `workflows/evening-workflow.json` to your n8n instance

6. **Start the system**
```bash
# Start web scrapers
./scraping/run-morning-scrape.sh
./scraping/run-evening-scrape.sh

# Start dashboard (in separate terminals)
cd dashboard/backend && ./tennis-dashboard
cd dashboard/frontend && npm run dev
```

## 📊 Database Schema

### Core Tables
- `players`: Player profiles with statistics and nationality
- `predictions`: AI-generated predictions with confidence scores
- `matches`: Historical match data with results
- `player_insights`: Discovered player-specific patterns
- `learning_log`: System learning and pattern discovery
- `system_metadata`: System health and accuracy tracking

### Key Relationships
```
players ←→ predictions ←→ matches
    ↓         ↓            ↓
player_insights → learning_log → system_metadata
```

## 🤖 AI Workflows

### Morning Prediction Workflow
- **Input**: Raw match data from web scraping
- **Processing**: Historical stats + AI analysis + pattern matching
- **Output**: Structured predictions with confidence scores
- **Integration**: PostgreSQL + Pinecone + Learning insights

### Evening Validation Workflow
- **Input**: Completed match results
- **Processing**: Prediction accuracy analysis + pattern discovery
- **Output**: Learning insights + system accuracy updates
- **Integration**: Player insights + vector storage + metadata updates

## 📈 Monitoring & Analytics

### Key Metrics
- **Prediction Accuracy**: Overall and by confidence level
- **Learning Progression**: Phase advancement and pattern discovery
- **Data Quality**: Player profile completeness and match coverage
- **System Health**: API response times and error rates

### Dashboard Features
- Real-time prediction accuracy tracking
- Player performance analytics
- Learning insights visualization
- System health monitoring

## 🔧 Configuration

### Environment Variables
```bash
# Database
DATABASE_URL=postgresql://...
NEON_DATABASE_URL=postgresql://...

# AI Services
OPENAI_API_KEY=sk-...
PINECONE_API_KEY=pcn...

# n8n Webhooks
MORNING_WEBHOOK_URL=https://your-n8n.com/webhook/tennis-predictions
EVENING_WEBHOOK_URL=https://your-n8n.com/webhook/tennis-results

# Notifications
TELEGRAM_BOT_TOKEN=...
TELEGRAM_CHAT_ID=...
```

### n8n Configuration
- Configure webhook URLs in workflow files
- Set up PostgreSQL connection credentials
- Configure OpenAI/Gemini API credentials
- Set Pinecone vector database connection

## 🧪 Testing

### Run Test Suite
```bash
# Unit tests
npm test

# Integration tests  
npm run test:integration

# End-to-end tests
npm run test:e2e

# Database tests
npm run test:db
```

### Sample Data
```bash
# Load test data
psql -d tennis_predictions < scripts/test-data.sql
```

## 🚀 Deployment

### Production Setup
1. **Database**: Use managed PostgreSQL (Neon, Supabase, RDS)
2. **Hosting**: Deploy n8n on cloud platform (Railway, DigitalOcean)
3. **Scraping**: Set up cron jobs on VPS or use cloud functions
4. **Dashboard**: Deploy frontend on Vercel/Netlify, backend on Railway/Render

### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up -d
```

## 🔍 Troubleshooting

### Common Issues
1. **Web Scraping Failures**: Check Flashscore.com structure changes
2. **AI API Limits**: Monitor OpenAI/Gemini usage and rate limits
3. **Database Connection**: Verify Neon/PostgreSQL connectivity
4. **n8n Workflow Errors**: Check webhook configurations and API credentials

### Debug Mode
```bash
# Enable debug logging
DEBUG=tennis:* npm run dev

# Database debugging
psql -c "SELECT * FROM system_metadata WHERE id = 1;"
```

## 📚 Documentation

- **[Architecture Guide](docs/ARCHITECTURE.md)**: Detailed system architecture and data flow
- **[API Documentation](docs/API_DOCUMENTATION.md)**: REST API endpoints and usage
- **[Deployment Guide](docs/DEPLOYMENT_GUIDE.md)**: Step-by-step deployment instructions
- **[AI Prompts](docs/ALL_PROMPTS.md)**: Complete list of prompts used in workflows
- **[Database Fixes](docs/DATABASE_FIXES.md)**: Known issues and their solutions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow existing code style and conventions
- Add tests for new features
- Update documentation for API changes
- Ensure all tests pass before submitting PR

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Flashscore.com** for providing comprehensive tennis data
- **OpenAI/Gemini** for powerful language model capabilities
- **n8n** for workflow automation platform
- **Neon** for serverless PostgreSQL hosting
- **Pinecone** for vector similarity search

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/your-username/tennis-prediction-system/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/tennis-prediction-system/discussions)
- **Email**: your-email@example.com

---

**Built with ❤️ for tennis analytics and prediction enthusiasts**
