const amqp = require("amqplib");
const {
  handleStockReserve,
  handleStockFailed,
  handlePaymentSuccess,
  handlePaymentFailed,
} = require("../handlers/sagaHanlder");

let channel = null;
let connection = null;
const SAGA_EXCHANGE = "saga_exchange";

async function connect() {
  try {
    connection = await amqp.connect("amqp://localhost");
    channel = await connection.createChannel();

    await channel.assertExchange(SAGA_EXCHANGE, "direct", {
      durable: true,
    });

    console.log("Connected to RabbitMQ");
  } catch (error) {
    console.error("Failed to connect to RabbitMQ:", error);
    process.exit(1);
  }
}

async function publish(routingKey, payload) {
  try {
    if (!channel) {
      await connect();
    }
    const messageBuffer = Buffer.from(JSON.stringify(payload));
    // Publish to the exchange with a specific routing key
    // e.g., routingKey = 'order.created' or 'stock.reserved'
    await channel.publish(SAGA_EXCHANGE, routingKey, messageBuffer);

    console.log(`📢 Published message from order_service to [${routingKey}]`);
  } catch (error) {
    console.error("Error publishing to RabbitMQ:", error);
    process.exit(1);
  }
}

async function consume() {
  if (!channel) {
    await connect();
  }
  // 1 creating queue
  const q = await channel.assertQueue("order_reply_queu", { durable: true });
  // 2. Bind all relevant events to this queue
  const bindingKeys = [
    "event.stock_reserved",
    "event.stock_failed",
    "event.payment_success",
    "event.payment_failed",
  ];

  for (const key of bindingKeys) {
    await channel.bindQueue(q.queue, SAGA_EXCHANGE, key);
  }
  console.log("🎧 Order Service Orchestrator waiting for events...");

  channel.consume(q.queue, async (msg) => {
    if (msg !== null) {
      const content = JSON.parse(msg.content.toString());
      const routingKey = msg.fields.routingKey;
      const messageId = msg.properties.messageId;

      console.log("====msg==== \n", msg);

      console.log(`📥 Orchestrator received: ${routingKey}`);

      try {
        switch (routingKey) {
          case "event.stock_reserved":
            await handleStockReserve(content, messageId);
            break;
          case "event.stock_failed":
            await handleStockFailed(content, messageId);
            break;
          case "event.payment_success":
            await handlePaymentSuccess(content, messageId);
            break;
          case "event.payment_failed":
            await handlePaymentFailed(content, messageId);
            break;
          default:
            break;
        }
      } catch (error) {}
    }
  });
}

module.exports = {
  publish,
  consume,
};
