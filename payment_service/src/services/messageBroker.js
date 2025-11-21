const amqp = require("amqplib");

let channel = null;
let connection = null;

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

module.exports = {
  publish,
};
