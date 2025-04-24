import amqp from "amqplib";

const EXCHANGE_NAME = "amq.fanout";

type Order = {
  id: number;
  customerName: string;
  items: Array<{ productId: string; quantity: number }>;
  total: number;
  createdAt: string;
};

export async function publishOrder(order: Order) {
  const connection = await amqp.connect("amqp://admin:admin@localhost:5672");
  const channel = await connection.createChannel();

  await channel.assertExchange(EXCHANGE_NAME, "fanout");

  channel.publish(EXCHANGE_NAME, "", Buffer.from(JSON.stringify(order)));

  console.log("Order published:", order);
  
  setTimeout(async () => {
    await connection.close();
    process.exit(0);
  }, 500);
}

// Função para simular uma venda e publicar a order
export async function createAndPublishOrder(data: {
  customerName: string;
  items: Array<{ productId: string; quantity: number }>;
  total: number;
}) {
  const { customerName, items, total } = data;
  const order = {
    id: Math.floor(Math.random() * 1000000),
    customerName,
    items,
    total,
    createdAt: new Date().toISOString(),
  };

  await publishOrder(order);
}

const orderData = {
  customerName: "John Doe",
  items: [
    { productId: "123", quantity: 2 },
    { productId: "456", quantity: 1 },
  ],
  total: 100.0,
};

createAndPublishOrder(orderData)
  .then(() => console.log("Order published successfully"))
  .catch((error) => console.error("Error publishing order:", error));
