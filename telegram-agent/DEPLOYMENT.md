# Deployment Guide

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

### Option 1: Linux Server (Recommended for 24/7)

#### Setup systemd service

1. Install dependencies globally:
```bash
sudo apt update
sudo apt install -y nodejs npm
```

2. Copy project to server:
```bash
scp -r telegram-agent user@server:/home/user/tennis-telegram-agent
ssh user@server
cd /home/user/tennis-telegram-agent
npm install
```

3. Create systemd service file:
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
WorkingDirectory=/home/tennis/tennis-telegram-agent
EnvironmentFile=/home/tennis/tennis-telegram-agent/.env
ExecStart=/usr/bin/node telegram-bot.js
Restart=always
RestartSec=10
StandardOutput=append:/var/log/tennis-telegram-bot.log
StandardError=append:/var/log/tennis-telegram-bot.log

[Install]
WantedBy=multi-user.target
```

4. Enable and start service:
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

CMD ["node", "telegram-bot.js"]
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

### Option 3: Cloud Platforms

#### Heroku (Free tier available)
```bash
heroku login
heroku create your-app-name
heroku buildpacks:set heroku/nodejs

# Set environment variables
heroku config:set TELEGRAM_BOT_TOKEN=...
heroku config:set DATABASE_URL=...
heroku config:set ANTHROPIC_API_KEY=...

# Create Procfile
echo "worker: node telegram-bot.js" > Procfile

git push heroku main
heroku logs --tail
```

#### Railway (Simple deployment)
1. Push to GitHub
2. Connect GitHub repo in Railway dashboard
3. Set environment variables
4. Deploy

#### DigitalOcean App Platform
1. Create app from GitHub repo
2. Set environment variables
3. Configure run command: `node telegram-bot.js`
4. Deploy

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
```

### Production Best Practices

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

### Monitoring

#### Check bot status
```bash
# If using systemd
sudo systemctl status tennis-telegram-bot

# If using Docker
docker-compose ps
docker-compose logs -f

# Manual check
curl -s https://api.telegram.org/bot{TOKEN}/getMe
```

#### Log aggregation
Consider using:
- ELK Stack (Elasticsearch, Logstash, Kibana)
- Splunk
- DataDog
- New Relic

## Troubleshooting

### Bot not responding
1. Check bot is running: `systemctl status tennis-telegram-bot`
2. Check API token: `curl https://api.telegram.org/bot{TOKEN}/getMe`
3. Review logs: `journalctl -u tennis-telegram-bot -f`

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
3. Restart service if needed: `systemctl restart tennis-telegram-bot`

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
   - Load balance with webhook instead of polling
   - Horizontal scaling

## Webhooks (Advanced)

For better performance than polling:

```javascript
// Use webhooks instead of polling
const express = require('express');
const app = express();

app.post('/webhook/:token', (req, res) => {
  const msg = req.body.message;
  if (msg) {
    processMessage(msg.chat.id, msg.text);
  }
  res.sendStatus(200);
});

app.listen(3000);

// Register webhook with Telegram
// curl -F "url=https://yourdomain.com/webhook/TOKEN" https://api.telegram.org/botTOKEN/setWebhook
```

## Support

For issues:
1. Check logs first
2. Review error message in context
3. Test with minimal configuration
4. Check Telegram bot API status
5. Verify API key validity
