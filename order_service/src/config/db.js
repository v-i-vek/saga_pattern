const { Sequelize } = require("sequelize");
require("dotenv").config();

const sequelize = new Sequelize(
  process.env.DB_NAME || "postgres",
  process.env.DB_USER || "postgres",
  process.env.DB_PASS || "root",
  {
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
    dialect: "postgres",
    logging: false,
  }
);

async function connectDB() {
  try {
    await sequelize.authenticate();
    console.log("Postgres connected for order service");
    await sequelize.query('CREATE SCHEMA IF NOT EXISTS "order"');
    await sequelize.sync({ alter: true });
  } catch (err) {
    console.error("Postgres connection error (order):", err);
    throw err;
  }
}

module.exports = { sequelize, Sequelize, connectDB };
