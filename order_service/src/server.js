const express = require("express");
require("dotenv").config();
const { connectDB } = require("./config/db");
const { startOutBoxRelay } = require("./services/outboxRelay");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const PORT = process.env.PORT || 3005;

// Sequelize connection

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "order" });
});

async function start() {
  try {
    await connectDB();
    await startOutBoxRelay();
    app.listen(PORT, () => {
      console.log(`Order service listening on port ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start order service:", err);
    process.exit(1);
  }
}

start();
