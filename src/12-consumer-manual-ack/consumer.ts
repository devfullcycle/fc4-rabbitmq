import amqp from "amqplib";

async function consumerWithAcks() {
  const connection = await amqp.connect("amqp://admin:admin@localhost:5672");
  const channel = await connection.createChannel();

  const queue = "manual_ack_queue";

  await channel.assertQueue(queue);

  console.log(`[*] Waiting for messages in ${queue}. To exit press CTRL+C`);

  channel.consume(
    queue,
    (msg) => {
      // Simular processamento, apenas para fins didático
      //setTimeout(() => {
        const content = msg?.content.toString();
        if (!msg || !content) {
          console.log("[!] Received empty message, ignoring...");
          msg && channel.reject(msg, false);
          return;
        }

        console.log(`[x] Received '${content}'`);

        try {
          // Simular sucesso ou falha
          if (parseInt(content) > 5) {
            throw new Error("Processing failed");
          }

          console.log("[x] Done processing");
          channel.ack(msg, true);
        } catch (error) {
          //@ts-expect-error
          console.error("[!] Processing error:", error.message);
          
          channel.nack(msg, false, true); //channel.reject(msg, true);

        }
      //}, 10000);
    },
    { noAck: false }
  );
}

consumerWithAcks().catch(console.error);

//não reprocessáveis
//reprocessáveis