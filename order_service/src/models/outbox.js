const { sequelize } = require("../config/db");
const { DataTypes } = require("sequelize");

const Outbox = sequelize.define(
  "outbox",
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    saga_id: {
      type: DataTypes.UUID,
    },
    topic: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    routing_key: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    payload: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    published: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    schema: "order",
    tableName: "outbox",
    timestamps: false,
  },
  {
    index: [
      {
        name: "idx_orders_saga_id",
        unique: true,
        fields: ["saga_id"],
      },
    ],
  }
);

module.exports = { Outbox };
