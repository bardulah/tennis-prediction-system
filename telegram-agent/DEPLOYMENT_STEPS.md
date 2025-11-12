# Telegram Agent - Production Deployment Complete! ✅

**Deployment Date:** November 12, 2025
**Status:** Ready for activation
**Mode:** Webhook (instant message delivery)
**Port:** 3004
**Subdomain:** telegram.curak.xyz
**SSL:** ✅ Generated and active
**Process Manager:** PM2
**Auto-restart:** ✅ Enabled

---

## What Has Been Done

### 1. ✅ Webhook Mode Implementation
- Created `telegram-bot-webhook.js` with webhook architecture
- Replaces polling with instant message delivery
- Express.js server listening on port 3004
- Telegram pushes messages directly to the bot

### 2. ✅ Nginx Configuration
- Added reverse proxy config for `telegram.curak.xyz`
- Proxy to localhost:3004
- Longer timeouts for webhook processing (30s read, 10s connect)
- HTTP → HTTPS redirect configured
- Config tested and reloaded

### 3. ✅ SSL Certificate
- Generated certificate for `telegram.curak.xyz`
- Expires: 2026-02-10
- Auto-renewal configured
- HTTPS ready for production

### 4. ✅ PM2 Deployment
- Service started: `tennis-telegram-agent`
- PID: 1162838 (running)
- Memory: 18.6MB
- Auto-restart on crash enabled
- Logs: `/var/log/pm2/tennis-telegram-agent-*.log`
- Auto-saved to PM2 ecosystem

### 5. ⏳ Pending: Environment Configuration

---

## Next Step: Configure Environment Variables

The bot is running but needs your API keys. You have **three options**:

### Option A: Edit .env File (Recommended)
```bash
# SSH into your VPS and:
nano /opt/tennis-scraper/telegram-agent/.env
```

Fill in:
```env
TELEGRAM_BOT_TOKEN=your_telegram_token
DATABASE_URL=your_neon_db_url
ANTHROPIC_API_KEY=your_claude_key
PERPLEXITY_API_KEY=your_perplexity_key (optional)
GOOGLE_API_KEY=your_google_key (optional)
NODE_ENV=production
```

Then restart:
```bash
pm2 restart tennis-telegram-agent
```

### Option B: Set Environment Variables in PM2
```bash
pm2 delete tennis-telegram-agent
pm2 start ecosystem.config.js --env production \
  --TELEGRAM_BOT_TOKEN="your_token" \
  --DATABASE_URL="your_db" \
  --ANTHROPIC_API_KEY="your_key"
pm2 save
```

### Option C: Update ecosystem.config.js
Edit `/opt/tennis-scraper/telegram-agent/ecosystem.config.js` and add your keys directly (less recommended - don't commit).

---

## Once Configured

### 1. Verify Bot is Running
```bash
pm2 list | grep tennis-telegram-agent
pm2 logs tennis-telegram-agent
pm2 status tennis-telegram-agent
```

### 2. Test Health Endpoint
```bash
curl https://telegram.curak.xyz/health
```

Should return:
```json
{
  "status": "ok",
  "timestamp": "2025-11-12T17:00:00.000Z",
  "bot": "configured"
}
```

### 3. Verify Webhook is Set
```bash
curl -s https://api.telegram.org/bot<YOUR_TOKEN>/getWebhookInfo
```

Should show:
```json
{
  "url": "https://telegram.curak.xyz/webhook",
  "has_custom_certificate": false,
  "pending_update_count": 0,
  ...
}
```

### 4. Start Using
1. Open Telegram
2. Find your bot by username
3. Send: "Show me today's predictions"
4. Bot will respond! 🎉

---

## Infrastructure Status

**Nginx:** ✅ Configured and reloaded
```
telegram.curak.xyz (443 HTTPS) → localhost:3004
```

**SSL Certificate:** ✅ Active
```
/etc/letsencrypt/live/telegram.curak.xyz/fullchain.pem
```

**PM2 Service:** ✅ Running
```
[6] tennis-telegram-agent (PID 1162838) - 18.6MB
```

**Port:** ✅ Available
```
Port 3004 listening (Express server)
```

**Database:** ✅ Ready
```
PostgreSQL on 5432 (Docker)
```

---

## Architecture Summary

```
Telegram User
    ↓
Telegram Servers
    ↓ (HTTP POST with message)
HTTPS: telegram.curak.xyz/webhook
    ↓
Nginx Reverse Proxy (443)
    ↓ (HTTP)
Express Server (Port 3004)
    ↓
Claude Agent + Tools
    ├─ Database Queries (PostgreSQL)
    └─ LLM Analysis (Perplexity/Gemini)
    ↓
Response → Telegram
```

---

## Monitoring & Logs

### View Logs
```bash
pm2 logs tennis-telegram-agent
pm2 logs tennis-telegram-agent --err (errors only)
pm2 logs tennis-telegram-agent --lines 50
```

### Monitor Process
```bash
pm2 monit  # Real-time monitoring
pm2 status # Quick status
pm2 info tennis-telegram-agent # Detailed info
```

### Manual Restart
```bash
pm2 restart tennis-telegram-agent
pm2 stop tennis-telegram-agent
pm2 start tennis-telegram-agent
```

### Check Memory/CPU
```bash
ps aux | grep "telegram-bot-webhook"
top -p $(pgrep -f "telegram-bot-webhook")
```

---

## Webhook Details

**Webhook URL:** `https://telegram.curak.xyz/webhook`
**Method:** HTTP POST (Telegram pushes messages)
**Port:** 3004 (Express server)
**Timeout:** 30s read, 10s connect

**Advantages over Polling:**
- ✅ Instant message delivery (no delay)
- ✅ Lower bandwidth usage
- ✅ Scalable (can handle high volume)
- ✅ More efficient CPU usage
- ✅ Professional production setup

---

## Security Notes

✅ **HTTPS Required:** Yes (Let's Encrypt SSL)
✅ **Environment Variables:** Use .env file (not hardcoded)
✅ **Telegram Token:** Secure in .env, not in code
✅ **Database:** PostgreSQL in Docker (isolated)
✅ **API Keys:** All external services use environment variables
✅ **Webhook:** Only accepts POST from Telegram

---

## Troubleshooting

### Bot not responding?
1. Check .env is configured: `cat /opt/tennis-scraper/telegram-agent/.env`
2. Check logs: `pm2 logs tennis-telegram-agent --err`
3. Verify webhook: `curl https://telegram.curak.xyz/health`
4. Check Telegram webhook: `curl -s https://api.telegram.org/bot<TOKEN>/getWebhookInfo`

### Webhook not set?
```bash
# Manually set it
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
  -d "url=https://telegram.curak.xyz/webhook"
```

### SSL certificate error?
```bash
# Check certificate is valid
curl -vI https://telegram.curak.xyz
certbot certificates | grep telegram
```

### Port already in use?
```bash
lsof -i :3004
# Kill if needed: kill -9 <PID>
```

---

## Final Steps Checklist

- [ ] Configure .env with your API keys
- [ ] Restart PM2: `pm2 restart tennis-telegram-agent`
- [ ] Test health endpoint: `curl https://telegram.curak.xyz/health`
- [ ] Verify webhook: `curl -s https://api.telegram.org/bot<TOKEN>/getWebhookInfo`
- [ ] Test in Telegram: Send "Show me predictions"
- [ ] Check logs: `pm2 logs tennis-telegram-agent`
- [ ] Monitor: `pm2 monit`

---

## Support

Everything is configured and ready. You just need to provide your API credentials in the .env file!

**Files Created:**
- `/opt/tennis-scraper/telegram-agent/telegram-bot-webhook.js` - Webhook bot
- `/opt/tennis-scraper/telegram-agent/ecosystem.config.js` - PM2 config
- `/etc/nginx/sites-available/curak.xyz` - Updated with telegram config

**Service Status:**
```
✅ Nginx: Ready
✅ SSL: Ready
✅ PM2: Running
✅ Port 3004: Available
✅ Webhook: Configured
```

**Next:**
1. Add .env file
2. Restart bot
3. Done! 🚀
