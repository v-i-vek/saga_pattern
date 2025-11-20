const { Sequelize } = require("sequelize");
const path = require("path");

const storage =
  process.env.DB_STORAGE ||
  path.join(__dirname, "..", "..", "inventory.sqlite");

const sequelize = new Sequelize({
  dialect: "sqlite",
  storage,
  logging: false,
});

async function connectDB() {
  try {
    await sequelize.authenticate();
    console.log("Sequelize connected to", storage);
    await sequelize.sync();
  } catch (err) {
    console.error("Sequelize connection error:", err);
    throw err;
  }
}

/**
 * Models should only contain schema definitions and not handle DB connections.
 * Define your model files here (e.g. product.js) which export functions that
 * receive a `sequelize` instance and DataTypes and return a model.
 *
 * Example model file (src/models/product.js):
 * module.exports = (sequelize, DataTypes) => {
 *   return sequelize.define('Product', { name: DataTypes.STRING }, {});
 * };
 *
 * You can create an index file that imports/initializes those models when
 * you have a sequelize instance available (from src/config/db.js).
 */

module.exports = {};
