const { UUID } = require("sequelize");
const { sequelize } = require("./db");

const Inventory = sequelize.define(
  "Inventory",
  {
    id: {
      type: UUID,
      primaryKey: true,
      defaultValue: UUIDV4,
    },
    saga_id: {
      type: UUID,
      defaultValue: UUIDV4,
      allowNull: false,
    },
    order_id: {
      type: UUID,
      allowNull: false,
    },
    product_id: {
      type: UUID,
      allowNull: false,
    },
    quantity: {
      type: Number,
      allowNull: false,
    },
    status: {
      type: String,
      allowNull: false,
    },
    createdAt: {
      type: Date,
      defaultValue: Date.now,
    },
  },
  {
    indexex: [
      {
        name: "idx_inventory_saga_id",
        unique: true,
        fields: ["saga_id"],
      },
    ],
  }
);

module.exports = { Inventory };
