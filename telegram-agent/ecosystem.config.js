/**
 * PM2 Ecosystem Configuration
 * Defines how the Telegram AI Agent should be managed by PM2
 */

module.exports = {
  apps: [
    {
      name: "tennis-telegram-agent",
      script: "./telegram-bot-webhook.js",
      cwd: "/opt/tennis-scraper/telegram-agent",

      // Environment variables
      env: {
        NODE_ENV: "production",
        PORT: 3004,
        WEBHOOK_URL: "https://telegram.curak.xyz/webhook",
      },

      // Process management
      instances: 1,
      exec_mode: "fork",

      // Auto-restart configuration
      autorestart: true,
      max_restarts: 10,
      min_uptime: "10s",
      max_memory_restart: "200M",

      // Logging
      output: "/var/log/pm2/tennis-telegram-agent-out.log",
      error: "/var/log/pm2/tennis-telegram-agent-err.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",

      // Signal handling
      shutdown_with_message: true,
      kill_timeout: 5000,

      // Watch & reload (optional - disable in production)
      watch: false,

      // Listen to kill signals
      listen_timeout: 10000,
      shutdown_with_message: true,
    },
  ],
};
