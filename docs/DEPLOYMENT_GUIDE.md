# Deployment Guide

This guide covers deploying the Tennis Prediction System in production environments.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Database Setup](#database-setup)
- [n8n Workflow Deployment](#n8n-workflow-deployment)
- [Scraping Service Deployment](#scraping-service-deployment)
- [Dashboard Deployment](#dashboard-deployment)
- [Monitoring & Maintenance](#monitoring--maintenance)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Services
- **PostgreSQL 17+** (recommend Neon.io or Supabase for managed hosting)
- **n8n Workflow Platform** (self-hosted or cloud)
- **OpenAI API** or **Gemini API** access
- **Pinecone Vector Database** account
- **Telegram Bot** for notifications (optional)

### Server Requirements
- **Minimum**: 2 CPU cores, 4GB RAM, 20GB storage
- **Recommended**: 4 CPU cores, 8GB RAM, 50GB+ storage
- **OS**: Ubuntu 20.04+ or similar Linux distribution

## Environment Setup

### 1. Server Preparation
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y curl wget git nodejs npm postgresql-client

# Install Go (for dashboard backend)
wget https://go.dev/dl/go1.21.linux-amd64.tar.gz
sudo tar -C /usr/local -xzf go1.21.linux-amd64.tar.gz
echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
source ~/.bashrc

# Install PM2 for process management
npm install -g pm2
```

### 2. Application Deployment
```bash
# Clone repository
git clone https://github.com/your-username/tennis-prediction-system.git
cd tennis-prediction-system

# Run setup script
./scripts/setup.sh

# Create production environment
cp config/.env.example .env.production
# Edit .env.production with production values
```

### 3. Environment Variables Configuration
```bash
# Required production variables
DATABASE_URL=postgresql://username:password@host:5432/database
OPENAI_API_KEY=sk-your-production-openai-key
PINECONE_API_KEY=pcn-your-pinecone-key
PINECONE_ENVIRONMENT=your-production-environment

# Webhook URLs for your n8n instance
MORNING_WEBHOOK_URL=https://your-n8n.com/webhook/tennis-predictions
EVENING_WEBHOOK_URL=https://your-n8n.com/webhook/tennis-results

# Production settings
NODE_ENV=production
LOG_LEVEL=warn
```

## Database Setup

### Option 1: Managed PostgreSQL (Recommended)

#### Using Neon.io
1. Create account at [neon.io](https://neon.io)
2. Create new project
3. Note connection string from dashboard
4. Update `DATABASE_URL` in environment file

#### Using Supabase
1. Create account at [supabase.com](https://supabase.com)
2. Create new project
3. Use connection string from Settings > Database
4. Update `DATABASE_URL` in environment file

### Option 2: Self-Hosted PostgreSQL
```bash
# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Configure PostgreSQL
sudo -u postgres psql
CREATE DATABASE tennis_predictions;
CREATE USER tennis_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE tennis_predictions TO tennis_user;
\q

# Run schema
psql -h localhost -U tennis_user -d tennis_predictions -f database/schema.sql
```

### Database Migration
```bash
# Run any pending migrations
psql "$DATABASE_URL" -f database/migrations/latest.sql
```

## n8n Workflow Deployment

### 1. n8n Installation
```bash
# Install n8n globally
npm install -g n8n

# Start n8n
n8n start
```

### 2. Import Workflows
1. Open n8n web interface (default: http://localhost:5678)
2. Go to Workflows > Import from File
3. Import `workflows/morning-workflow.json`
4. Import `workflows/evening-workflow.json`

### 3. Configure Credentials
#### PostgreSQL Credential
- Host: your-database-host
- Database: your-database-name  
- User: your-username
- Password: your-password
- Port: 5432

#### OpenAI/Gemini Credential
- API Key: your-openai-api-key

#### Pinecone Credential
- API Key: your-pinecone-api-key
- Environment: your-pinecone-environment

### 4. Configure Webhooks
- Set webhook URLs in both workflows
- Test webhook endpoints
- Note webhook IDs for configuration

## Scraping Service Deployment

### 1. Create Systemd Service
```bash
sudo tee /etc/systemd/system/tennis-scraper.service > /dev/null <<EOF
[Unit]
Description=Tennis Scraper Service
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=/path/to/tennis-prediction-system
Environment=NODE_ENV=production
EnvironmentFile=/path/to/.env.production
ExecStart=/usr/bin/node scraping/scrape-with-date.js --today
Restart=always
RestartSec=30

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable tennis-scraper.service
```

### 2. Create Cron Jobs
```bash
# Edit crontab
crontab -e

# Add cron jobs
# Morning scrape at 6 AM
0 6 * * * cd /path/to/tennis-prediction-system && ./scraping/run-morning-scrape.sh

# Evening scrape at 6 PM  
0 18 * * * cd /path/to/tennis-prediction-system && ./scraping/run-evening-scrape.sh
```

### 3. Service Management
```bash
# Start services
sudo systemctl start tennis-scraper.service
sudo systemctl status tennis-scraper.service

# View logs
sudo journalctl -u tennis-scraper.service -f
```

## Dashboard Deployment

### 1. Backend Deployment (Go)

#### Option A: Systemd Service
```bash
sudo tee /etc/systemd/system/tennis-dashboard.service > /dev/null <<EOF
[Unit]
Description=Tennis Dashboard Backend
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=/path/to/tennis-prediction-system/dashboard/backend
Environment=DATABASE_URL=$DATABASE_URL
ExecStart=/path/to/tennis-prediction-system/dashboard/backend/tennis-dashboard
Restart=always
RestartSec=30

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable tennis-dashboard.service
sudo systemctl start tennis-dashboard.service
```

#### Option B: PM2 Process Manager
```bash
cd dashboard/backend
pm2 start tennis-dashboard --name "tennis-dashboard"
pm2 save
pm2 startup
```

### 2. Frontend Deployment (React)

#### Build and Deploy
```bash
cd dashboard/frontend
npm run build

# Deploy dist/ folder to your web server
# Or use Docker for containerized deployment
```

#### Docker Deployment
```dockerfile
# Create Dockerfile in dashboard/frontend
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

```bash
# Build and run
docker build -t tennis-dashboard-frontend .
docker run -p 80:80 tennis-dashboard-frontend
```

## Monitoring & Maintenance

### 1. Log Management
```bash
# Setup log rotation
sudo tee /etc/logrotate.d/tennis-prediction > /dev/null <<EOF
/path/to/tennis-prediction-system/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 $USER $USER
    postrotate
        sudo systemctl reload tennis-scraper.service
        sudo systemctl reload tennis-dashboard.service
    endscript
}
EOF
```

### 2. Health Checks
```bash
# Create health check script
cat > scripts/health-check.sh << 'EOF'
#!/bin/bash

# Check database connectivity
pg_isready -h $DATABASE_HOST -p $DATABASE_PORT -U $DATABASE_USER

# Check n8n webhook availability
curl -f $MORNING_WEBHOOK_URL/health || echo "Morning webhook unavailable"
curl -f $EVENING_WEBHOOK_URL/health || echo "Evening webhook unavailable"

# Check scraper process
systemctl is-active tennis-scraper.service
systemctl is-active tennis-dashboard.service
EOF

chmod +x scripts/health-check.sh

# Add to crontab for periodic checks
# */15 * * * * /path/to/tennis-prediction-system/scripts/health-check.sh
```

### 3. Backup Strategy
```bash
# Database backup script
cat > scripts/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/path/to/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
pg_dump "$DATABASE_URL" > "$BACKUP_DIR/tennis_db_$DATE.sql"

# Compress and cleanup old backups
gzip "$BACKUP_DIR/tennis_db_$DATE.sql"
find $BACKUP_DIR -name "tennis_db_*.sql.gz" -mtime +30 -delete

echo "Backup completed: tennis_db_$DATE.sql.gz"
EOF

chmod +x scripts/backup.sh

# Add to crontab for daily backups
# 0 2 * * * /path/to/tennis-prediction-system/scripts/backup.sh
```

## Troubleshooting

### Common Issues

#### Database Connection Errors
```bash
# Check connection
psql "$DATABASE_URL" -c "SELECT 1;"

# Check credentials
psql -h $DB_HOST -U $DB_USER -d $DB_NAME

# Test with different user
sudo -u postgres psql -c "\du"
```

#### n8n Workflow Failures
```bash
# Check n8n logs
docker logs n8n-container  # if using Docker
# or
journalctl -u n8n  # if using systemd

# Test webhook endpoints manually
curl -X POST $MORNING_WEBHOOK_URL -H "Content-Type: application/json" -d '{"test": true}'
```

#### Scraping Issues
```bash
# Test scraper manually
node scraping/scrape-with-date.js --today

# Check Flashscore accessibility
curl -I https://www.flashscore.com

# Review logs
tail -f logs/scraper.log
```

#### Dashboard Not Loading
```bash
# Check backend status
systemctl status tennis-dashboard
journalctl -u tennis-dashboard -f

# Test API endpoints
curl http://localhost:8080/health
```

### Performance Optimization

#### Database Performance
```sql
-- Analyze slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

-- Update table statistics
ANALYZE;

-- Reindex if necessary
REINDEX DATABASE tennis_predictions;
```

#### Memory Optimization
```bash
# Monitor memory usage
free -h
ps aux --sort=-%mem | head

# Adjust Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"
```

### Security Considerations

#### Firewall Configuration
```bash
# UFW setup
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable

# Only allow database from specific IPs
sudo ufw deny 5432
sudo ufw allow from YOUR_APP_SERVER_IP to any port 5432
```

#### API Rate Limiting
- Monitor OpenAI API usage to avoid rate limits
- Implement exponential backoff in n8n workflows
- Use multiple API keys if necessary

#### Database Security
- Use connection pooling
- Enable SSL connections
- Regular security updates
- Monitor for unusual access patterns

## Scaling Considerations

### Horizontal Scaling
- Multiple scraper instances for different data sources
- Load balancer for dashboard frontend
- Database read replicas for analytics

### Vertical Scaling
- Increase server resources during high-traffic periods
- Optimize database queries and indexes
- Use connection pooling

### Monitoring & Alerts
- Set up monitoring for system resources
- Alert on prediction accuracy drops
- Monitor API rate limits and failures

This deployment guide provides a comprehensive foundation for running the Tennis Prediction System in production. Adjust configurations based on your specific requirements and infrastructure.
