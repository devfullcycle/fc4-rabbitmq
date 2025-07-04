import * as amqp from "amqplib";
import Redis from "ioredis";
import pgPromise from "pg-promise";

// Configuração do PostgreSQL
const pgp = pgPromise();
const db = pgp({
  host: 'localhost',
  port: 5432,
  database: 'test',
  user: 'postgres',
  password: 'postgres'
});

// Configuração do Redis
const redis = new Redis({
  host: 'localhost',
  port: 6379,
  // password: 'redis_password', // se tiver senha
  db: 0
});

// Exceções customizadas
class MessageAlreadyProcessedError extends Error {
  constructor(messageId: string) {
    super(`Message ${messageId} already processed`);
    this.name = 'MessageAlreadyProcessedError';
  }
}

class MessageBeingProcessedError extends Error {
  constructor(messageId: string) {
    super(`Message ${messageId} is being processed by another consumer`);
    this.name = 'MessageBeingProcessedError';
  }
}

// Inicializar banco de dados
async function initDatabase() {
  try {
    // Criar tabela
    await db.none(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        message_id TEXT NOT NULL UNIQUE,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Criar índices
    await db.none('CREATE UNIQUE INDEX IF NOT EXISTS idx_messages_message_id ON messages (message_id)');
    await db.none('CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages (created_at)');
    
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

async function processMessage(messageId: string, content: string) {
  // 1. Verificar primeiro no banco de dados se a mensagem já foi processada
  const messageInDb = await db.oneOrNone('SELECT id FROM messages WHERE message_id = $1', [messageId]);
  if (messageInDb) {
    console.log(`[test-queue] Message with ID ${messageId} already processed (found in database).`);
    throw new MessageAlreadyProcessedError(messageId);
  }

  // 2. Verificar no Redis se está sendo processada ou já foi processada
  const redisKey = `message:${messageId}`;
  const hasLock = await redis.get(redisKey);
  
  if (hasLock !== null) {
    console.log(`[test-queue] Message with ID ${messageId} is being processed by another consumer.`);
    throw new MessageBeingProcessedError(messageId);
  }

  // 3. Tentar adquirir o lock no Redis (estado "processing" por 5 minutos)
  const lockAcquired = await redis.set(redisKey, 'processing', 'EX', 300, 'NX'); // 5 minutos
  if (!lockAcquired) {
    console.log(`[test-queue] Message with ID ${messageId} is being processed by another consumer (race condition).`);
    throw new MessageBeingProcessedError(messageId);
  }

  console.log(`[test-queue] Processing new message ${messageId} (lock acquired)`);
  
  try {
    // Tudo dentro de uma transação!
    await db.tx(async tx => {
      
      // Salvar a mensagem processada no PostgreSQL
      await tx.none(
        'INSERT INTO messages (message_id, content) VALUES ($1, $2)',
        [messageId, content]
      );

      //********************
      // sua regra de negócio aqui, usando tx
      // await tx.none('UPDATE ...', [...]);
      //*******************/

      console.log(`[test-queue] Message with ID ${messageId} saved to database.`);
    });

    
    // 5. Remover o lock do Redis e marcar como processada
    await redis.del(redisKey);
    
    console.log(`[test-queue] Message with ID ${messageId} processed and lock released.`);
    
  } catch (businessError) {
    console.error(`[test-queue] Business logic error for message ${messageId}:`, businessError);
    
    // Remover o lock do Redis para permitir reprocessamento
    await redis.del(redisKey);
    
    throw businessError;
  }
}

async function consumer() {
  // Inicializar banco antes de começar
  await initDatabase();
  
  const connection = await amqp.connect("amqp://admin:admin@localhost:5672");
  const channel = await connection.createChannel();

  const queue = "test";
  await channel.assertQueue(queue, { durable: true });

  channel.consume(
    queue,
    async (msg) => {
      if (!msg) return;

      // se vier redelivered = true, significa que a mensagem já foi entregue anteriormente a este consumidor
      console.log(
        msg.fields.redelivered ? "[JÁ ENTREGUE] " : "[NOVA MENSAGEM] "
      );
      console.log(`[test-queue] Received: ${msg.content.toString()}`);

      const messageId = msg.properties.messageId;
      console.log(`[test-queue] Message ID: ${messageId}`);

      try {
        await processMessage(messageId, msg.content.toString());
        
        // Se chegou aqui, a mensagem foi processada com sucesso
        channel.ack(msg);
        
      } catch (error) {
        if (error instanceof MessageAlreadyProcessedError) { //mensagem duplicada, mensagem reentregue (depois da consulta no banco)
          // Mensagem já foi processada, fazer ACK
          channel.ack(msg);
        } else if (error instanceof MessageBeingProcessedError) { //lock (redis)
          // Mensagem sendo processada por outro consumidor, não fazer ACK nem NACK
          // O RabbitMQ não entrega uma mesma mensagem para outro consumidor, mas uma falha rara e má configuração pode fazer isto acontecer
          // Neste caso, não fazemos nada e deixamos o RabbitMQ tentar novamente
          // Pode chegar aqui porque uma mensagem foi duplicada, então devemos esperar o timeout do Redis para que o consumidor possa reprocessa-la
          return;
        } else { //reprocessável ou não reprocessável
          // Erro de negócio ou outro erro, fazer NACK sem requeue
          console.error(`[test-queue] Error processing message ${messageId}:`, error);
          channel.nack(msg, false, false);
        }
      }
    },
    { noAck: false }
  );
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await db.$pool.end();
  await redis.quit();
  process.exit(0);
});

consumer().catch(console.error);