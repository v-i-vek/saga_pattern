const amqp = require("amqplib");

let channel = null;
let connection = null;
const MQ_COMMAND = "command.process_payment";
async function connect() {
  try {
    connection = await amqp.connect("amqp://localhost");
    channel = await connection.createChannel();

    await this.channel.assertExchange("saga_exchange", "direct", {
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
    channel.publish("saga_exchange", routingKey, messageBuffer);

    console.log(`📢 Published message to [${routingKey}]`);
  } catch (error) {
    console.error("Error publishing to RabbitMQ:", error);
    process.exit(1);
  }
}

async function consume(routingKey, callback) {
  try {
    if (!channel) {
      await connect();
    }
    // Create a Queue for Inventory Service
    // 'inventory_queue' will hold messages specifically for this service
    const q = await channel.assertQueue("inventory_queue", { durable: true });

    //  Bind Queue to Exchange
    // We listen specifically for "command.reserve_stock"
    await channel.bindQueue(q.queue, "saga_exchange", MQ_COMMAND);

    console.log("🎧 Inventory Service waiting for messages...");

    // consume messages
    channel.consume(q.queue, async () => {
      if (msg !== null) {
        const content = JSON.parse(msg.content.toString());
        const routingKey = msg.fields.routingKey;
        console.log(`📥 Received: ${routingKey}`);

        try {
          if (routingKey === MQ_COMMAND) {
            await callback(content, msg.properties.messageId);
          }
          // Acknowledge (Tell RabbitMQ we are done)
          channel.ack(msg);
        } catch (error) {
          console.error("Error processing message:", error);
          // If strictly failing, you might nack or send to Dead Letter Queue
          channel.nack(msg);
        }
      }
    });
  } catch (error) {}
}

module.exports = {
  publish,
  consume,
};
