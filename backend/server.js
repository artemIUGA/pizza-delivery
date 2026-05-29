require("dotenv").config();

const express = require("express");
const cors = require("cors");
const TelegramBot = require("node-telegram-bot-api");

const app = express();
const port = Number(process.env.PORT) || 3001;
const botToken = process.env.BOT_TOKEN;
const adminChatId = process.env.ADMIN_CHAT_ID;

app.use(cors({
  origin: true
}));
app.use(express.json({ limit: "1mb" }));

if (!botToken || botToken === "telegram_bot_token") {
  console.warn("BOT_TOKEN is not configured. Set it in backend/.env");
}

if (!adminChatId || adminChatId === "telegram_chat_id") {
  console.warn("ADMIN_CHAT_ID is not configured. Set it in backend/.env");
}

const bot = botToken && botToken !== "telegram_bot_token"
  ? new TelegramBot(botToken, { polling: false })
  : null;

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizeOrder(body) {
  const items = Array.isArray(body.items) ? body.items : [];

  return {
    customer: String(body.customer || "Unknown customer").trim(),
    phone: String(body.phone || "Not provided").trim(),
    address: String(body.address || "No address").trim(),
    comment: String(body.comment || "").trim(),
    deliveryFee: Number(body.deliveryFee) || 0,
    total: Number(body.total) || 0,
    items: items.map((item) => ({
      name: String(item.name || "Pizza").trim(),
      size: String(item.size || "-").trim(),
      quantity: Number(item.quantity) || 1,
      price: Number(item.price) || 0
    }))
  };
}

function validateOrder(order) {
  if (!order.customer || order.customer.length < 2) {
    return "Customer name is required";
  }

  if (!order.address || order.address.length < 5) {
    return "Delivery address is required";
  }

  if (!order.items.length) {
    return "Order must include at least one item";
  }

  if (order.total <= 0) {
    return "Total must be greater than zero";
  }

  return null;
}

function formatOrderMessage(order) {
  const itemsText = order.items
    .map((item) => {
      return `• ${escapeHtml(item.name)} (${escapeHtml(item.size)}) x${item.quantity} — $${item.price}`;
    })
    .join("\n");

  const commentText = order.comment
    ? `\n\n💬 Comment: ${escapeHtml(order.comment)}`
    : "";

  return [
    "🍕 <b>New Order</b>",
    "",
    `👤 <b>Customer:</b> ${escapeHtml(order.customer)}`,
    `☎️ <b>Phone:</b> ${escapeHtml(order.phone)}`,
    "",
    "📦 <b>Items:</b>",
    itemsText,
    "",
    `🚚 <b>Delivery fee:</b> $${order.deliveryFee}`,
    `💰 <b>Total:</b> $${order.total}`,
    "",
    `📍 <b>Address:</b> ${escapeHtml(order.address)}${commentText}`
  ].join("\n");
}

app.get("/health", function (_request, response) {
  response.json({
    ok: true,
    service: "pizza-delivery-bot-server"
  });
});

app.post("/order", async function (request, response) {
  try {
    if (!bot || !adminChatId || adminChatId === "telegram_chat_id") {
      return response.status(500).json({
        ok: false,
        error: "Telegram bot is not configured"
      });
    }

    const order = normalizeOrder(request.body || {});
    const validationError = validateOrder(order);

    if (validationError) {
      return response.status(400).json({
        ok: false,
        error: validationError
      });
    }

    await bot.sendMessage(adminChatId, formatOrderMessage(order), {
      parse_mode: "HTML"
    });

    response.json({
      ok: true,
      message: "Order notification sent"
    });
  } catch (error) {
    console.error("Failed to send order notification:", error);
    response.status(500).json({
      ok: false,
      error: "Failed to send order notification"
    });
  }
});

app.use(function (_request, response) {
  response.status(404).json({
    ok: false,
    error: "Not found"
  });
});

app.listen(port, function () {
  console.log(`Pizza Delivery bot server is running on http://localhost:${port}`);
});
