# Deployment Guide

**Status**: ✅ Production Deployed & Operational (November 12, 2025)

## Current Production Setup

### Deployment Method: Webhook Mode with PM2 + Nginx

- **Server**: VPS (curak.xyz)
- **Process Manager**: PM2
- **Reverse Proxy**: Nginx
- **Domain**: telegram.curak.xyz
- **Port**: 3004 (internal) / 443 (external via HTTPS)
- **Status**: Online - PID 1195600, Memory 27.4MB

### Webhook Registration Status
```
✅ Webhook URL: https://telegram.curak.xyz/webhook
✅ SSL Certificate: Valid until February 10, 2026
✅ Pending Updates: 0
✅ Last Error: None
```

## Local Development

### Quick Start
```bash
cd telegram-agent
npm install
cp .env.example .env
# Edit .env with your credentials
npm run dev
```

The bot will start with logging enabled. Press `Ctrl+C` to stop.

## Production Deployment

### Recommended: PM2 + Nginx (Current Setup ✅)

#### Prerequisites
- Node.js 18+ installed
- Nginx configured for reverse proxy
- SSL certificate (Let's Encrypt recommended)
- PostgreSQL database accessible
- Valid API keys (Anthropic, Telegram, Perplexity)

#### Installation Steps

1. **Clone/Copy project**:
```bash
cd /opt/tennis-scraper
git clone <repo> telegram-agent
cd telegram-agent
npm install
```

2. **Configure environment**:
```bash
cp .env.example .env
nano .env  # Edit with your API keys
```

3. **Setup PM2**:
```bash
# Install PM2 globally
sudo npm install -g pm2

# Start bot with ecosystem config
pm2 start ecosystem.config.js

# Save PM2 startup config
pm2 startup
pm2 save

# View status
pm2 status
pm2 logs tennis-telegram-agent
```

4. **Configure Nginx**:
```bash
sudo nano /etc/nginx/sites-available/curak.xyz
```

Add webhook block:
```nginx
server {
    listen 443 ssl http2;
    server_name telegram.curak.xyz;

    ssl_certificate /etc/letsencrypt/live/telegram.curak.xyz/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/telegram.curak.xyz/privkey.pem;

    location /webhook {
        proxy_pass http://127.0.0.1:3004;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 30s;
        proxy_read_timeout 30s;
    }

    location /health {
        proxy_pass http://127.0.0.1:3004;
    }
}

# HTTP redirect
server {
    listen 80;
    server_name telegram.curak.xyz;
    return 301 https://$server_name$request_uri;
}
```

5. **Setup SSL certificate**:
```bash
# Using Let's Encrypt / Certbot
sudo certbot certonly --nginx -d telegram.curak.xyz

# Auto-renewal check
sudo certbot renew --dry-run
```

6. **Verify deployment**:
```bash
# Check health endpoint
curl https://telegram.curak.xyz/health

# Check PM2 status
pm2 status

# Check logs
pm2 logs tennis-telegram-agent --lines 50

# Check webhook status
curl -s https://api.telegram.org/bot$(cat .env | grep TELEGRAM_BOT_TOKEN | cut -d= -f2)/getWebhookInfo | jq .
```

### Alternative: systemd Service

If you prefer systemd over PM2:

1. Create systemd service file:
```bash
sudo nano /etc/systemd/system/tennis-telegram-bot.service
```

Add:
```ini
[Unit]
Description=Tennis Telegram AI Agent
After=network.target

[Service]
Type=simple
User=tennis
WorkingDirectory=/opt/tennis-scraper/telegram-agent
EnvironmentFile=/opt/tennis-scraper/telegram-agent/.env
ExecStart=/usr/bin/node telegram-bot-webhook.js
Restart=always
RestartSec=10
StandardOutput=append:/var/log/tennis-telegram-bot.log
StandardError=append:/var/log/tennis-telegram-bot.log

[Install]
WantedBy=multi-user.target
```

2. Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable tennis-telegram-bot
sudo systemctl start tennis-telegram-bot

# Check status
sudo systemctl status tennis-telegram-bot

# View logs
sudo tail -f /var/log/tennis-telegram-bot.log
```

### Option 2: Docker Deployment

Create `Dockerfile`:
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

CMD ["node", "telegram-bot-webhook.js"]
```

Create `docker-compose.yml`:
```yaml
version: '3.8'

services:
  tennis-telegram-bot:
    build: .
    restart: always
    environment:
      - TELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN}
      - DATABASE_URL=${DATABASE_URL}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - PERPLEXITY_API_KEY=${PERPLEXITY_API_KEY}
      - GOOGLE_API_KEY=${GOOGLE_API_KEY}
      - NODE_ENV=production
      - PORT=3004
      - WEBHOOK_URL=https://telegram.curak.xyz/webhook
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

Deploy:
```bash
# Copy .env to server
scp .env user@server:/path/to/telegram-agent/

# On server
docker-compose up -d

# View logs
docker-compose logs -f
```

## Configuration

### Environment Variables

Create `.env` file in project root:
```bash
TELEGRAM_BOT_TOKEN=123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11
DATABASE_URL=postgresql://user:password@db.neon.tech:5432/tennis_db
ANTHROPIC_API_KEY=sk-ant-v0-xxxxxxxxxxxxx
PERPLEXITY_API_KEY=pplx-xxxxxxxxxxxxx
GOOGLE_API_KEY=AIzaSy...
NODE_ENV=production
PORT=3004
WEBHOOK_URL=https://telegram.curak.xyz/webhook
TELEGRAM_CHAT_ID=your_chat_id_for_testing
```

### PM2 Ecosystem Configuration

`ecosystem.config.js`:
```javascript
module.exports = {
  apps: [
    {
      name: 'tennis-telegram-agent',
      script: './telegram-bot-webhook.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3004,
      },
      error_file: '/var/log/pm2/tennis-telegram-agent-err.log',
      out_file: '/var/log/pm2/tennis-telegram-agent-out.log',
      max_memory_restart: '200M',
      restart_delay: 5000,
    },
  ],
};
```

## Production Best Practices

1. **Use strong database passwords**
   - Generate random 20+ character passwords
   - Store in secure vault

2. **Rotate API keys regularly**
   - Delete old keys after rotation
   - Log key rotations

3. **Enable database backups**
   - Neon provides daily backups
   - Test recovery procedures

4. **Monitor bot health**
   - Set up error logging
   - Monitor API usage
   - Track response times

5. **Rate limiting**
   - Consider adding per-user rate limits
   - Prevent token abuse

## Monitoring

### Check bot status
```bash
# If using PM2
pm2 status
pm2 logs tennis-telegram-agent

# If using Docker
docker-compose ps
docker-compose logs -f

# Manual health check
curl -s https://telegram.curak.xyz/health | jq .
```

### View logs
```bash
# PM2 logs
pm2 logs tennis-telegram-agent --lines 100

# Or tail the file
tail -f /var/log/pm2/tennis-telegram-agent-out-6.log
```

## Troubleshooting

### Bot not responding
1. Check bot is running: `pm2 status` or `systemctl status tennis-telegram-bot`
2. Check API token: `curl https://api.telegram.org/bot{TOKEN}/getMe`
3. Review logs: `pm2 logs tennis-telegram-agent`

### Database connection errors
1. Test connection: `psql $DATABASE_URL -c "SELECT 1"`
2. Check IP whitelist in Neon dashboard
3. Verify credentials in `.env`

### API quota exceeded
1. Check API usage in respective dashboards
2. Upgrade plan if needed
3. Implement caching to reduce requests

### Memory/CPU issues
1. Monitor with: `top` or `htop`
2. Check for memory leaks in logs
3. Restart service if needed: `pm2 restart tennis-telegram-agent`

## Backup & Recovery

### Database backups
```bash
# Manual backup
pg_dump $DATABASE_URL > backup.sql

# Restore
psql $DATABASE_URL < backup.sql
```

### Configuration backup
```bash
# Backup .env (KEEP SECURE!)
cp .env .env.backup
chmod 600 .env.backup
```

## Scaling

For high volume usage:

1. **Implement caching**
   - Redis for query results
   - TTL for frequently accessed data

2. **Database optimization**
   - Add indexes on frequently queried columns
   - Monitor slow queries

3. **Queue system**
   - Bull/Agenda for delayed/queued tasks
   - Handle spikes in message volume

4. **Multiple bot instances**
   - Load balance with webhook
   - Horizontal scaling

## Testing & Verification

### Run component tests
```bash
# Test database
node test_database.js

# Test Anthropic API
node test_anthropic.js

# Test Perplexity API
node test_perplexity.js

# Test agent workflow
node test_agent_workflow.js

# Check webhook status
node check_webhook.js
```

### Manual webhook test
```bash
curl -X POST "https://telegram.curak.xyz/webhook" \
  -H "Content-Type: application/json" \
  -d '{
    "update_id": 123456789,
    "message": {
      "message_id": 1,
      "date": 1700000000,
      "chat": {"id": 714228621, "type": "private"},
      "from": {"id": 714228621, "is_bot": false, "first_name": "Test"},
      "text": "Show me today'\''s predictions"
    }
  }'
```

## API Key Management

### Obtaining API Keys

1. **Telegram Bot Token**
   - Open Telegram, search @BotFather
   - Send /newbot and follow prompts

2. **Anthropic API Key**
   - Visit https://console.anthropic.com
   - Create new key in API settings

3. **Perplexity API Key**
   - Visit https://www.perplexity.ai/
   - Create API key in account settings

4. **Neon Database**
   - Visit https://neon.tech
   - Create project and copy connection string

## Version Information

- Node.js: 18+
- Claude Model: claude-sonnet-4-20250514 (November 2025)
- Perplexity Model: sonar (November 2025)
- Telegram Bot API: Latest

## Support

For issues:
1. Check logs first: `pm2 logs tennis-telegram-agent`
2. Review error message in context
3. Test with minimal configuration
4. Check Telegram bot API status
5. Verify API key validity
6. Consult ARCHITECTURE.md for detailed system information
