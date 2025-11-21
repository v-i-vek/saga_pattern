const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db"); // Adjusted path if needed

const Payments = sequelize.define(
  "Payments",
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    saga_id: {
      type: DataTypes.UUID,
      allowNull: false, // Important: This links payment to the Saga
    },
    order_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2), // Decimal with precision is better for money
      allowNull: false,
    },
    currency: {
      type: DataTypes.STRING(3),
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING, // 'PENDING', 'SUCCESS', 'FAILED'
      allowNull: false,
    },
  },
  {
    schema: "payment",
    tableName: "payments",
    indexes: [
      {
        unique: true,
        fields: ["saga_id"],
      },
    ],
  }
);

module.exports = { Payments };
