const express = require("express");
require("dotenv").config();
const { connectDB } = require("./config/db");
const { startOutBoxRelay } = require("./services/outboxRelay");
const { createOrder } = require("./controller/orderController");
const { consume } = require("./services/messageBroker");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const PORT = process.env.PORT || 3005;

// Sequelize connection

app.use((req, res, next) => {
  console.log(
    `++++++++++++++ Received ${req.method} request to ${req.url} +++++++++++`
  );

  next();
});
app.get("/api/order/health", (req, res) => {
  console.log("called the api");
  res.status(200).json({ status: "ok", service: "order" });
});
async function start() {
  try {
    await connectDB();
    await startOutBoxRelay();
    await consume();
    app.post(
      "/api/order/create-order",
      (req, res, next) => {
        console.log("hello word form orders");
        next();
      },
      createOrder
    );
    app.listen(PORT, () => {
      console.log(`Order service listening on port ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start order service:", err);
    process.exit(1);
  }
}

start();
