import amqp from "amqplib";

type FileMessage = {
  name: string;
  type: "pdf" | "video";
  size: number;
};

async function publish() {
  const conn = await amqp.connect("amqp://admin:admin@localhost:5672");
  const channel = await conn.createChannel();

  const exchange = "amq.headers";
  await channel.assertExchange(exchange, "headers");

  // Exemplos de arquivos
  const files: FileMessage[] = [
    { name: "documento.pdf", type: "pdf", size: 2 },
    { name: "video1.mp4", type: "video", size: 50 },
    { name: "video2.mp4", type: "video", size: 200 },
    { name: "relatorio.pdf", type: "pdf", size: 5 },
    { name: "video3.mov", type: "video", size: 120 },
  ];

  for (const file of files) {
    const headers: {
      type: "pdf" | "video";
      size: "large" | "normal";
      isFile: boolean;
    } = {
      type: file.type,
      size: file.size > 100 ? "large" : "normal",
      isFile: true,
    };
    channel.publish(exchange, "", Buffer.from(JSON.stringify(file)), {
      headers,
    });
    console.log(`Arquivo publicado: ${file.name}`);
  }

  setTimeout(() => {
    conn.close();
  }, 500);
}

publish();
