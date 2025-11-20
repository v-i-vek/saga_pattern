const express = require("express");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3005;

// Sequelize connection
const { connectDB } = require("./config/db");

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "order" });
});

async function start() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Order service listening on port ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start order service:", err);
    process.exit(1);
  }
}

start();
