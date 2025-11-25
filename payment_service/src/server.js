const express = require("express");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3006;

// Sequelize connection
const { connectDB } = require("./config/db");
const { consume } = require("./services/messageBroker");
const { handleProcessPayment } = require("./handlers/paymentHandler");
const { startOutBoxRelay } = require("./services/outboxRelay");

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "payment" });
});

async function start() {
  try {
    await connectDB();
    await consume("routing key", handleProcessPayment);
    await startOutBoxRelay();
    app.listen(PORT, () => {
      console.log(`Payment service listening on port ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start payment service:", err);
    process.exit(1);
  }
}

start();
