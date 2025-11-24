require("dotenv").config();
const express = require("express");
const app = express();
const mongoose = require("mongoose");
// const Redis = require("ioredis");

const userRoutes = require("./Routes/user.route");
const { errorHandler } = require("./middleware/error.handler");

const port = process.env.PORT || 3001;
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("DB Connected"))
  .catch((err) => console.log(err));

// const redisClient = new Redis(process.env.REDIS_URL)

app.use(express.json());
app.use(
  "/api/auth",
  (req, res, next) => {
    req.redisClient = redisClient;
    next();
  },
  userRoutes
);
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
