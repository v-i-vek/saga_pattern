const { sequelize } = require("../config/db");

const Orders = sequelize.define(
  "Orders",
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    saga_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
    },
    total_amount: {
      type: DataTypes.DECIMAL,
      allowNull: false,
    },
    currency: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    update_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    schema: "order",
    tableName: "orders",
    timestamps: false,
  },
  {
    index: [
      {
        name: "idx_orders_saga_id",
        unique: true,
        fields: ["saga_id"],
      },
      {
        name: "idx_orders_status",
        fields: ["status"],
      },
    ],
  }
);

module.exports = { Orders };
