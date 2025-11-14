# Documentation Index

**Last Updated**: November 12, 2025  
**Project Status**: ✅ Production Ready

## Quick Navigation

### For First-Time Users
1. Start with **README.md** - Overview and quick start (6.6 KB)
2. Then read **DEPLOYMENT.md** - How to deploy (9.4 KB)
3. Refer to **STATUS.md** - Current project status (10 KB)

### For System Operators
1. Review **STATUS.md** - Current status and monitoring
2. Consult **DEPLOYMENT.md** - Operational procedures section
3. Reference **ARCHITECTURE.md** - System design details

### For Developers
1. Start with **ARCHITECTURE.md** - System design and flow (11 KB)
2. Review **README.md** - Feature overview and tool definitions
3. Check **DEPLOYMENT.md** - Development vs production

---

## Documentation Files

### 1. README.md (6.6 KB) ✨ Start Here
**Purpose**: Feature overview, quick start guide, example conversations

**Contents**:
- Project status and features
- Quick start (prerequisites, installation, configuration)
- Example conversations with the agent
- Available tools reference
- Architecture diagram
- Troubleshooting guide
- Environment variables
- Security notes
- Future enhancements

**Audience**: End users, new developers, anyone learning about the project

**Key Sections**:
- Features overview with emoji indicators
- Natural language query examples
- Database tools reference
- LLM analysis capabilities
- Live update features
- Agentic architecture explanation

---

### 2. DEPLOYMENT.md (9.4 KB) 🚀 Setup & Operations
**Purpose**: Complete deployment instructions for production and development

**Contents**:
- Current production setup status
- Webhook registration status
- Local development quick start
- PM2 + Nginx recommended setup (current production)
- Alternative systemd service setup
- Docker deployment option
- Environment variable configuration
- PM2 ecosystem config example
- Production best practices
- Monitoring and logging
- Troubleshooting procedures
- Backup & recovery
- Scaling considerations
- Testing & verification
- API key management

**Audience**: DevOps engineers, system administrators, deployment specialists

**Key Sections**:
- Production setup verified and operational
- Complete PM2 configuration examples
- Nginx webhook configuration with SSL
- Environment variables checklist
- Monitoring commands and procedures
- Troubleshooting flowchart
- Scaling recommendations

**Current Status**:
```
✅ Webhook Mode: Active (PM2 + Nginx)
✅ SSL Certificate: Valid until Feb 10, 2026
✅ Pending Updates: 0
✅ Last Error: None
```

---

### 3. ARCHITECTURE.md (11 KB) 🔧 Technical Design
**Purpose**: Detailed system design, component interactions, and technical specifications

**Contents**:
- System overview and status
- Technology stack
- Architecture layers diagram
- Request flow (4 stages)
- Tool definitions (4 tools with examples)
- Data type handling (critical for odds conversion)
- Deployment configuration details
- Model versions (latest November 2025)
- Testing results and verification
- Performance characteristics
- Security features and assessment
- Files reference and locations
- Key fixes applied (model updates, bug fixes)
- Agentic loop architecture explanation
- Monitoring and maintenance
- Deployment timeline
- Future enhancements roadmap

**Audience**: Architects, technical leads, developers needing deep understanding

**Key Sections**:
- Tool call flow examples
- Agentic loop explanation with pseudo-code
- Data flow diagrams
- Performance metrics
- Security considerations
- Component interaction matrix

---

### 4. STATUS.md (10 KB) 📊 Project Status Report
**Purpose**: Current operational status, testing results, and project health

**Contents**:
- Executive summary
- Deployment status matrix
- Component status checklist
- Testing results (component and workflow tests)
- Recent changes and fixes (November 12)
- Git status
- Known limitations and future enhancements
- API key status
- Performance metrics
- Error handling strategy
- Security assessment
- Operational procedures
- Documentation checklist
- Handoff checklist
- Next steps for team

**Audience**: Project managers, team leads, operational staff

**Key Sections**:
- ✅ All systems operational status
- Testing results from November 12, 2025
- 5 major fixes applied with before/after
- API key status validation
- Performance metrics and benchmarks
- Security audit results

**Recent Updates**:
1. Perplexity model: pplx-70b-online → sonar
2. Claude model: claude-3-5-sonnet → claude-sonnet-4
3. Data types: Added parseFloat() for odds
4. Environment: Added dotenv configuration

---

### 5. QUICK_START.md (4.5 KB) ⚡ Fast Setup
**Purpose**: Quick start guide for local development

**Contents**:
- Quick command checklist
- Local development setup
- Environment configuration
- Running the bot
- Testing the bot
- Example queries
- Troubleshooting quick fixes

**Audience**: Developers wanting to get started quickly

---

### 6. DEPLOYMENT_STEPS.md (6.6 KB) 📋 Step-by-Step Setup
**Purpose**: Detailed step-by-step deployment procedures

**Contents**:
- Prerequisites
- Installation steps
- Configuration steps
- Activation procedures
- Verification steps
- Troubleshooting guide

**Audience**: Operators following procedures, automation scripts

---

## Key Information At a Glance

### Production Status
- **Deployed**: ✅ Yes (November 12, 2025)
- **Domain**: telegram.curak.xyz
- **SSL Certificate**: Valid until Feb 10, 2026
- **Process Manager**: PM2
- **Memory Usage**: 27.4 MB
- **Status**: Online and healthy

### Technology Stack
- Node.js 25.1.0
- Express.js (webhook server)
- PostgreSQL (Neon)
- Claude Sonnet 4 (Nov 2025 version)
- Perplexity sonar model
- Nginx reverse proxy
- PM2 process management

### Recent Changes (Nov 12, 2025)
1. ✅ Updated Perplexity model to `sonar`
2. ✅ Updated Claude to `claude-sonnet-4-20250514`
3. ✅ Fixed odds data type handling
4. ✅ Configured environment variables properly
5. ✅ Verified all components working

### Testing Status
- ✅ Database connectivity verified
- ✅ Claude API verified
- ✅ Perplexity API verified
- ✅ Webhook registration verified
- ✅ End-to-end agent workflow verified

---

## Common Tasks & Where to Find Them

| Task | Document | Section |
|------|----------|---------|
| Deploy for first time | DEPLOYMENT.md | PM2 + Nginx setup |
| Check bot status | STATUS.md | Operational Procedures |
| Add new feature | ARCHITECTURE.md | Tool Definitions |
| Troubleshoot issue | DEPLOYMENT.md | Troubleshooting |
| Understand flow | ARCHITECTURE.md | Architecture Overview |
| Monitor system | STATUS.md | Monitoring Checklist |
| Update models | README.md | Environment Variables |
| Scale the bot | DEPLOYMENT.md | Scaling section |
| Get quick overview | STATUS.md | Executive Summary |

---

## Document Statistics

| Document | Size | Lines | Purpose |
|----------|------|-------|---------|
| README.md | 6.6 KB | 255 | Features & Quick Start |
| DEPLOYMENT.md | 9.4 KB | 458 | Setup & Operations |
| ARCHITECTURE.md | 11 KB | 252 | Technical Design |
| STATUS.md | 10 KB | 302 | Project Status |
| QUICK_START.md | 4.5 KB | 150 | Fast Setup |
| DEPLOYMENT_STEPS.md | 6.6 KB | 260 | Step-by-Step |
| **TOTAL** | **~48 KB** | **~1,677** | **Complete Documentation** |

---

## How to Use This Documentation

### As a New Developer
1. Read README.md (overview)
2. Read ARCHITECTURE.md (technical design)
3. Read DEPLOYMENT.md (how to run locally)
4. Try the quick start examples

### As an Operations Engineer
1. Read STATUS.md (current state)
2. Read DEPLOYMENT.md (procedures section)
3. Set up monitoring with provided commands
4. Review troubleshooting section

### As a Manager
1. Read STATUS.md (executive summary)
2. Review project health checklist
3. Check recent changes and fixes
4. Review next steps and enhancements

### As Someone Troubleshooting
1. Check STATUS.md (known issues)
2. Go to DEPLOYMENT.md (troubleshooting section)
3. Review ARCHITECTURE.md (system design to understand issue)
4. Check error logs via PM2

---

## Keeping Documentation Updated

The documentation was last updated on **November 12, 2025** to reflect:
- ✅ Production deployment
- ✅ Latest model versions
- ✅ All fixes and changes applied
- ✅ Complete testing results
- ✅ Comprehensive deployment procedures

**When to update docs**:
- After deploying to production
- After updating model versions
- After adding new features
- After major bug fixes
- After security updates

---

## Quick Reference

### Essential URLs
- **Webhook**: https://telegram.curak.xyz/webhook
- **Health Check**: https://telegram.curak.xyz/health
- **Telegram Bot Token**: (configured in .env)

### Essential Files
- **Main Bot**: telegram-bot-webhook.js (406 lines)
- **Config**: ecosystem.config.js (PM2)
- **Environment**: .env (git-ignored)
- **Logs**: /var/log/pm2/tennis-telegram-agent-{out,err}-6.log

### Essential Commands
```bash
# Check status
pm2 status

# View logs
pm2 logs tennis-telegram-agent

# Restart
pm2 restart tennis-telegram-agent --update-env

# Health check
curl https://telegram.curak.xyz/health
```

---

**Documentation maintained by**: Development Team  
**Last reviewed**: November 12, 2025  
**Status**: ✅ Complete and Current
