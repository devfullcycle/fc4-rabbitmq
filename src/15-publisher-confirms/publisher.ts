import amqp from "amqplib";

const EXCHANGE_NAME = "amq.direct";

type Order = {
  id: number;
  customerName: string;
  items: Array<{ productId: string; quantity: number }>;
  total: number;
  createdAt: string;
};

export async function publishOrder() {
  const connection = await amqp.connect("amqp://admin:admin@localhost:5672");
  const channel = await connection.createConfirmChannel();

  await channel.assertExchange(EXCHANGE_NAME, "direct");

  const order: Order = {
    id: Math.floor(Math.random() * 1000000),
    customerName: "John Doe",
    items: [
      { productId: "123", quantity: 2 },
      { productId: "456", quantity: 1 },
    ],
    total: 100.0,
    createdAt: new Date().toISOString(),
  };

  channel.on('return', (msg) => {
    console.error("Message returned:", msg);
  })


  channel.publish(
    EXCHANGE_NAME,
    "order.created",
    Buffer.from(JSON.stringify(order)),
    { mandatory: true },
    (err, ok) => {
      if (err) {
        console.error("Message was not confirmed:", err);
      } else {
        console.log("Message confirmed:", ok);
      }
    }
  );
  //rabbitmq falha - timeout
  await channel.waitForConfirms();

  //muitas mensagens

  console.log("Order published:", order);

  setTimeout(async () => {
    await connection.close();
    process.exit(0);
  }, 500);
}

publishOrder()
  .then(() => console.log("Order published successfully"))
  .catch((error) => console.error(error));
