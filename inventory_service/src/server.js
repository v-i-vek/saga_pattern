const express = require("express");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3004;

// Sequelize connection
const { connectDB } = require("./config/db");
const { consume } = require("./services/messageBroker");
const { startOutBoxRelay } = require("./services/outboxRelay");
const { handleReserveStock } = require("./services/handler");

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "inventory" });
});

async function start() {
  try {
    await connectDB();
    await startOutBoxRelay();
    await consume("command.reserve_stock", handleReserveStock);
    app.listen(PORT, () => {
      console.log(`Inventory service listening on port ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start inventory service:", err);
    process.exit(1);
  }
}

start();
