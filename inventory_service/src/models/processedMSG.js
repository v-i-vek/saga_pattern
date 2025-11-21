const { sequelize } = require("../config/db");
const { DataTypes } = require("sequelize");

const ProcessedMSG = sequelize.define(
  "ProcessedMSG",
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    message_id: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    topic: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    schema: "inventory",
    tableName: "processed_msg",
    timestamps: false,
  }
);

module.exports = { ProcessedMSG };
