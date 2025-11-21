const { Product } = require("../models/inventory");
const { Outbox } = require("../models/outbox");
const { ProcessedMSG } = require("../models/processedMSG");

const handleReserveStock = async (content, messageId) => {
  const t = await sequelize.transaction();

  try {
    const { order_id, saga_id, items } = content;
    // If we already processed this messageId, ignore it.
    const alreadyProcessed = await ProcessedMSG.findOne({
      where: { message_id: messageId || saga_id }, // Use rabbitmq ID or saga_id unique combo
      transaction: t,
    });

    if (alreadyProcessed) {
      console.log("⚠️ Message already processed. Skipping.");
      await t.commit();
      return;
    }
    // 2. Business Logic: Check Stock
    // (For POC simplicity, we assume 1 item. In reality, loop through items)
    // Let's simulate a check. Assume productId comes in payload.
    // const product = await Product.findByPk(items[0].product_id, { transaction: t });

    // SIMULATION: Let's assume stock is always available for this POC
    // unless quantity is > 100 (Simulating failure).

    const quantityRequested = items[0].quantity;
    const isStockAvailable = quantityRequested <= 100;

    if (isStockAvailable) {
      // A. SUCCESS CASE

      // 1. Create Reservation Record
      await InventoryReservation.create(
        {
          saga_id,
          Product_id: items[0].product_id,
          quantity_reserved: quantityRequested,
          status: "RESERVED",
        },
        { transaction: t }
      );

      // add success event in the outbox
      await Outbox.create(
        {
          saga_id,
          topic: "order_service",
          routing_key: "event.stock_reserved",
          payload: {
            order_id,
            saga_id,
            status: "SUCCESS",
          },
          published: false,
        },
        { transaction: t }
      );
      console.log("✅ Stock Reserved. Outbox updated.");
    } else {
      // B. FAILURE CASE (Out of Stock)

      // 1. Add "Failed" event to Outbox
      await Outbox.create(
        {
          saga_id,
          topic: "order_service",
          routing_key: "event.stock_failed",
          payload: {
            order_id,
            saga_id,
            reason: "Insufficient Stock",
          },
          published: false,
        },
        { transaction: t }
      );

      console.log("❌ Stock Reservation Failed. Outbox updated.");
    }
    await ProcessedMSG.create(
      {
        message_id: messageId || saga_id,
        topic: "command.reserve_stock",
      },
      { transaction: t }
    );

    // 4. Commit Transaction
    await t.commit();
  } catch (error) {
    await t.rollback();
    console.error("Error in handleReserveStock:", error);
    throw error; // Throw so Consumer knows to retry or lo
  }
};

module.exports = { handleReserveStock };
