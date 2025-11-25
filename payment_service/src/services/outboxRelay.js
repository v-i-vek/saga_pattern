const { Outbox } = require("../models/outbox");

const { publish } = require("../services/messageBroker");

const BATCH_SIZE = 10; // Process 10 messages at a time
const POLLING_INTERVAL = 1000; // Check every 1 seconds
async function startOutBoxRelay() {
  console.log("🚀 Outbox Relay started...");
  setInterval(async () => {
    try {
      // find unpublished msg(in some any case the msg is not published)
      const message = await Outbox.findAll({
        where: {
          published: false,
        },
        limit: BATCH_SIZE,
        order: [["id", "ASC"]], // oldest first
      });
      const cleanMsg = message.map((row) => row.get({ plain: true }));
      for (const msg of cleanMsg) {
        try {
          if (message.length > 0) {
          }
          await publish(msg.routing_key, msg.payload);

          // we can use here batch save
          msg.published = true;
          await Outbox.update({ published: true }, { where: { id: msg.id } });

          console.log(`✅ Outbox ID ${msg.id} processed`);
        } catch (error) {
          console.log(`❌ Failed to publish msg ${msg.id}`, error);
        }
      }
    } catch (error) {
      console.error("Outbox Relay Error:", error);
    }
  }, POLLING_INTERVAL);
}

module.exports = { startOutBoxRelay };
