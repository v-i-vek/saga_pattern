const { UUID } = require("sequelize");
const { sequelize } = require("./db");

const { DataTypes } = require("sequelize");
const { sequelize } = require("./db");

// 1. The specific reservation for this Saga
const InventoryReservation = sequelize.define(
  "InventoryReservation",
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    saga_id: {
      type: DataTypes.UUID,
      allowNull: false, // Links to the Order Saga
    },
    product_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    quantity_reserved: {
      type: DataTypes.INTEGER, // Correct Sequelize type
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING, // 'RESERVED', 'RELEASED' (if failed)
      allowNull: false,
    },
  },
  {
    schema: "inventory",
    tableName: "inventory_reservations",
    indexes: [
      {
        unique: true,
        fields: ["saga_id"], // One reservation per saga
      },
    ],
  }
);

// 2. The Master Product Table (To actually check stock against)
const Product = sequelize.define(
  "Product",
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    name: {
      type: DataTypes.STRING,
    },
    stock_available: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  },
  {
    schema: "inventory",
    tableName: "products",
  }
);

module.exports = { InventoryReservation, Product };
