const { sequelize } = require("../config/db");
const { ProcessedMSG } = require("../models/processedMSG");
const { Payments } = require("../models/payment");
const { Outbox } = require("../models/outbox");

const handleProcessPayment = async (payload, messageId) => {
  const t = await sequelize.transaction();
  try {
    const { saga_id, order_id, amount, currency } = payload;
    // check for idempotency
    const alreadyProcessed = await ProcessedMSG.findOne({
      where: { message_id: messageId || `pay_${saga_id}` },
      transaction: t,
    });

    if (alreadyProcessed) {
      console.log("⚠️ Payment already processed. Skipping.");
      await t.commit();
      return;
    }
    // 2. Business Logic: Process Payment
    // SIMULATION: If amount > 5000, we simulate a decline.

    const isPaymentSuccessful = amount <= 5000;
    if (isPaymentSuccessful) {
      // A. SUCCESS CASE
      await Payments.create(
        {
          saga_id,
          order_id,
          amount,
          currency,
          status: "SUCCESS",
        },
        { transaction: t }
      );
      await Outbox.create(
        {
          saga_id,
          topic: "order_service",
          routing_key: "event.payment_success",
          payload: {
            saga_id,
            order_id,
            status: "SUCCESS",
          },
          published: false,
        },
        { transaction: t }
      );
      console.log("✅ Payment Successful. Outbox updated.");
    } else {
      await Payments.create(
        {
          saga_id,
          order_id,
          amount,
          currency,
          status: "FAILED",
        },
        { transaction: t }
      );

      // Add "Failed" event to Outbox
      await Outbox.create(
        {
          saga_id,
          topic: "order_service",
          routing_key: "event.payment_failed",
          payload: {
            saga_id,
            order_id,
            reason: "Limit Exceeded",
          },
          published: false,
        },
        { transaction: t }
      );

      console.log("❌ Payment Failed. Outbox updated.");
    }

    // 3. Mark Message as Processed
    await ProcessedMSG.create(
      {
        message_id: messageId || `pay_${saga_id}`,
        topic: "command.process_payment",
      },
      { transaction: t }
    );

    await t.commit();
  } catch (error) {
    await t.rollback();
    console.error("Payment Handler Error:", error);
    throw error;
  }
};

module.exports = {
  handleProcessPayment,
};
