require("dotenv").config();
const https = require("https");

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;

const options = {
  hostname: "api.telegram.org",
  path: `/bot${TOKEN}/getWebhookInfo`,
  method: "GET",
};

https
  .get(options, (res) => {
    let data = "";
    res.on("data", (chunk) => {
      data += chunk;
    });
    res.on("end", () => {
      const result = JSON.parse(data);
      if (result.ok) {
        console.log("✓ Telegram Webhook Status:");
        console.log(`  URL: ${result.result.url}`);
        console.log(`  Has Custom Certificate: ${result.result.has_custom_certificate}`);
        console.log(`  Pending Update Count: ${result.result.pending_update_count}`);
        console.log(`  Last Error Date: ${result.result.last_error_date || "None"}`);
        console.log(`  Last Error Message: ${result.result.last_error_message || "None"}`);
      } else {
        console.error("✗ Error:", result.description);
      }
      process.exit(0);
    });
  })
  .on("error", (e) => {
    console.error(`✗ Network Error: ${e.message}`);
    process.exit(1);
  });
