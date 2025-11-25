const { sequelize } = require("../config/db");
const { Orders } = require("../models/order");
const { ProcessedMSG } = require("../models/processedMSG");
const { Outbox } = require("../models/outbox");

// helper function
const isProcessed = async (messageId, t) => {
  const existing = await ProcessedMSG.findOne({
    where: { message_id: messageId },
    transaction: t,
  });
  if (existing) return true;

  await ProcessedMSG.create(
    { message_id: messageId, topic: "orchestrator_event" },
    { transaction: t }
  );
  return false;
};

//  handler:1 stock Reserved --> Trigger Payment service

const handleStockReserve = async (payload, messageId) => {
  console.log("payload ------> \n", payload);

  const t = await sequelize.transaction();

  try {
    const { saga_id, order_id } = payload;
    if (await isProcessed(messageId || `stock_res_${saga_id}`, t)) {
      await t.commit();
      return;
    }

    // fetch Order

    const orderData = await Orders.findOne({
      where: { saga_id },
      transaction: t,
    });
    if (!orderData) {
      console.log(`Order not found for saga_id: ${saga_id}`);
      return;
    }

    const order = orderData.get({ plain: true });

    if (!order) throw new Error("order not found");

    // generate payment command
    console.log(
      `✅ Stock reserved for Order ${order_id}. Initiating Payment...`
    );

    await Outbox.create(
      {
        saga_id,
        topic: "payment_service",
        routingKey: "command.process_payment", // will be the next step in saga
        payload: {
          saga_id,
          order_id,
          amount: order.total_amount,
          currency: order.currency,
        },
        published: false,
      },
      { transaction: t }
    );
    await t.commit();
  } catch (error) {
    await t.rollback();
    console.error(
      "Handler Error from order Service in handleStockReserve() function \n",
      error
    );
  }
};

// handler 2: stock failed --> failed order
const handleStockFailed = async (payload, messageId) => {
  const t = await sequelize.transaction();
  try {
    const { saga_id } = payload;
    if (await isProcessed(messageId || `stock_fail_${saga_id}`, t)) {
      await t.commit();
      return;
    }
    console.log(`❌ Stock Failed for Saga ${saga_id}. Cancelling Order.`);
    await Orders.update(
      { status: "FAILED" },
      { where: { saga_id }, transaction: t }
    );
    await t.commit();
  } catch (error) {
    await t.rollback();
    console.error("Handler Error", error);
  }
};

// handler 3 payment success -> complete order

const handlePaymentSuccess = async (payload, messageId) => {
  const t = await sequelize.transaction();

  try {
    const { saga_id } = payload;
    if (await isProcessed(messageId || `pay_succ_${saga_id}`, t)) {
      await t.commit();
      return;
    }

    console.log(`🎉 Payment Success for Saga ${saga_id}. Order Completed!`);

    await Orders.update(
      { status: "COMPLETED" },
      { where: { saga_id }, transaction: t }
    );

    await t.commit();
  } catch (error) {
    await t.rollback();
    console.error("Handler Error", error);
  }
};

const handlePaymentFailed = async (payload, messageId) => {
  const t = await sequelize.transaction();

  try {
    const { saga_id, order_id } = payload;
    if (await isProcessed(messageId || `pay_fail_${saga_id}`, t)) {
      await t.commit();
      return;
    }

    console.log(`❌ Payment Failed for Saga ${saga_id}. Rolling back Stock...`);

    // mark order failed

    await Orders.update(
      { status: "Failed" },
      { where: { saga_id }, transaction: t }
    );

    // 2. compensating Transaction : Release the stock we previouly reserved.

    await Outbox.create(
      {
        saga_id,
        topic: "inventory_service",
        routingKey: "command.release_stock", // Inventory must listen for this!
        payload: { saga_id, order_id },
        published: false,
      },
      { transaction: t }
    );
    await t.commit();
  } catch (error) {
    await t.rollback();
    console.error("Handler Error", error);
  }
};

module.exports = {
  handleStockReserve,
  handleStockFailed,
  handlePaymentSuccess,
  handlePaymentFailed,
};
