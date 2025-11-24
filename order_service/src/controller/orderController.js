const { sequelize } = require("../config/db");
const { v4: uuidv4 } = require("uuid");
const { Orders } = require("../models/order");
const { Outbox } = require("../models/outbox");

const createOrder = async (req, res) => {
  console.log("________called _=============");

  const t = await sequelize.transaction();

  try {
    const saga_id = uuidv4();
    const { amount, currency } = req.body;

    // creating transaction for the order
    const newOrder = await Orders.create(
      {
        saga_id,
        total_amount: amount,
        currency,
        status: "PENDING",
      },
      {
        transaction: t,
      }
    );

    console.log("=====", newOrder);

    // 2. Create the Outbox Event (Command: Reserve Stock)
    // Notice: We are not sending to RabbitMQ yet. Just saving to DB.

    await Outbox.create(
      {
        saga_id,
        topic: "inventory_service", // should be change in future,
        routing_key: "command.reserve_stock",
        payload: {
          order_id: newOrder.id,
          saga_id,
          items: req.body.items,
        },
        published: false,
      },
      {
        transaction: t,
      }
    );
    //Commit Transaction
    await t.commit();

    // At this point:
    // - Order is in DB.
    // - Outbox message is in DB.
    // - The 'OutboxRelay' (from Step 2) will pick up the message automatically
    //   in the next 2 seconds and send it to RabbitMQ.
    res.status(201).json({
      message: "Order received, processing started.",
      saga_id,
    });
  } catch (error) {
    await t.rollback();
    console.error(error);
    res.status(500).json({ error: "Order creation failed" });
  }
};

module.exports = { createOrder };
